"""Medicine investigation: structured multi-field verdict + voice-to-fields extraction."""

import hashlib
import json
import re
from datetime import date
from typing import Any

from rag import (
    medicines_collection,
    alerts_collection,
    _query_collection,
    _call_gemini,
    _clean_json,
    _cache_get,
    _cache_set,
)
from vision import _normalise_manufacturer
from manufacturers import lookup_manufacturer

DGDA_HOTLINE = "16121"

_FIELDS = ("manufacturer", "batch_number", "expiry_date", "price", "purchase_location")


def _canonical(data: dict) -> str:
    norm = {k: (str(v).strip().lower() if v is not None else None) for k, v in sorted(data.items())}
    return json.dumps(norm, sort_keys=True, ensure_ascii=False)


def _hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def _empty_check(reason: str = "not provided") -> dict:
    return {"status": "UNKNOWN", "detail": reason}


def _empty_checks() -> dict:
    return {f: _empty_check() for f in _FIELDS}


# ── Rule-based fallback ──────────────────────────────────────────────────────


def _parse_expiry(raw: str | None) -> date | None:
    if not raw:
        return None
    s = str(raw).strip()
    # Try common formats: YYYY-MM, YYYY-MM-DD, YYYY/MM, "March 2025", "Jan 2025"
    months = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
        "aug": 8, "august": 8, "sep": 9, "sept": 9, "september": 9,
        "oct": 10, "october": 10, "nov": 11, "november": 11, "dec": 12, "december": 12,
    }
    iso_match = re.match(r"^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?$", s)
    if iso_match:
        y, m, d = iso_match.group(1), iso_match.group(2), iso_match.group(3)
        try:
            return date(int(y), int(m), int(d) if d else 1)
        except ValueError:
            return None
    word_match = re.match(r"^([A-Za-z]+)\s+(\d{4})$", s)
    if word_match:
        mon = months.get(word_match.group(1).lower())
        if mon:
            return date(int(word_match.group(2)), mon, 1)
    year_only = re.match(r"^(\d{4})$", s)
    if year_only:
        try:
            return date(int(year_only.group(1)), 12, 31)
        except ValueError:
            return None
    return None


