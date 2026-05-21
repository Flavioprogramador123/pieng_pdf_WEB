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

application = Flask(__name__)
application.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
CORS(application)
application.register_blueprint(pdf_bp, url_prefix="/api/pdf")


class _ApiPdfPathNormalizer:
    """Vercel pode enviar /pdf/... ou /api/pdf/... — unifica para o blueprint."""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO") or ""
        if path.startswith("/pdf/") or path == "/pdf":
            environ["PATH_INFO"] = "/api" + path
        elif path.startswith("/health"):
            environ["PATH_INFO"] = "/api/pdf" + path
        return self.app(environ, start_response)


application.wsgi_app = _ApiPdfPathNormalizer(application.wsgi_app)

app = application
