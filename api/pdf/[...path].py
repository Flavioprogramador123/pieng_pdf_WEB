"""Vercel: cada URL /api/pdf/* usa esta função (health, upload, convert-docx, …)."""
import os
import sys

_api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_root = os.path.dirname(_api_dir)
_src = os.path.join(_root, "src")
for _p in (_api_dir, _src):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from bootstrap import app  # noqa: F401
