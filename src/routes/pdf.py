"""API de manipulação de PDF — baseado no PIENG PDF Studio."""
import os
import tempfile
import uuid
from copy import deepcopy

from flask import Blueprint, jsonify, request, send_file
from pypdf import PdfReader, PdfWriter
from werkzeug.utils import secure_filename

pdf_bp = Blueprint("pdf", __name__)

UPLOAD_FOLDER = os.environ.get(
    "PDF_UPLOAD_DIR",
    os.path.join(tempfile.gettempdir(), "pieng_pdf_uploads"),
)
ALLOWED_EXTENSIONS = {"pdf"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@pdf_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "pieng-pdf-api"})


def resolve_file(file_id: str):
    for name in os.listdir(UPLOAD_FOLDER):
        if name.startswith(f"{file_id}_") or name == file_id:
            return os.path.join(UPLOAD_FOLDER, name), name
    return None, None


def display_name(stored_name: str) -> str:
    if "_" in stored_name:
        return stored_name.split("_", 1)[1]
    return stored_name


def save_writer(writer: PdfWriter, filename: str = "documento.pdf"):
    file_id = str(uuid.uuid4())
    safe = secure_filename(filename) or "documento.pdf"
    if not safe.lower().endswith(".pdf"):
        safe += ".pdf"
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{safe}")
    with open(path, "wb") as f:
        writer.write(f)
    reader = PdfReader(path)
    return {
        "file_id": file_id,
        "filename": safe,
        "num_pages": len(reader.pages),
    }


def build_writer_from_pages(reader: PdfReader, page_specs: list) -> PdfWriter:
    """page_specs: [{\"page\": 1, \"rotation\": 0}, ...] — páginas 1-indexed do reader."""
    writer = PdfWriter()
    for spec in page_specs:
        idx = int(spec["page"]) - 1
        rotation = int(spec.get("rotation", 0)) % 360
        if 0 <= idx < len(reader.pages):
            page = deepcopy(reader.pages[idx])
            if rotation:
                page.rotate(rotation)
            writer.add_page(page)
    return writer


@pdf_bp.route("/upload", methods=["POST"])
def upload_pdf():
    try:
        if "file" not in request.files:
            return jsonify({"error": "Nenhum arquivo enviado"}), 400
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "Nenhum arquivo selecionado"}), 400
        if not allowed_file(file.filename):
            return jsonify({"error": "Apenas PDF é permitido"}), 400

        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        path = os.path.join(UPLOAD_FOLDER, f"{file_id}_{filename}")
        file.save(path)
        reader = PdfReader(path)
        pages = [
            {"page": i + 1, "rotation": int(page.get("/Rotate", 0) or 0) % 360}
            for i, page in enumerate(reader.pages)
        ]
        return jsonify(
            {
                "file_id": file_id,
                "filename": filename,
                "num_pages": len(reader.pages),
                "pages": pages,
            }
        )
    except Exception as e:
        return jsonify({"error": f"Erro no upload: {e}"}), 500


@pdf_bp.route("/view/<file_id>", methods=["GET"])
def view_pdf(file_id):
    path, _ = resolve_file(file_id)
    if not path:
        return jsonify({"error": "Arquivo não encontrado"}), 404
    return send_file(path, mimetype="application/pdf", as_attachment=False)


