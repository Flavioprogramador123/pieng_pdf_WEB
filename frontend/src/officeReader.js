import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { DOC_KIND, detectDocKind, isLegacyWordDoc } from "./fileKinds.js";

const LEGACY_DOC_MSG =
  "Arquivo .doc (Word antigo) não abre no navegador. No Word ou LibreOffice: Ficheiro → Guardar como → .docx e envie de novo.";

export async function loadOfficeDocument(file) {
  const kind = detectDocKind(file);
  if (kind !== DOC_KIND.DOCX && kind !== DOC_KIND.XLS) {
    throw new Error("Formato de documento não suportado.");
  }

  if (kind === DOC_KIND.DOCX && isLegacyWordDoc(file)) {
    throw new Error(LEGACY_DOC_MSG);
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
      const hint = isLegacyWordDoc(file)
        ? LEGACY_DOC_MSG
        : "Não foi possível abrir este Word. Confirme que o ficheiro é .docx (não .doc).";
      throw new Error(hint);
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
  const target =
    hostEl.querySelector(".read-office-sheet-scroll") ||
    hostEl.querySelector(".read-office-inner");
  if (target) {
    target.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
    target.style.transformOrigin = "top left";
  }
}

export function mountOfficeHtml(host, html, kind) {
  host.innerHTML = "";
  host.classList.toggle("reading-host--sheet", kind === DOC_KIND.XLS);
  host.classList.remove("reading-host--docx");

  const isSheet = kind === DOC_KIND.XLS;
  if (!isSheet) host.classList.add("reading-host--docx");

  const wrap = document.createElement("div");
  wrap.className = `read-office${isSheet ? " read-office--sheet" : " read-office--docx"}`;

  const inner = document.createElement("div");
  inner.className = "read-office-inner";
  inner.innerHTML = html;

  if (isSheet) {
    const scroller = document.createElement("div");
    scroller.className = "read-office-sheet-scroll";
    scroller.appendChild(inner);
    wrap.appendChild(scroller);
  } else {
    wrap.appendChild(inner);
  }

  host.appendChild(wrap);
  return inner;
}

export async function extractOfficePlainText(fileId, kind, officeStore) {
  const office = officeStore.get(fileId);
  if (!office?.bytes) throw new Error("Documento não encontrado.");

  if (kind === DOC_KIND.DOCX) {
    const { value } = await mammoth.extractRawText({ arrayBuffer: office.bytes });
    return value?.trim() || "(sem texto detectável)";
  }

  const wb = XLSX.read(office.bytes, { type: "array" });
  const sheetName = office.activeSheet || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return "(planilha vazia)";
  return XLSX.utils.sheet_to_csv(sheet);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
