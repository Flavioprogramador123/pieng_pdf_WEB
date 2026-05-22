import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function loadPdf(url) {
  return pdfjsLib.getDocument(url).promise;
}

export async function renderPage(pdf, pageNum, canvas, rotation = 0, scale = 1.2) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale, rotation });
  const ctx = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: ctx, viewport }).promise;
}

export async function renderThumb(pdf, pageNum, canvas, rotation = 0) {
  return renderPage(pdf, pageNum, canvas, rotation, 0.35);
}

/** Escala fixa ao desenhar no canvas — o zoom da barra é só CSS (evita re-render de todas as páginas). */
export const PDF_READ_RENDER_SCALE = 1.25;

export function applyPdfReadTransform(hostEl, zoom) {
  if (!hostEl) return;
  const wrap = hostEl.querySelector(".read-pdf-pages");
  if (!wrap) return;
  const supportsZoom =
    typeof CSS !== "undefined" && CSS.supports?.("zoom", "1") === true;
  if (supportsZoom) {
    wrap.style.zoom = zoom !== 1 ? String(zoom) : "";
    wrap.style.transform = "";
  } else {
    wrap.style.zoom = "";
    wrap.style.transform = zoom !== 1 ? `scale(${zoom})` : "";
  }
  wrap.style.transformOrigin = "top center";
}
