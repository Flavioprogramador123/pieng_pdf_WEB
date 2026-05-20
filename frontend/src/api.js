/** Em produção: defina VITE_API_URL no Netlify ou use proxy /api no netlify.toml */
function apiRoot() {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return base ? `${base}/api/pdf` : "/api/pdf";
}

const API = apiRoot();

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function uploadPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Falha no upload");
  return data;
}

export function pdfViewUrl(fileId) {
  return `${API}/view/${fileId}`;
}

export async function getInfo(fileId) {
  return jsonFetch(`${API}/info/${fileId}`);
}

export async function applyPages(fileId, pages, filename) {
  return jsonFetch(`${API}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages, filename }),
  });
}

export async function rotatePages(fileId, pages, angle) {
  return jsonFetch(`${API}/rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages, angle }),
  });
}

export async function deletePages(fileId, pages) {
  return jsonFetch(`${API}/delete-pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages }),
  });
}

export async function reorderPages(fileId, order) {
  return jsonFetch(`${API}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, order }),
  });
}

export async function duplicatePages(fileId, pages) {
  return jsonFetch(`${API}/duplicate-pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages }),
  });
}

export async function mergePdfs(fileIds) {
  return jsonFetch(`${API}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_ids: fileIds }),
  });
}

export async function splitPdf(fileId) {
  return jsonFetch(`${API}/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
}

export async function extractText(fileId, pages = []) {
  return jsonFetch(`${API}/extract-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId, pages }),
  });
}

export function downloadUrl(fileId) {
  return `${API}/download/${fileId}`;
}

export async function downloadDocx(fileId, filename) {
  const res = await fetch(`${API}/to-docx/${fileId}`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Falha na conversão DOCX");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/\.pdf$/i, ".docx");
  a.click();
  URL.revokeObjectURL(url);
}
