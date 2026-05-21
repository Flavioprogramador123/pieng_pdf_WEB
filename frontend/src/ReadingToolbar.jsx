import { FEATURES } from "./features/featureFlags.js";

export const READ_ZOOM_DEFAULT = 1;

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export function nextZoom(current, dir) {
  if (dir > 0) {
    const up = ZOOM_STEPS.find((z) => z > current + 0.01);
    return up ?? current;
  }
  const down = [...ZOOM_STEPS].reverse().find((z) => z < current - 0.01);
  return down ?? current;
}

export default function ReadingToolbar({
  zoom,
  rotation,
  pageIndex,
  pageCount,
  docLabel,
  isPdf,
  sheetNames,
  activeSheet,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onRotateLeft,
  onRotateRight,
  onPrevPage,
  onNextPage,
  onSheetChange,
}) {
  if (!FEATURES.readingToolbar) return null;

  return (
    <div className="reading-toolbar" role="toolbar" aria-label="Ferramentas de leitura">
      <span className="reading-toolbar-label">{docLabel}</span>
      <div className="reading-toolbar-group">
        <button type="button" onClick={onZoomOut} title="Diminuir zoom">
          −
        </button>
        <span className="reading-zoom-pct">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={onZoomIn} title="Aumentar zoom">
          +
        </button>
        <button type="button" onClick={onZoomReset} title="Zoom padrão">
          100%
        </button>
        <button type="button" onClick={onFitWidth} title="Ajustar à largura">
          Largura
        </button>
      </div>
      <div className="reading-toolbar-group">
        <button type="button" onClick={onRotateLeft} title="Girar esquerda">
          ↺
        </button>
        <button type="button" onClick={onRotateRight} title="Girar direita">
          ↻
        </button>
      </div>
      {isPdf && pageCount > 1 && (
        <div className="reading-toolbar-group">
          <button type="button" onClick={onPrevPage} disabled={pageIndex <= 0} title="Página anterior">
            ‹
          </button>
          <span className="reading-page-num">
            {pageIndex + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={pageIndex >= pageCount - 1}
            title="Próxima página"
          >
            ›
          </button>
        </div>
      )}
      {!isPdf && sheetNames?.length > 1 && (
        <select
          className="reading-sheet-select"
          value={activeSheet}
          onChange={(e) => onSheetChange?.(e.target.value)}
          title="Aba da planilha"
        >
          {sheetNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
