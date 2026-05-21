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
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  canvas.style.maxWidth = "none";
  canvas.style.maxHeight = "none";
  await page.render({ canvasContext: ctx, viewport }).promise;
}

export async function renderThumb(pdf, pageNum, canvas, rotation = 0) {
  return renderPage(pdf, pageNum, canvas, rotation, 0.35);
}
