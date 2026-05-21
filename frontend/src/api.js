/** Em produção: defina VITE_API_URL no Netlify ou use proxy /api no netlify.toml */
function apiRoot() {
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  return base ? `${base}/api/pdf` : "/api/pdf";
}

const API = apiRoot();

async function parseErrorResponse(res) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data.error || res.statusText;
  } catch {
    if (text.includes("<!DOCTYPE") || text.includes("<html")) {
      if (res.status === 404) {
        return "API offline — configure o servidor (Railway/Render) ou use run.bat no PC.";
      }
      return `Servidor retornou HTML (${res.status}). A API não está acessível.`;
    }
    return text.slice(0, 120) || res.statusText || "Erro de rede";
  }
}

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || (await parseErrorResponse(res)));
  return data;
}

export async function uploadPdf(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }
  return res.json();
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
    throw new Error(await parseErrorResponse(res));
  }
  const blob = await res.blob();
  triggerDownload(blob, filename.replace(/\.pdf$/i, ".docx"));
}

/** Conversão completa PDF→DOCX em uma requisição (preserva tabelas/logos no servidor). */
export async function convertPdfFileToDocx(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/convert-docx`, { method: "POST", body: fd });
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }
  const blob = await res.blob();
  const name = (file.name || "documento.pdf").replace(/\.pdf$/i, ".docx");
  triggerDownload(blob, name);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
