"""Converte Word .doc (legado) para .docx — Microsoft Word ou LibreOffice."""
import os
import shutil
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from typing import Optional, Tuple


def _find_libreoffice_soffice() -> Optional[str]:
    override = os.environ.get("LIBREOFFICE_PATH", "").strip()
    if override and Path(override).is_file():
        return override
    for name in ("soffice", "libreoffice"):
        found = shutil.which(name)
        if found:
            return found
    if sys.platform == "win32":
        for candidate in (
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ):
            if Path(candidate).is_file():
                return candidate
    if sys.platform == "darwin":
        for candidate in (
            "/Applications/LibreOffice.app/Contents/MacOS/soffice",
        ):
            if Path(candidate).is_file():
                return candidate
    return None


def convert_doc_to_docx(doc_path: str, out_docx: str) -> None:
    doc_path = str(Path(doc_path).resolve())
    out_docx = str(Path(out_docx).resolve())
    if not Path(doc_path).exists():
        raise RuntimeError("Arquivo .doc não encontrado.")

    steps = []
    if sys.platform == "win32":
        steps.append(("Microsoft Word", _convert_with_microsoft_word))
        steps.append(("Microsoft Word (PowerShell)", _convert_with_powershell_word))
    steps.append(("LibreOffice", _convert_with_libreoffice))

    errors = []
    for label, fn in steps:
        try:
            ok, err = fn(doc_path, out_docx)
            if ok and Path(out_docx).exists():
                return
            if err:
                errors.append(f"{label}: {err}")
        except Exception as e:
            errors.append(f"{label}: {e}")

    hint = _failure_hint(errors)
    raise RuntimeError(
        "Não foi possível converter .doc para .docx. " + "; ".join(errors) + hint
    )


def _failure_hint(errors: list) -> str:
    if sys.platform == "win32":
        return (
            " — No PC: instale Microsoft Word ou LibreOffice, ou execute "
            "'pip install pywin32' no venv e reinicie run.bat."
        )
    return (
        " — No servidor (Vercel) não há conversor .doc: abra o ficheiro no Word "
        "e guarde como .docx, ou use run.bat no seu PC."
    )


def _convert_with_libreoffice(doc_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    soffice = _find_libreoffice_soffice()
    if not soffice:
        return False, "LibreOffice não encontrado (PATH nem pasta Program Files)"
    outdir = str(Path(out_docx).parent)
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
        return False, "pywin32 não instalado (pip install pywin32 no venv)"

    word = None
    doc = None
    try:
        word = win32com.client.Dispatch("Word.Application")
        word.Visible = False
        doc = word.Documents.Open(str(Path(doc_path).resolve()), ReadOnly=True)
        doc.SaveAs2(str(Path(out_docx).resolve()), FileFormat=16)
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


def _convert_with_powershell_word(doc_path: str, out_docx: str) -> Tuple[bool, Optional[str]]:
    """Word via COM no PowerShell — funciona sem pywin32 se o Word estiver instalado."""
    doc_esc = str(Path(doc_path).resolve()).replace("'", "''")
    out_esc = str(Path(out_docx).resolve()).replace("'", "''")
    ps1 = Path(tempfile.gettempdir()) / f"pieng_doc_{uuid.uuid4().hex}.ps1"
    ps1.write_text(
        f"""
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {{
  $doc = $word.Documents.Open('{doc_esc}', $false, $true)
  $doc.SaveAs2([ref]'{out_esc}', [ref]16)
  $doc.Close()
}} finally {{
  $word.Quit()
}}
""".strip(),
        encoding="utf-8",
    )
    try:
        proc = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps1),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or "PowerShell falhou")[:200]
            return False, err
        return (True, None) if Path(out_docx).exists() else (False, "arquivo não gerado")
    finally:
        try:
            ps1.unlink(missing_ok=True)
        except OSError:
            pass
