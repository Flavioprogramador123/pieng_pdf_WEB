import { useEffect, useRef, useState } from "react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import { transformExcelBytesToFortune } from "./excelFortune.js";

export default function ExcelFortuneViewer({
  bytes,
  filename,
  activeSheet,
  zoom,
  rotation,
  onLoadError,
}) {
  const workbookRef = useRef(null);
  const viewportRef = useRef(null);
  const [sheets, setSheets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSheets(null);
    (async () => {
      try {
        const data = await transformExcelBytesToFortune(bytes, filename);
        if (cancelled) return;
        if (!data?.length) throw new Error("Planilha vazia ou formato não suportado.");
        setSheets(data);
      } catch (e) {
        if (!cancelled) onLoadError?.(e.message || "Falha ao abrir Excel");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bytes, filename, onLoadError]);

  useEffect(() => {
    if (!activeSheet || !sheets?.length || !workbookRef.current) return;
    const match = sheets.find((s) => s.name === activeSheet);
    if (match?.id != null) {
      try {
        workbookRef.current.activateSheet({ id: match.id });
      } catch {
        /* ignora se ainda não montou */
      }
    }
  }, [activeSheet, sheets]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const supportsZoom =
      typeof CSS !== "undefined" && CSS.supports?.("zoom", "1") === true;
    const rot = rotation ? `rotate(${rotation}deg)` : "";
    if (supportsZoom) {
      el.style.zoom = zoom !== 1 ? String(zoom) : "";
      el.style.transform = rot || "";
    } else {
      el.style.zoom = "";
      const scale = zoom !== 1 ? `scale(${zoom})` : "";
      el.style.transform = [scale, rot].filter(Boolean).join(" ") || "";
    }
    el.style.transformOrigin = "top left";
  }, [zoom, rotation]);

  if (loading) {
    return <p className="read-placeholder">A carregar planilha…</p>;
  }

  if (!sheets?.length) {
    return null;
  }

  const devicePixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  return (
    <div className="excel-fortune-viewport" ref={viewportRef}>
      <Workbook
        ref={workbookRef}
        data={sheets}
        allowEdit={false}
        showToolbar={false}
        showFormulaBar={false}
        showSheetTabs={sheets.length > 1}
        defaultFontSize={11}
        defaultRowHeight={23}
        devicePixelRatio={devicePixelRatio}
      />
    </div>
  );
}
