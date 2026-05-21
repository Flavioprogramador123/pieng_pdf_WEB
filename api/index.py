"""
API Flask na Vercel (serverless).
Rotas finais: /api/pdf/*
"""
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

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
CORS(app)

# Vercel expõe este arquivo em /api → prefixo /pdf vira /api/pdf
app.register_blueprint(pdf_bp, url_prefix="/pdf")
