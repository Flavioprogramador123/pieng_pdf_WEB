export const DOC_KIND = {
  PDF: "pdf",
  DOCX: "docx",
  XLS: "xls",
};

/** Word 97–2003 (.doc / application/msword) — não é o mesmo que .docx no navegador */
export function isLegacyWordDoc(file) {
  const name = (file?.name || "").toLowerCase();
  if (name.endsWith(".docx")) return false;
  if (name.endsWith(".doc")) return true;
  const type = (file?.type || "").toLowerCase();
  return type === "application/msword";
}

export function detectDocKind(file) {
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();

  if (type === "application/pdf" || name.endsWith(".pdf")) return DOC_KIND.PDF;

  if (
    name.endsWith(".docx") ||
    type.includes("wordprocessingml") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return DOC_KIND.DOCX;
  }

  if (name.endsWith(".doc") || type === "application/msword") {
    return DOC_KIND.DOCX;
  }

  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type === "application/vnd.ms-excel" ||
    type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return DOC_KIND.XLS;
  }
  return null;
}

export function isSupportedFile(file) {
  return detectDocKind(file) != null;
}

export function acceptUploadTypes() {
  return ".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
}
