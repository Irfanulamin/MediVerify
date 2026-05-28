import base64
import io
import json
from PIL import Image

from rag import _call_gemini_vision, _cache_get, _cache_set, _clean_json

_NULL_RESULT = {
    "medicine_name": None,
    "batch_number": None,
    "expiry_date": None,
    "manufacturer": None,
}

BD_MANUFACTURER_ALIASES = {
    "beximco": "Beximco Pharmaceuticals",
    "square": "Square Pharmaceuticals",
    "aci": "ACI Limited",
    "incepta": "Incepta Pharmaceuticals",
    "opsonin": "Opsonin Pharma",
    "renata": "Renata Limited",
    "eskayef": "Eskayef Bangladesh",
    "skf": "Eskayef Bangladesh",
    "aristopharma": "Aristopharma Ltd",
    "drug international": "Drug International Ltd",
    "general pharma": "General Pharmaceuticals Ltd",
    "acme": "Acme Laboratories",
    "healthcare pharma": "Healthcare Pharmaceuticals",
    "popular": "Popular Pharmaceuticals",
    "sanofi": "Sanofi Bangladesh",
}


def _normalise_manufacturer(raw: str | None) -> str | None:
    if not raw:
        return raw
    lower = raw.lower().strip()
    for keyword, canonical in BD_MANUFACTURER_ALIASES.items():
        if keyword in lower:
            return canonical
    return raw.strip()


def extract_medicine_from_image(image_base64: str) -> dict:
    if not image_base64:
        return _NULL_RESULT.copy()

    try:
        image_data = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_data))
        img.verify()

        # Re-open after verify (verify() exhausts the file object)
        img = Image.open(io.BytesIO(image_data))
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format=img.format or "JPEG")
        img_bytes = img_bytes_io.getvalue()
        mime = f"image/{(img.format or 'jpeg').lower()}"

        print("[Vision] Calling Gemini Vision for image extraction")
        raw = _call_gemini_vision([
            (
                "Extract fields from this Bangladeshi medicine packaging and return ONLY valid JSON: "
                '{"medicine_name": <string or null>, "batch_number": <string or null>, '
                '"expiry_date": <string or null>, "manufacturer": <string or null>}. '
                "For the manufacturer field, look for one of these major Bangladeshi pharmaceutical companies: "
                "Beximco Pharmaceuticals, Square Pharmaceuticals, ACI Limited, Incepta Pharmaceuticals, "
                "Opsonin Pharma, Renata Limited, Eskayef Bangladesh (SKF), Aristopharma Ltd, "
                "Drug International Ltd, General Pharmaceuticals Ltd, Acme Laboratories, "
                "Healthcare Pharmaceuticals, Popular Pharmaceuticals, Sanofi Bangladesh. "
                "Return the FULL official company name as written above (e.g., 'Beximco Pharmaceuticals' "
                "not 'BEXIMCO' or 'Beximco Pharma'). If the manufacturer is unclear or not one of these, "
                "return your best reading of the printed text. Return ONLY valid JSON, no markdown."
            ),
            {"mime_type": mime, "data": img_bytes},
        ])
        parsed = json.loads(_clean_json(raw))
        result = {
            "medicine_name": parsed.get("medicine_name"),
            "batch_number": parsed.get("batch_number"),
            "expiry_date": parsed.get("expiry_date"),
            "manufacturer": _normalise_manufacturer(parsed.get("manufacturer")),
        }

        extracted_name = result.get("medicine_name")
        if extracted_name:
            cache_key = f"vision:{extracted_name.lower()}"
            cached = _cache_get(cache_key)
            if cached:
                print(f"[Vision] Cache hit for extracted name: {extracted_name}")
                return cached
            _cache_set(cache_key, result)

        return result
    except Exception:
        return {"error": "Cannot read image, please type name instead"}
