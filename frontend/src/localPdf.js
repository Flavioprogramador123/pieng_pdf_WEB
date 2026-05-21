import { PDFDocument, degrees } from "pdf-lib";

export function isPdfFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export async function loadLocalDocument(file) {
  const bytes = await file.arrayBuffer();
  const blobUrl = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" })
  );
  const pdfDoc = await PDFDocument.load(bytes);
  const num_pages = pdfDoc.getPageCount();
  const pages = Array.from({ length: num_pages }, (_, i) => {
    const p = pdfDoc.getPage(i);
    return { page: i + 1, rotation: p.getRotation().angle % 360 };
  });
  const file_id = crypto.randomUUID();
  return {
    file_id,
    filename: file.name || "documento.pdf",
    num_pages,
    pages,
    source: "local",
    viewUrl: blobUrl,
    store: { bytes, blobUrl, filename: file.name || "documento.pdf" },
  };
}

export async function buildPdfBytes(sourceBytes, pageSpecs) {
  const src = await PDFDocument.load(sourceBytes);
  const out = await PDFDocument.create();
  for (const spec of pageSpecs) {
    const idx = Number(spec.page) - 1;
    if (idx < 0 || idx >= src.getPageCount()) continue;
    const [copied] = await out.copyPages(src, [idx]);
    const rot = Number(spec.rotation || 0) % 360;
    if (rot) copied.setRotation(degrees(rot));
    out.addPage(copied);
  }
  return await out.save();
}

export async function mergeBytesList(bytesList) {
  const out = await PDFDocument.create();
  for (const bytes of bytesList) {
    const src = await PDFDocument.load(bytes);
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
  }
  return await out.save();
}

export function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function revokeStore(store) {
  if (store?.blobUrl) URL.revokeObjectURL(store.blobUrl);
}
