import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { DOC_KIND, detectDocKind } from "./fileKinds.js";

export async function loadOfficeDocument(file) {
  const kind = detectDocKind(file);
  if (kind !== DOC_KIND.DOCX && kind !== DOC_KIND.XLS) {
    throw new Error("Formato de documento não suportado.");
  }

  const bytes = await file.arrayBuffer();
  const file_id = crypto.randomUUID();
  let previewHtml = "";
  let sheetNames = [];

  if (kind === DOC_KIND.DOCX) {
    try {
      const { value } = await mammoth.convertToHtml({ arrayBuffer: bytes });
      previewHtml = value || "<p>(documento vazio)</p>";
    } catch (e) {
      throw new Error(
        "Não foi possível abrir este Word. Use .docx ou converta .doc para .docx."
      );
    }
  } else {
    const wb = XLSX.read(bytes, { type: "array" });
    sheetNames = wb.SheetNames || [];
    if (!sheetNames.length) throw new Error("Planilha vazia.");
    previewHtml = sheetToHtml(wb, sheetNames[0]);
  }

  return {
    file_id,
    filename: file.name || (kind === DOC_KIND.XLS ? "planilha.xlsx" : "documento.docx"),
    kind,
    source: "local",
    num_pages: 1,
    pages: [{ page: 1, rotation: 0 }],
    office: {
      bytes,
      previewHtml,
      sheetNames,
      activeSheet: sheetNames[0] || null,
      workbook: kind === DOC_KIND.XLS ? bytes : null,
    },
  };
}

function sheetToHtml(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return "<p>Aba não encontrada.</p>";
  const html = XLSX.utils.sheet_to_html(sheet, { id: "pieng-sheet-table" });
  return `<div class="sheet-title">${escapeHtml(sheetName)}</div>${html}`;
}

export function renderSheetFromBytes(bytes, sheetName) {
  const wb = XLSX.read(bytes, { type: "array" });
  return sheetToHtml(wb, sheetName);
}

export function applyOfficeTransform(hostEl, { zoom, rotation }) {
  if (!hostEl) return;
  const inner = hostEl.querySelector(".read-office-inner");
  if (inner) {
    inner.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
  }
}

export function mountOfficeHtml(host, html) {
  host.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "read-office";
  const inner = document.createElement("div");
  inner.className = "read-office-inner";
  inner.innerHTML = html;
  wrap.appendChild(inner);
  host.appendChild(wrap);
  return inner;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
