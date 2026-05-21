import os

from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.pdf import pdf_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = Flask(__name__, static_folder=STATIC_DIR)
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
CORS(app)

app.register_blueprint(pdf_bp, url_prefix="/api/pdf")


def _asset_missing(path: str) -> bool:
    """Nao devolver index.html no lugar de .js/.css ausente (causa tela em branco)."""
    if not path:
        return False
    low = path.lower()
    return path.startswith("assets/") or low.endswith(
        (".js", ".mjs", ".css", ".map", ".woff", ".woff2", ".png", ".ico", ".webmanifest")
    )


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    full = os.path.join(STATIC_DIR, path) if path else ""
    if path and os.path.isfile(full):
        return send_from_directory(STATIC_DIR, path)
    if _asset_missing(path):
        return "", 404
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return send_from_directory(STATIC_DIR, "index.html")
    return (
        "<h1>PIENG PDF Web</h1><p>Execute <code>npm run build</code> em frontend/ e reinicie o Flask.</p>",
        200,
        {"Content-Type": "text/html; charset=utf-8"},
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
