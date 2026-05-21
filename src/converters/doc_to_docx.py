"""Converte Word .doc (legado) para .docx — LibreOffice ou Microsoft Word (Windows)."""
import shutil
import sys
from pathlib import Path
from typing import Optional, Tuple


def convert_doc_to_docx(doc_path: str, out_docx: str) -> None:
    doc_path = str(Path(doc_path).resolve())
    out_docx = str(Path(out_docx).resolve())
    if not Path(doc_path).exists():
        raise RuntimeError("Arquivo .doc não encontrado.")

    steps = []
    if sys.platform == "win32":
        steps.append(("Microsoft Word", _convert_with_microsoft_word))
    steps.append(("LibreOffice", _convert_with_libreoffice))

    errors = []
    for label, fn in steps:
        try:
            ok, err = fn(doc_path, out_docx)
            if ok and Path(out_docx).exists():
                return
            errors.append(f"{label}: {err or 'falhou'}")
        except Exception as e:
            errors.append(f"{label}: {e}")

    raise RuntimeError(
        "Não foi possível converter .doc para .docx. "
        + ("; ".join(errors) if errors else "Instale LibreOffice ou Microsoft Word.")
    )


def _convert_with_libreoffice(doc_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice:
        return False, "LibreOffice não encontrado no PATH"
    outdir = str(Path(out_docx).parent)
    import subprocess

    proc = subprocess.run(
        [soffice, "--headless", "--convert-to", "docx", "--outdir", outdir, doc_path],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if proc.returncode != 0:
        return False, (proc.stderr or proc.stdout or "erro soffice")[:200]
    expected = Path(outdir) / (Path(doc_path).stem + ".docx")
    if expected.exists() and str(expected.resolve()) != str(Path(out_docx).resolve()):
        expected.replace(out_docx)
    return (True, None) if Path(out_docx).exists() else (False, "arquivo .docx não gerado")


def _convert_with_microsoft_word(doc_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    try:
        import win32com.client  # type: ignore
    except ImportError:
        return False, "pip install pywin32 (ambiente Windows)"

    word = None
    doc = None
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc_abs = str(Path(doc_path).resolve())
        docx_abs = str(Path(out_docx).resolve())
        doc = word.Documents.Open(doc_abs, ReadOnly=True)
        # 16 = wdFormatXMLDocument (.docx)
        doc.SaveAs2(docx_abs, FileFormat=16)
        doc.Close(SaveChanges=False)
        return (True, None) if Path(out_docx).exists() else (False, "arquivo não gerado")
    except Exception as e:
        return False, str(e)[:200]
    finally:
        if doc is not None:
            try:
                doc.Close(SaveChanges=False)
            except Exception:
                pass
        if word is not None:
            try:
                word.Quit()
            except Exception:
                pass
