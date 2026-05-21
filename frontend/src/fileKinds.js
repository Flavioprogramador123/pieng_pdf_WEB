export const DOC_KIND = {
  PDF: "pdf",
  DOCX: "docx",
  XLS: "xls",
};

export function detectDocKind(file) {
  const name = (file?.name || "").toLowerCase();
  if (file?.type === "application/pdf" || name.endsWith(".pdf")) return DOC_KIND.PDF;
  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc") ||
    file?.type?.includes("wordprocessing")
  ) {
    return DOC_KIND.DOCX;
  }
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file?.type?.includes("spreadsheet") ||
    file?.type?.includes("excel")
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
