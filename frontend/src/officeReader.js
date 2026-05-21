import { renderAsync } from "docx-preview";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { convertLegacyDocToDocxBuffer } from "./api.js";
import {
  DOC_KIND,
  detectDocKind,
  isLegacyWordDoc,
  isZipArchive,
} from "./fileKinds.js";

const LEGACY_DOC_MSG =
  "Não foi possível abrir o .doc. Na Vercel: guarde como .docx no Word/LibreOffice. No PC: use run.bat com LibreOffice ou Word instalado.";

/** Preserva layout, imagens e logos do .docx (HTML semântico do Mammoth não inclui gráficos). */
const DOCX_PREVIEW_OPTIONS = {
  className: "docx",
  inWrapper: true,
  ignoreWidth: false,
  ignoreHeight: false,
  ignoreFonts: false,
  breakPages: true,
  ignoreLastRenderedPageBreak: true,
  experimental: false,
  useBase64URL: true,
  renderHeaders: true,
  renderFooters: true,
};

export async function loadOfficeDocument(file) {
  const kind = detectDocKind(file);
  if (kind !== DOC_KIND.DOCX && kind !== DOC_KIND.XLS) {
    throw new Error("Formato de documento não suportado.");
  }

  let bytes = await file.arrayBuffer();

  if (kind === DOC_KIND.DOCX && isLegacyWordDoc(file) && !isZipArchive(bytes)) {
    try {
      bytes = await convertLegacyDocToDocxBuffer(file);
    } catch (e) {
      throw new Error(e.message || LEGACY_DOC_MSG);
    }
  }
  const file_id = crypto.randomUUID();
  let previewHtml = "";
  let sheetNames = [];

  if (kind === DOC_KIND.DOCX) {
    previewHtml = null;
  } else {
    const wb = XLSX.read(bytes, { type: "array", cellStyles: true });
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

export async function renderDocxInHost(host, bytes, fileId) {
  mountOfficeHtml(host, null, DOC_KIND.DOCX);
  const inner = host.querySelector(".read-office-inner");
  if (!inner) throw new Error("Painel de leitura indisponível.");
  inner.dataset.docxId = fileId;
  inner.innerHTML = "";
  await renderAsync(bytes, inner, null, DOCX_PREVIEW_OPTIONS);
}

export function isDocxRenderedInHost(host, fileId) {
  const inner = host?.querySelector(".read-office-inner");
  return inner?.dataset.docxId === fileId && !!inner.querySelector(".docx-wrapper");
}

function sheetToHtml(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return "<p>Aba não encontrada.</p>";
  let html = XLSX.utils.sheet_to_html(sheet, { id: "pieng-sheet-table" });
  const cols = sheet["!cols"];
  if (cols?.length) {
    const colgroup = cols
      .map((col) => {
        const px = col?.wpx ?? (col?.wch != null ? Math.round(col.wch * 7.5) : null);
        return px ? `<col style="width:${px}px" />` : "<col />";
      })
      .join("");
    html = html.replace(/<table([^>]*)>/i, `<table$1><colgroup>${colgroup}</colgroup>`);
  }
  return `<div class="sheet-title">${escapeHtml(sheetName)}</div>${html}`;
}

export function renderSheetFromBytes(bytes, sheetName) {
  const wb = XLSX.read(bytes, { type: "array", cellStyles: true });
  return sheetToHtml(wb, sheetName);
}

export function applyOfficeTransform(hostEl, { zoom, rotation, kind }) {
  if (!hostEl) return;
  const target =
    kind === DOC_KIND.DOCX
      ? hostEl.querySelector(".read-office--docx")
      : hostEl.querySelector(".read-office-sheet-scroll");
  if (!target) return;
  const origin = kind === DOC_KIND.DOCX ? "top center" : "top left";
  const rot = rotation ? `rotate(${rotation}deg)` : "";
  const supportsZoom =
    typeof CSS !== "undefined" && CSS.supports?.("zoom", "1") === true;
  if (supportsZoom) {
    target.style.zoom = zoom !== 1 ? String(zoom) : "";
    target.style.transform = rot || "";
  } else {
    target.style.zoom = "";
    const scale = zoom !== 1 ? `scale(${zoom})` : "";
    target.style.transform = [scale, rot].filter(Boolean).join(" ") || "";
  }
  target.style.transformOrigin = origin;
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
  if (html) inner.innerHTML = html;

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
