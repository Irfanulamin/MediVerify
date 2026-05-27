import base64
import io
import json
import os
from dotenv import load_dotenv

load_dotenv()

from PIL import Image
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
        img = Image.open(io.BytesIO(image_data))
        img.verify()

        # Re-open after verify (verify() exhausts the file object)
        img = Image.open(io.BytesIO(image_data))
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format=img.format or "JPEG")
        img_bytes = img_bytes_io.getvalue()
        mime = f"image/{(img.format or 'jpeg').lower()}"

        model = genai.GenerativeModel("gemini-2.0-flash-lite")
        response = model.generate_content([
            (
                "Extract from this medicine packaging: "
                '{"medicine_name": <string or null>, "batch_number": <string or null>, '
                '"expiry_date": <string or null>, "manufacturer": <string or null>}. '
                "Return ONLY valid JSON."
            ),
            {"mime_type": mime, "data": img_bytes},
        ])
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```", 2)[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)
        return {
            "medicine_name": parsed.get("medicine_name"),
            "batch_number": parsed.get("batch_number"),
            "expiry_date": parsed.get("expiry_date"),
            "manufacturer": parsed.get("manufacturer"),
        }
    except Exception:
        return {"error": "Cannot read image, please type name instead"}
