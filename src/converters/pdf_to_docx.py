"""Conversão PDF→DOCX — mesma lógica do PIENG PDF Studio (tabelas, logos, layout)."""
from __future__ import annotations

import logging
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Callable, Optional, Tuple

logger = logging.getLogger(__name__)


def convert_pdf_to_docx(pdf_path: str, out_docx: str) -> None:
    pdf_path = str(Path(pdf_path).resolve())
    out_docx = str(Path(out_docx).resolve())
    logger.info("Conversão PDF→DOCX: %s", Path(pdf_path).name)

    # Windows: Word costuma preservar melhor formulários com logos/tabelas
    steps: list[Tuple[str, Callable[[str, str], Tuple[bool, Optional[str]]]]] = []
    if sys.platform == "win32":
        steps.append(("Microsoft Word", _convert_with_microsoft_office))
    steps.extend(
        [
            ("pdf2docx", _convert_with_pdf2docx),
            ("LibreOffice", _convert_with_libreoffice),
        ]
    )

    errors: list[str] = []
    for name, fn in steps:
        try:
            ok, err = fn(pdf_path, out_docx)
            if ok and Path(out_docx).exists():
                logger.info("DOCX OK via %s", name)
                return
            if err:
                errors.append(f"{name}: {err}")
        except Exception as e:
            errors.append(f"{name}: {e}")

    raise RuntimeError(
        "Falha na conversão PDF→DOCX (tabelas/logos). "
        + " | ".join(errors)
        or "Nenhum conversor disponível."
    )


def _convert_with_pdf2docx(pdf_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    try:
        from pdf2docx import Converter

        conv = Converter(pdf_path)
        conv.convert(out_docx, start=0, end=None)
        conv.close()
        return True, None
    except ImportError:
        return False, "pip install pdf2docx"
    except Exception as e:
        return False, str(e)


def _convert_with_microsoft_office(pdf_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    try:
        import pythoncom
        import win32com.client as win32
    except ImportError:
        return False, "pywin32 não instalado"

    try:
        try:
            pythoncom.CoInitialize()
        except Exception:
            pass

        pdf_abs = str(Path(pdf_path).resolve())
        docx_abs = str(Path(out_docx).resolve())
        word = win32.Dispatch("Word.Application")
        word.Visible = False
        try:
            word.DisplayAlerts = 0
            if hasattr(word, "Options"):
                word.Options.ConfirmConversions = False
        except Exception:
            pass

        try:
            doc = word.Documents.Open(pdf_abs, ReadOnly=True)
            doc.SaveAs2(docx_abs, FileFormat=12)
            doc.Close(SaveChanges=False)
            return True, None
        finally:
            try:
                word.Quit()
            except Exception:
                pass
    except Exception as e:
        return False, str(e)


def _convert_with_libreoffice(pdf_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    try:
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if not soffice:
            return False, "LibreOffice não encontrado"

        outdir = str(Path(out_docx).parent)
        proc = subprocess.run(
            [soffice, "--headless", "--convert-to", "docx", "--outdir", outdir, pdf_path],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            return False, proc.stderr or "erro LibreOffice"

        expected = Path(outdir) / (Path(pdf_path).stem + ".docx")
        if expected.exists() and str(expected) != out_docx:
            expected.replace(out_docx)
        return (True, None) if Path(out_docx).exists() else (False, "arquivo não gerado")
    except subprocess.TimeoutExpired:
        return False, "timeout LibreOffice"
    except Exception as e:
        return False, str(e)