@pdf_bp.route("/info/<file_id>", methods=["GET"])
def get_pdf_info(file_id):
    try:
        path, name = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404
        reader = PdfReader(path)
        pages = []
        for i, page in enumerate(reader.pages):
            pages.append(
                {
                    "page": i + 1,
                    "rotation": int(page.get("/Rotate", 0) or 0) % 360,
                    "width": float(page.mediabox.width),
                    "height": float(page.mediabox.height),
                }
            )
        return jsonify(
            {
                "file_id": file_id,
                "filename": display_name(name),
                "num_pages": len(reader.pages),
                "pages": pages,
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/apply", methods=["POST"])
def apply_pages():
    """Monta PDF a partir da lista de páginas (ordem, rotação) — como exportar no Studio."""
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        page_specs = data.get("pages", [])
        out_name = data.get("filename", "montado.pdf")
        if not file_id or not page_specs:
            return jsonify({"error": "file_id e pages são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, page_specs)
        if len(writer.pages) == 0:
            return jsonify({"error": "Nenhuma página válida"}), 400
        return jsonify(save_writer(writer, out_name))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/rotate", methods=["POST"])
def rotate_pages():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        pages = data.get("pages", [])
        angle = int(data.get("angle", 90))
        if not file_id or not pages:
            return jsonify({"error": "file_id e pages são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        info = get_pdf_info_data(file_id, path)
        specs = info["pages"]
        page_set = set(pages)
        for spec in specs:
            if spec["page"] in page_set:
                spec["rotation"] = (spec["rotation"] + angle) % 360

        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, specs)
        return jsonify(save_writer(writer, info["filename"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_pdf_info_data(file_id, path=None):
    if path is None:
        path, name = resolve_file(file_id)
        if not path:
            raise FileNotFoundError("Arquivo não encontrado")
    else:
        _, name = resolve_file(file_id)
    reader = PdfReader(path)
    pages = [
        {"page": i + 1, "rotation": int(page.get("/Rotate", 0) or 0) % 360}
        for i, page in enumerate(reader.pages)
    ]
    return {"file_id": file_id, "filename": display_name(name), "pages": pages}


@pdf_bp.route("/delete-pages", methods=["POST"])
def delete_pages():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        to_delete = set(data.get("pages", []))
        if not file_id or not to_delete:
            return jsonify({"error": "file_id e pages são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        info = get_pdf_info_data(file_id, path)
        specs = [p for p in info["pages"] if p["page"] not in to_delete]
        if not specs:
            return jsonify({"error": "Não é possível excluir todas as páginas"}), 400

        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, specs)
        return jsonify(save_writer(writer, info["filename"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/reorder", methods=["POST"])
def reorder_pages():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        order = data.get("order", [])
        if not file_id or not order:
            return jsonify({"error": "file_id e order são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        info = get_pdf_info_data(file_id, path)
        by_page = {p["page"]: p for p in info["pages"]}
        specs = [by_page[p] for p in order if p in by_page]
        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, specs)
        return jsonify(save_writer(writer, info["filename"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/duplicate-pages", methods=["POST"])
def duplicate_pages():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        dup_pages = data.get("pages", [])
        if not file_id or not dup_pages:
            return jsonify({"error": "file_id e pages são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        info = get_pdf_info_data(file_id, path)
        specs = []
        dup_set = set(dup_pages)
        for p in info["pages"]:
            specs.append(p)
            if p["page"] in dup_set:
                specs.append(dict(p))
        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, specs)
        return jsonify(save_writer(writer, info["filename"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/merge", methods=["POST"])
def merge_pdfs():
    try:
        data = request.get_json() or {}
        file_ids = data.get("file_ids", [])
        if len(file_ids) < 2:
            return jsonify({"error": "Selecione pelo menos 2 PDFs"}), 400

        writer = PdfWriter()
        for fid in file_ids:
            path, _ = resolve_file(fid)
            if not path:
                return jsonify({"error": f"Arquivo {fid} não encontrado"}), 404
            reader = PdfReader(path)
            for page in reader.pages:
                writer.add_page(page)

        return jsonify(save_writer(writer, "merged.pdf"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/split", methods=["POST"])
def split_pdf():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        if not file_id:
            return jsonify({"error": "file_id é obrigatório"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        reader = PdfReader(path)
        split_files = []
        for i, page in enumerate(reader.pages):
            w = PdfWriter()
            w.add_page(page)
            meta = save_writer(w, f"page_{i + 1}.pdf")
            meta["page_number"] = i + 1
            split_files.append(meta)

        return jsonify({"split_files": split_files, "total_files": len(split_files)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/extract", methods=["POST"])
def extract_pages():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        pages = data.get("pages", [])
        if not file_id or not pages:
            return jsonify({"error": "file_id e pages são obrigatórios"}), 400

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        specs = [{"page": p, "rotation": 0} for p in pages]
        reader = PdfReader(path)
        writer = build_writer_from_pages(reader, specs)
        return jsonify(save_writer(writer, "extracted.pdf"))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/extract-text", methods=["POST"])
def extract_text():
    try:
        data = request.get_json() or {}
        file_id = data.get("file_id")
        page_numbers = data.get("pages", [])

        path, _ = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        reader = PdfReader(path)
        if not page_numbers:
            page_numbers = list(range(1, len(reader.pages) + 1))

        extracted = {}
        for num in page_numbers:
            if 1 <= num <= len(reader.pages):
                extracted[f"page_{num}"] = reader.pages[num - 1].extract_text() or ""

        return jsonify(
            {
                "file_id": file_id,
                "extracted_text": extracted,
                "total_pages_processed": len(extracted),
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/to-docx/<file_id>", methods=["POST"])
def to_docx(file_id):
    try:
        path, name = resolve_file(file_id)
        if not path:
            return jsonify({"error": "Arquivo não encontrado"}), 404

        from converters.pdf_to_docx import convert_pdf_to_docx

        out_id = str(uuid.uuid4())
        base = display_name(name).rsplit(".", 1)[0]
        docx_name = f"{base}.docx"
        out_path = os.path.join(UPLOAD_FOLDER, f"{out_id}_{docx_name}")
        convert_pdf_to_docx(path, out_path)

        return send_file(
            out_path,
            as_attachment=True,
            download_name=docx_name,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/download/<file_id>", methods=["GET"])
def download_pdf(file_id):
    path, name = resolve_file(file_id)
    if not path:
        return jsonify({"error": "Arquivo não encontrado"}), 404
    return send_file(path, as_attachment=True, download_name=display_name(name))


@pdf_bp.route("/list", methods=["GET"])
def list_files():
    try:
        files = []
        for name in os.listdir(UPLOAD_FOLDER):
            if not name.endswith(".pdf"):
                continue
            file_id = name.split("_", 1)[0]
            path = os.path.join(UPLOAD_FOLDER, name)
            try:
                reader = PdfReader(path)
                files.append(
                    {
                        "file_id": file_id,
                        "filename": display_name(name),
                        "num_pages": len(reader.pages),
                        "size": os.path.getsize(path),
                    }
                )
            except Exception:
                continue
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pdf_bp.route("/delete/<file_id>", methods=["DELETE"])
def delete_file(file_id):
    path, _ = resolve_file(file_id)
    if not path:
        return jsonify({"error": "Arquivo não encontrado"}), 404
    try:
        os.remove(path)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
