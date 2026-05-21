import { transformExcelToFortune } from "@zenmrp/fortune-sheet-excel";

/**
 * Converte bytes .xlsx/.xls para o formato Fortune Sheet (estilos, merges, etc.).
 */
export async function transformExcelBytesToFortune(bytes, filename) {
  const name = filename || "planilha.xlsx";
  const type = name.toLowerCase().endsWith(".xls")
    ? "application/vnd.ms-excel"
    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const file = new File([bytes], name, { type });
  const fortuneFile = await transformExcelToFortune(file);
  return fortuneFile?.sheets || [];
}
