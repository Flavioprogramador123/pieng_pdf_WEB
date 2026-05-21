import { transformExcelToFortune } from "@zenmrp/fortune-sheet-excel";

/** Margem extra para o canvas não cortar texto (título mesclado, notas). */
const ROW_HEIGHT_FACTOR = 1.14;
const COL_WIDTH_FACTOR = 1.04;
const MIN_ROW_PX = 23;
const MIN_COL_PX = 48;

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
  return normalizeFortuneSheets(fortuneFile?.sheets || []);
}

function cellValue(cell) {
  const v = cell?.v;
  return v && typeof v === "object" ? v : null;
}

/**
 * Corrige linhas/colunas ligeiramente baixas após import (texto cortado no topo/fundo).
 */
export function normalizeFortuneSheets(sheets) {
  return sheets.map((sheet) => {
    const config = { ...(sheet.config || {}) };
    const rowlen = { ...(config.rowlen || {}) };
    const columnlen = { ...(config.columnlen || {}) };

    let defaultRowHeight = Math.max(
      MIN_ROW_PX,
      Math.ceil((sheet.defaultRowHeight || 19) * ROW_HEIGHT_FACTOR)
    );

    const rowFontMax = {};
    const rowWrap = new Set();

    for (const cell of sheet.celldata || []) {
      const r = cell.r;
      if (r == null) continue;
      const val = cellValue(cell);
      if (!val) continue;
      if (val.fs) rowFontMax[r] = Math.max(rowFontMax[r] || 0, Number(val.fs));
      if (val.tb === 2 || val.tb === "2") rowWrap.add(r);
      if (val.mc?.rs > 1) {
        for (let i = 0; i < val.mc.rs; i++) rowWrap.add(r + i);
      }
    }

    for (const [r, h] of Object.entries(rowlen)) {
      const rn = Number(r);
      const base = Math.ceil(Number(h) * ROW_HEIGHT_FACTOR);
      const fontPx = rowFontMax[rn] ? Math.ceil(rowFontMax[rn] * 1.45) + 8 : 0;
      const wrapPx = rowWrap.has(rn) ? defaultRowHeight + 6 : 0;
      rowlen[r] = Math.max(base, fontPx, wrapPx, MIN_ROW_PX);
    }

    for (const r of Object.keys(rowFontMax)) {
      if (rowlen[r] == null) {
        rowlen[r] = Math.max(
          defaultRowHeight,
          Math.ceil(rowFontMax[r] * 1.45) + 8
        );
      }
    }

    for (const [c, w] of Object.entries(columnlen)) {
      columnlen[c] = Math.max(MIN_COL_PX, Math.ceil(Number(w) * COL_WIDTH_FACTOR));
    }

    return {
      ...sheet,
      defaultRowHeight,
      defaultColWidth: sheet.defaultColWidth
        ? Math.ceil(sheet.defaultColWidth * COL_WIDTH_FACTOR)
        : sheet.defaultColWidth,
      config: { ...config, rowlen, columnlen },
    };
  });
}