def _investigate_rule_based(data: dict, med_metas: list, alert_docs: list, registry: dict | None = None) -> dict:
    checks = _empty_checks()
    pass_count = 0
    fail_count = 0
    registry_fail = False

    name = (data.get("medicine_name") or "").strip()
    db_meta = med_metas[0] if med_metas else None
    db_manufacturer = (db_meta or {}).get("manufacturer", "")

    # Manufacturer check — three-tier outcome
    user_mfr = _normalise_manufacturer((data.get("manufacturer") or "").strip()) if data.get("manufacturer") else None
    if user_mfr:
        if db_manufacturer and user_mfr.lower() == db_manufacturer.lower():
            checks["manufacturer"] = {"status": "PASS", "detail": f"{db_manufacturer} matches the verified manufacturer for {name}"}
            pass_count += 1
        elif db_manufacturer:
            checks["manufacturer"] = {"status": "FAIL", "detail": f"Packaging shows '{user_mfr}', but the verified manufacturer for {name} is '{db_manufacturer}'"}
            fail_count += 1
        elif registry is None:
            checks["manufacturer"] = {"status": "FAIL", "detail": f"'{user_mfr}' is not a registered Bangladeshi pharmaceutical company. Verify the spelling on the packaging."}
            fail_count += 1
            registry_fail = True
        else:
            brand_listed = any(name.lower() in b.lower() or b.lower() in name.lower() for b in registry.get("brands", []) if b)
            if brand_listed:
                checks["manufacturer"] = {"status": "PASS", "detail": f"{registry['name']} is a registered BD pharma company and lists '{name}' as a brand"}
                pass_count += 1
            else:
                checks["manufacturer"] = {"status": "UNKNOWN", "detail": f"{registry['name']} is a registered BD pharma company, but '{name}' is not in its listed brands — verify on packaging"}

    # Expiry check
    if data.get("expiry_date"):
        exp = _parse_expiry(str(data["expiry_date"]))
        if exp is None:
            checks["expiry_date"] = {"status": "UNKNOWN", "detail": f"Could not parse expiry date '{data['expiry_date']}'"}
        elif exp < date.today():
            checks["expiry_date"] = {"status": "FAIL", "detail": f"Expired on {exp.isoformat()} — do not consume"}
            fail_count += 1
        else:
            checks["expiry_date"] = {"status": "PASS", "detail": f"Valid until {exp.isoformat()}"}
            pass_count += 1

    # Batch number — rule-based can only confirm presence
    if data.get("batch_number"):
        checks["batch_number"] = {"status": "UNKNOWN", "detail": "Batch format validation requires AI analysis"}

    # Price — rule-based only checks plausibility floor (< 2 BDT is suspicious)
    if data.get("price_paid") is not None:
        try:
            price = float(data["price_paid"])
            if price < 2:
                checks["price"] = {"status": "FAIL", "detail": f"Price {price} BDT is implausibly low for a real medicine"}
                fail_count += 1
            else:
                checks["price"] = {"status": "UNKNOWN", "detail": f"Price {price} BDT recorded; market comparison needs AI"}
        except (ValueError, TypeError):
            checks["price"] = {"status": "UNKNOWN", "detail": "Could not parse price"}

    if data.get("purchase_location"):
        checks["purchase_location"] = {"status": "UNKNOWN", "detail": "Location risk assessment requires AI"}

    # Decide verdict
    is_expired = checks["expiry_date"]["status"] == "FAIL"
    is_wrong_mfr = checks["manufacturer"]["status"] == "FAIL"
    name_in_db = bool(med_metas)

    if is_expired:
        verdict = "EXPIRED"
        should_consume = False
        risk_level = "CRITICAL"
        report_to_authorities = False
        trust_score = 0
        recommendation = "Do not consume — this medicine is expired. Return to the pharmacy or dispose of it safely."
    elif is_wrong_mfr:
        verdict = "LIKELY_FAKE"
        should_consume = False
        risk_level = "HIGH"
        report_to_authorities = True
        trust_score = 15
        recommendation = f"Do not consume — the manufacturer on your packaging does not match the verified manufacturer. Report to DGDA hotline {DGDA_HOTLINE}."
    elif registry_fail:
        verdict = "LIKELY_FAKE"
        should_consume = False
        risk_level = "HIGH"
        report_to_authorities = True
        trust_score = 10
        recommendation = f"Do not consume — the manufacturer name on the packaging is not a registered Bangladeshi pharmaceutical company. Report to DGDA hotline {DGDA_HOTLINE}."
    elif not name_in_db:
        verdict = "UNVERIFIED"
        should_consume = False
        risk_level = "MEDIUM"
        report_to_authorities = False
        trust_score = 25
        recommendation = "This medicine is not in our verified database. Please consult a registered pharmacist before consuming."
    elif fail_count > 0:
        verdict = "SUSPICIOUS"
        should_consume = False
        risk_level = "MEDIUM"
        report_to_authorities = False
        trust_score = 40
        recommendation = "Some checks failed. Consult a pharmacist before consuming."
    elif pass_count > 0 and fail_count == 0:
        verdict = "AUTHENTIC"
        should_consume = True
        risk_level = "LOW"
        report_to_authorities = False
        trust_score = 80
        recommendation = "This medicine appears authentic based on the checks performed. Always consult a pharmacist for medical guidance."
    else:
        verdict = "UNVERIFIED"
        should_consume = False
        risk_level = "MEDIUM"
        report_to_authorities = False
        trust_score = 50
        recommendation = "Not enough information to make a confident verdict. Consult a registered pharmacist."

    # Pull general info from the closest DB hit
    general_info = {}
    if db_meta:
        general_info = {
            "generic_name": db_meta.get("genericName", ""),
            "manufacturer": db_manufacturer,
            "uses": [u.strip() for u in db_meta.get("uses", "").split(",") if u.strip()],
            "side_effects": [s.strip() for s in db_meta.get("sideEffects", "").split(",") if s.strip()],
            "safe_alternatives": [a.strip() for a in db_meta.get("safeAlternatives", "").split(",") if a.strip()],
            "fake_indicators": [f.strip() for f in db_meta.get("fakeIndicators", "").split(",") if f.strip()],
        }

    return {
        "trust_score": trust_score,
        "verdict": verdict,
        "checks": checks,
        "verdict_explanation": recommendation,
        "should_consume": should_consume,
        "recommendation": recommendation,
        "risk_level": risk_level,
        "report_to_authorities": report_to_authorities,
        "dgda_hotline": DGDA_HOTLINE,
        "general_info": general_info,
        "source": "rule_based",
    }


# ── Gemini investigation ─────────────────────────────────────────────────────


