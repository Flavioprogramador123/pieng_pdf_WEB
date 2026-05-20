"""Conversão PDF→DOCX — simplificado do PIENG PDF Studio."""
from __future__ import annotations


def convert_pdf_to_docx(pdf_path: str, out_docx: str) -> None:
    last = ""
    try:
        from pdf2docx import Converter

        conv = Converter(pdf_path)
        conv.convert(out_docx, start=0, end=None)
        conv.close()
        return
    except ImportError:
        last = "pdf2docx não instalado"
    except Exception as e:
        last = str(e)

    try:
        import subprocess
        import shutil
        from pathlib import Path

        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if soffice:
            out_dir = str(Path(out_docx).parent)
            subprocess.run(
                [soffice, "--headless", "--convert-to", "docx", "--outdir", out_dir, pdf_path],
                check=True,
                timeout=120,
                capture_output=True,
            )
            generated = Path(out_dir) / (Path(pdf_path).stem + ".docx")
            if generated.exists() and str(generated) != out_docx:
                generated.replace(out_docx)
            if Path(out_docx).exists():
                return
    except Exception as e:
        last = str(e)

    raise RuntimeError(
        "Conversão PDF→DOCX indisponível. Instale: pip install pdf2docx "
        "ou LibreOffice no servidor."
        + (f" Detalhe: {last}" if "last" in dir() else "")
    )
