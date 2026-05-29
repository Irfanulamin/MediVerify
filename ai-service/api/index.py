"""Vercel Python serverless entrypoint.

Vercel's Python runtime serves the ASGI `app` exposed here. `vercel.json` rewrites
all routes to this function. The parent dir is added to sys.path so `main` and its
sibling modules import correctly.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402,F401