def _build_context(med_metas: list, alert_docs: list) -> str:
    parts: list[str] = []
    if med_metas:
        parts.append("VERIFIED MEDICINE METADATA:")
        for m in med_metas[:2]:
            parts.append(
                f"  - {m.get('name')} (generic: {m.get('genericName', '')}, "
                f"manufacturer: {m.get('manufacturer', '')}, "
                f"uses: {m.get('uses', '')}, "
                f"fake_indicators: {m.get('fakeIndicators', '')})"
            )
    if alert_docs:
        parts.append("KNOWN FAKE ALERTS:")
        for doc in alert_docs[:2]:
            parts.append(f"  - {doc}")
    if not parts:
        parts.append("No prior database information available for this medicine.")
    return "\n".join(parts)


def investigate_medicine(data: dict) -> dict:
    name = (data.get("medicine_name") or "").strip()
    if not name:
        return {
            "trust_score": 0,
            "verdict": "UNVERIFIED",
            "checks": _empty_checks(),
            "verdict_explanation": "Medicine name is required to run an investigation.",
            "should_consume": False,
            "recommendation": "Please provide a medicine name.",
            "risk_level": "MEDIUM",
            "report_to_authorities": False,
            "dgda_hotline": DGDA_HOTLINE,
            "general_info": {},
            "source": "validation_error",
        }

    # Normalise the user-supplied manufacturer before any downstream use
    norm_data = dict(data)
    if norm_data.get("manufacturer"):
        norm_data["manufacturer"] = _normalise_manufacturer(str(norm_data["manufacturer"]))

    cache_key = f"investigate:{_hash(_canonical(norm_data))}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[Investigate] Cache hit for {name}")
        return cached

    med_docs, med_metas, _ = _query_collection(medicines_collection, name, n_results=3)
    alert_docs, _, _ = _query_collection(alerts_collection, name, n_results=3)
    registry = lookup_manufacturer(norm_data.get("manufacturer")) if norm_data.get("manufacturer") else None

    today_iso = date.today().isoformat()
    context = _build_context(med_metas, alert_docs)
    if norm_data.get("manufacturer"):
        if registry:
            brands_preview = ", ".join(registry.get("brands", [])[:8]) or "various"
            context += (
                f"\n\nMANUFACTURER REGISTRY:\n"
                f"- {registry['name']}: registered BD pharma company. "
                f"Listed brands: {brands_preview}. "
                f"Batch format: {registry.get('batch_format', 'unknown')}. "
                f"DGDA license: {registry.get('dgda_license', 'unknown')}. "
                f"HQ: {registry.get('headquarters', 'Bangladesh')}."
            )
        else:
            context += (
                f"\n\nMANUFACTURER REGISTRY: '{norm_data.get('manufacturer')}' is NOT a registered "
                f"Bangladeshi pharmaceutical company."
            )

    prompt = f"""You are a medicine authentication expert for Bangladesh. Today is {today_iso}.

USER REPORTED THIS MEDICINE:
- Name: {norm_data.get('medicine_name')}
- Manufacturer on packaging: {norm_data.get('manufacturer') or 'not provided'}
- Batch number: {norm_data.get('batch_number') or 'not provided'}
- Expiry date: {norm_data.get('expiry_date') or 'not provided'}
- Purchase location: {norm_data.get('purchase_location') or 'not provided'}
- Price paid: {norm_data.get('price_paid') if norm_data.get('price_paid') is not None else 'not provided'} BDT

{context}

Investigate each field the user provided and return ONLY JSON with this exact shape:
{{
  "trust_score": <0-100>,
  "verdict": "AUTHENTIC" | "SUSPICIOUS" | "LIKELY_FAKE" | "EXPIRED" | "UNVERIFIED",
  "checks": {{
    "manufacturer":      {{"status": "PASS"|"FAIL"|"UNKNOWN", "detail": "<one sentence>"}},
    "batch_number":      {{"status": "PASS"|"FAIL"|"UNKNOWN", "detail": "<one sentence>"}},
    "expiry_date":       {{"status": "PASS"|"FAIL"|"UNKNOWN", "detail": "<one sentence>"}},
    "price":             {{"status": "PASS"|"FAIL"|"UNKNOWN", "detail": "<one sentence>"}},
    "purchase_location": {{"status": "PASS"|"FAIL"|"UNKNOWN", "detail": "<one sentence>"}}
  }},
  "verdict_explanation": "<2-3 sentence summary>",
  "should_consume": <boolean>,
  "recommendation": "<one specific actionable sentence>",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "report_to_authorities": <boolean>,
  "dgda_hotline": "16121"
}}

Rules:
- If the user did not provide a field, set that check's status to "UNKNOWN" and detail to "not provided".
- If the expiry date is before today ({today_iso}), verdict is "EXPIRED" and should_consume is false.
- If the manufacturer on packaging does not match the verified manufacturer for this medicine, verdict is "LIKELY_FAKE" and report_to_authorities is true.
- If the price is far below the expected market price for this medicine, mark price check FAIL and verdict at least "SUSPICIOUS".
- Be specific in detail strings (name the actual values).
- Return ONLY JSON, no markdown."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        # Ensure required keys exist
        result.setdefault("dgda_hotline", DGDA_HOTLINE)
        result.setdefault("checks", _empty_checks())
        for f in _FIELDS:
            if f not in result["checks"]:
                result["checks"][f] = _empty_check()
        # Attach general info from ChromaDB for the collapsible section
        if med_metas:
            m = med_metas[0]
            result["general_info"] = {
                "generic_name": m.get("genericName", ""),
                "manufacturer": m.get("manufacturer", ""),
                "uses": [u.strip() for u in m.get("uses", "").split(",") if u.strip()],
                "side_effects": [s.strip() for s in m.get("sideEffects", "").split(",") if s.strip()],
                "safe_alternatives": [a.strip() for a in m.get("safeAlternatives", "").split(",") if a.strip()],
                "fake_indicators": [f.strip() for f in m.get("fakeIndicators", "").split(",") if f.strip()],
            }
        else:
            result["general_info"] = {}
        result["source"] = "gemini"
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[Investigate] Gemini unavailable ({e.__class__.__name__}: {str(e)[:120]}), using rule-based fallback")
        result = _investigate_rule_based(norm_data, med_metas, alert_docs, registry)
        _cache_set(cache_key, result)
        return result


# ── Voice-to-fields extraction ───────────────────────────────────────────────


_EMPTY_EXTRACTION = {
    "medicine_name": None,
    "manufacturer": None,
    "batch_number": None,
    "expiry_date": None,
    "purchase_location": None,
    "price_paid": None,
}


def extract_from_speech(transcript: str) -> dict:
    text = (transcript or "").strip()
    if not text:
        return _EMPTY_EXTRACTION.copy()

    cache_key = f"extract:{_hash(text.lower())}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[Extract] Cache hit")
        return cached

    prompt = f"""Extract medicine details from the user's speech transcript. The user may speak in English, Bangla, or a mix of both.

