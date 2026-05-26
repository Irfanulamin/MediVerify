import base64
import json
import os
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai

_NULL_RESULT = {
    "medicine_name": None,
    "batch_number": None,
    "expiry_date": None,
    "manufacturer": None,
}

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def extract_medicine_from_image(image_base64: str) -> dict:
    if not image_base64:
        return _NULL_RESULT.copy()

    try:
        image_data = base64.b64decode(image_base64)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            (
                "Look at this medicine packaging image. "
                "Extract and return JSON with exactly these fields: "
                '{"medicine_name": <string or null>, "batch_number": <string or null>, '
                '"expiry_date": <string or null>, "manufacturer": <string or null>}. '
                "Return ONLY valid JSON."
            ),
            {"mime_type": "image/jpeg", "data": image_data},
        ])
        raw = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(raw)
        return {
            "medicine_name": parsed.get("medicine_name"),
            "batch_number": parsed.get("batch_number"),
            "expiry_date": parsed.get("expiry_date"),
            "manufacturer": parsed.get("manufacturer"),
        }
    except Exception:
        return _NULL_RESULT.copy()
