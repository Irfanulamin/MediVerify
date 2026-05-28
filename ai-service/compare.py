"""Medicine compare: generic-name → multi-variant comparison via ChromaDB + Gemini."""

import hashlib
import json

from rag import (
    medicines_collection,
    _query_collection,
    _call_gemini,
    _clean_json,
    _cache_get,
    _cache_set,
)

MAX_VARIANTS = 6
MIN_VARIANTS = 1


def _hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def _normalise(s: str) -> str:
    return (s or "").strip().lower()


def _resolve_generic(name: str) -> tuple[str, list[dict]]:
    """Given any name (brand or generic), return (resolved_generic, top_matches_meta).

    Strategy: query ChromaDB for `name`. The top hit's `genericName` becomes the
    resolved generic. If `genericName` is missing/empty, use the input as-is.
    """
    docs, metas, dists = _query_collection(medicines_collection, name, n_results=6)
    if not metas:
        return name.strip(), []
    top_generic = (metas[0].get("genericName") or "").strip() or name.strip()
    return top_generic, metas


def _collect_variants(resolved_generic: str, seed_metas: list[dict]) -> list[dict]:
    """Collect 4-6 unique brand variants whose generic loosely matches the resolved generic."""
    target = _normalise(resolved_generic)
    seen: set[str] = set()
    variants: list[dict] = []

    def maybe_add(m: dict):
        name = (m.get("name") or "").strip()
        if not name or name.lower() in seen:
            return
        gen = _normalise(m.get("genericName"))
        # Loose match: target appears in gen or vice versa
        if target and gen and (target in gen or gen in target):
            seen.add(name.lower())
            variants.append(m)

    for m in seed_metas:
        maybe_add(m)
        if len(variants) >= MAX_VARIANTS:
            return variants

    # If not enough variants from the brand-name query, re-query using the generic itself
    if len(variants) < 4:
        more_docs, more_metas, _ = _query_collection(medicines_collection, resolved_generic, n_results=10)
        for m in more_metas:
            maybe_add(m)
            if len(variants) >= MAX_VARIANTS:
                break

    # Fallback: if we couldn't find any matches by generic, just take the top seed entries
    if not variants and seed_metas:
        for m in seed_metas[:MAX_VARIANTS]:
            name = (m.get("name") or "").strip()
            if name and name.lower() not in seen:
                seen.add(name.lower())
                variants.append(m)

    return variants


def _variant_summary(meta: dict) -> dict:
    return {
        "brand_name": meta.get("name", ""),
        "manufacturer": meta.get("manufacturer", ""),
        "generic_name": meta.get("genericName", ""),
        "uses": meta.get("uses", ""),
        "side_effects": meta.get("sideEffects", ""),
        "fake_indicators": meta.get("fakeIndicators", ""),
    }


def _rule_based_compare(resolved_generic: str, variant_metas: list[dict]) -> dict:
    variants = []
    for m in variant_metas[:MAX_VARIANTS]:
        variants.append({
            "brand_name": m.get("name", ""),
            "manufacturer": m.get("manufacturer", ""),
            "price_bdt": None,
            "tablet_strength": "",
            "suitable_for_age": "Adults — consult a pharmacist for children or elderly",
            "reliability_score": 60,
            "availability": "widely available",
            "prescription_needed": False,
            "best_for": "General use — AI comparison unavailable",
            "not_recommended_for": "Consult a pharmacist for medical advice",
            "side_effect_severity": "MEDIUM",
            "value_for_money": "STANDARD",
        })

    best_overall = variants[0]["brand_name"] if variants else ""

    return {
        "generic_name": resolved_generic,
        "variants": variants,
        "recommendation": {
            "best_overall": best_overall,
            "best_for_children": None,
            "best_for_elderly": None,
            "most_affordable": best_overall,
            "most_available": best_overall,
        },
        "comparison_summary": "AI comparison unavailable — variants shown from verified database only. Consult a pharmacist before choosing.",
        "source": "rule_based",
    }


def compare_medicines(name: str) -> dict:
    name = (name or "").strip()
    if not name:
        return {
            "generic_name": "",
            "variants": [],
            "recommendation": {
                "best_overall": "",
                "best_for_children": None,
                "best_for_elderly": None,
                "most_affordable": "",
                "most_available": "",
            },
            "comparison_summary": "Please enter a medicine name to compare variants.",
            "source": "validation_error",
        }

    resolved_generic, seed_metas = _resolve_generic(name)
    variant_metas = _collect_variants(resolved_generic, seed_metas)

    if not variant_metas:
        return {
            "generic_name": resolved_generic,
            "variants": [],
            "recommendation": {
                "best_overall": "",
                "best_for_children": None,
                "best_for_elderly": None,
                "most_affordable": "",
                "most_available": "",
            },
            "comparison_summary": f"No variants of '{resolved_generic}' were found in the verified database.",
            "source": "no_matches",
        }

    cache_key = f"compare:{_hash(resolved_generic.lower())}"
    cached = _cache_get(cache_key)
    if cached:
        print(f"[Compare] Cache hit for {resolved_generic!r}")
        return cached

    variant_summaries = [_variant_summary(m) for m in variant_metas]
    context_blob = "\n\n".join(
        f"- {v['brand_name']} (manufacturer: {v['manufacturer']}, generic: {v['generic_name']}, "
        f"uses: {v['uses']}, side_effects: {v['side_effects']})"
        for v in variant_summaries
    )

    prompt = f"""You are a pharmaceutical expert for Bangladesh.
Compare these medicines that contain {resolved_generic}:

{context_blob}

Return ONLY valid JSON with this exact shape:
{{
  "generic_name": "{resolved_generic}",
  "variants": [
    {{
      "brand_name": <string>,
      "manufacturer": <string>,
      "price_bdt": <number or null>,
      "tablet_strength": <string>,
      "suitable_for_age": <string>,
      "reliability_score": <0-100>,
      "availability": "widely available" | "limited",
      "prescription_needed": <boolean>,
      "best_for": <string>,
      "not_recommended_for": <string>,
      "side_effect_severity": "LOW" | "MEDIUM" | "HIGH",
      "value_for_money": "BUDGET" | "STANDARD" | "PREMIUM"
    }}
  ],
  "recommendation": {{
    "best_overall": <brand name>,
    "best_for_children": <brand name or null>,
    "best_for_elderly": <brand name or null>,
    "most_affordable": <brand name>,
    "most_available": <brand name>
  }},
  "comparison_summary": <2-3 sentence plain-language summary naming the standout choices and why>
}}

Rules:
- Include only the brands listed above as variants. Do not invent new brands.
- Prices in BDT for Bangladesh market; null if you don't know.
- best_for_children / best_for_elderly may be null when no variant is specifically appropriate.
- reliability_score should reflect manufacturer reputation + brand recognition (Beximco, Square, Incepta = high; smaller firms = lower).
- Return ONLY JSON, no markdown."""

    try:
        raw = _call_gemini(prompt)
        result = json.loads(_clean_json(raw))
        result.setdefault("recommendation", {})
        for k in ("best_overall", "most_affordable", "most_available"):
            result["recommendation"].setdefault(k, variant_summaries[0]["brand_name"])
        for k in ("best_for_children", "best_for_elderly"):
            result["recommendation"].setdefault(k, None)
        result["source"] = "gemini"
        _cache_set(cache_key, result)
        return result
    except Exception as e:
        print(f"[Compare] Gemini unavailable ({e.__class__.__name__}: {str(e)[:120]}), using rule-based fallback")
        result = _rule_based_compare(resolved_generic, variant_metas)
        _cache_set(cache_key, result)
        return result