Transcript:
"{text}"

Return ONLY JSON with this exact shape — every field is required, use null when not mentioned:
{{
  "medicine_name": <string or null>,
  "manufacturer": <string or null>,
  "batch_number": <string or null>,
  "expiry_date": <string or null>,
  "purchase_location": <string or null>,
  "price_paid": <number or null>
}}

Examples of Bangla phrasing:
- "আমি নাপা কিনেছি"   → medicine_name: "Napa"
- "বেক্সিমকো বানিয়েছে" → manufacturer: "Beximco"
- "মেয়াদ শেষ ২০২৫"   → expiry_date: "2025"
- "দাম ছিল বিশ টাকা"  → price_paid: 20
- "গুলশান থেকে কিনেছি" → purchase_location: "Gulshan"
- "ব্যাচ আইডি ৬০৮"   → batch_number: "ID608"

Rules:
- Convert Bangla digits (০১২৩৪৫৬৭৮৯) and Bangla number words to Western numerals.
- Convert Bangla place / brand / medicine names to their common English transliteration (নাপা → "Napa", বেক্সিমকো → "Beximco", গুলশান → "Gulshan").
- price_paid must be a JSON number, not a string. Drop the "taka"/"টাকা" suffix.
- If the transcript clearly does not mention a field, set it to null. Do not invent values.
- Return ONLY JSON, no markdown, no commentary."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        # Force all six keys to exist
        for k in _EMPTY_EXTRACTION:
            if k not in result:
                result[k] = None
        # Normalise manufacturer if present
        if result.get("manufacturer"):
            result["manufacturer"] = _normalise_manufacturer(str(result["manufacturer"]))
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[Extract] Gemini unavailable ({e.__class__.__name__}: {str(e)[:120]})")
        return _EMPTY_EXTRACTION.copy()
