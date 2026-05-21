"""App Flask compartilhado (Vercel + testes)."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

os.environ.setdefault("PDF_UPLOAD_DIR", "/tmp/pieng_pdf_uploads")

from flask import Flask
from flask_cors import CORS
from routes.pdf import pdf_bp

# Na Vercel o handler fica em /api; rotas Flask são /pdf/... → URL /api/pdf/...
_api_prefix = "/pdf" if os.environ.get("VERCEL") else "/api/pdf"

application = Flask(__name__)
application.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
CORS(application)
application.register_blueprint(pdf_bp, url_prefix=_api_prefix)

app = application
