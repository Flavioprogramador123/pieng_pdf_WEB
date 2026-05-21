import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyPages,
  checkApiHealth,
  convertPdfFileToDocx,
  downloadUrl,
  extractText,
  getInfo,
  mergePdfs,
  pdfViewUrl,
  splitPdf,
  uploadPdf,
} from "./api.js";
import {
  buildPdfBytes,
  downloadBytes,
  isPdfFile,
  loadLocalDocument,
  mergeBytesList,
  revokeStore,
} from "./localPdf.js";
import { BUILD_LABEL, BUILD_TITLE } from "./buildVersion.js";
import {
  DOC_KIND,
  acceptUploadTypes,
  detectDocKind,
  isLegacyWordDoc,
  isSupportedFile,
} from "./fileKinds.js";
import { FEATURES } from "./features/featureFlags.js";
import { downloadSimpleDocx, extractPageTexts } from "./docxExport.js";
import {
  applyOfficeTransform,
  extractOfficePlainText,
  loadOfficeDocument,
  isDocxRenderedInHost,
  mountOfficeHtml,
  renderDocxInHost,
  renderSheetFromBytes,
} from "./officeReader.js";
import DefaultAppPrompt from "./DefaultAppPrompt.jsx";
import ReadingToolbar, { nextZoom } from "./ReadingToolbar.jsx";
import { isInstalledPwa } from "./defaultApp.js";
import { loadPdf, renderPage, renderThumb } from "./pdfViewer.js";

/** Logo oficial (preto) — mesmo arquivo em header, sidebar e tela central */
const LOGO_PIENG = "/assets/logos/logo-pieng-oficial.png";

function App() {
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [mergeIds, setMergeIds] = useState(new Set());
  const [readingMode, setReadingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [textOut, setTextOut] = useState("");
  const [tab, setTab] = useState("editor");
  const [hint, setHint] = useState("");
  const [apiOnline, setApiOnline] = useState(null);
  const [hideApiBanner, setHideApiBanner] = useState(
    () => sessionStorage.getItem("pieng-hide-api-banner") === "1"
  );
  const [readZoom, setReadZoom] = useState(1.4);
  const [readRotation, setReadRotation] = useState(0);
  const [readPageIdx, setReadPageIdx] = useState(0);

  const canvasRef = useRef(null);
  const readRef = useRef(null);
  const pdfRef = useRef(null);
  const thumbRefs = useRef({});
  const localStoreRef = useRef(new Map());
  const officeStoreRef = useRef(new Map());
  const onUploadRef = useRef(null);
  const deferredInstallRef = useRef(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const activeDoc = docs.find((d) => d.file_id === active);
  const isPdfDoc = !activeDoc?.kind || activeDoc.kind === DOC_KIND.PDF;

  const docViewUrl = useCallback(
    (fileId) => {
      const doc = docs.find((d) => d.file_id === fileId);
      return doc?.viewUrl || pdfViewUrl(fileId);
    },
    [docs]
  );

  useEffect(() => {
    checkApiHealth().then((ok) => {
      setApiOnline(ok);
      if (ok) setHideApiBanner(true);
    });
  }, []);

  useEffect(() => {
    const onInstallable = (e) => {
      e.preventDefault();
      deferredInstallRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", onInstallable);
    return () => window.removeEventListener("beforeinstallprompt", onInstallable);
  }, []);

  const requestPwaInstall = useCallback(async () => {
    const ev = deferredInstallRef.current;
    if (!ev) return false;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    if (outcome === "accepted") deferredInstallRef.current = null;
    return outcome === "accepted";
  }, []);

  const dismissApiBanner = () => {
    sessionStorage.setItem("pieng-hide-api-banner", "1");
    setHideApiBanner(true);
  };

  const loadPdfDoc = useCallback(
    async (fileId) => {
      pdfRef.current = null;
      const pdf = await loadPdf(docViewUrl(fileId));
      pdfRef.current = pdf;
      return pdf;
    },
    [docViewUrl]
  );

  const paintMain = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas || !pages.length) return;
    const slot = pages[currentIdx];
    if (!slot) return;
    await renderPage(pdf, slot.page, canvas, slot.rotation || 0, readingMode ? 1.5 : 1.25);
  }, [pages, currentIdx, readingMode]);

  const paintThumbs = useCallback(async () => {
    const pdf = pdfRef.current;
    if (!pdf) return;
    for (let i = 0; i < pages.length; i++) {
      const c = thumbRefs.current[i];
      if (!c) continue;
      await renderThumb(pdf, pages[i].page, c, pages[i].rotation || 0);
    }
  }, [pages]);

  const paintReading = useCallback(async () => {
    const host = readRef.current;
    if (!host || !activeDoc) return;

    if (activeDoc.kind === DOC_KIND.DOCX || activeDoc.kind === DOC_KIND.XLS) {
      const office = officeStoreRef.current.get(activeDoc.file_id);
      if (!office) return;
      if (activeDoc.kind === DOC_KIND.DOCX) {
        if (!isDocxRenderedInHost(host, activeDoc.file_id)) {
          await renderDocxInHost(host, office.bytes, activeDoc.file_id);
        }
      } else {
        mountOfficeHtml(host, office.previewHtml, activeDoc.kind);
      }
      applyOfficeTransform(host, {
        zoom: readZoom,
        rotation: readRotation,
        kind: activeDoc.kind,
      });
      return;
    }

    const pdf = pdfRef.current;
    if (!pdf) return;
    host.classList.remove("reading-host--sheet", "reading-host--docx");
    host.innerHTML = "";
    const canvases = [];
    for (let i = 0; i < pages.length; i++) {
      const c = document.createElement("canvas");
      c.className = "read-page";
      c.dataset.pageIndex = String(i);
      host.appendChild(c);
      canvases.push(c);
    }
    for (let i = 0; i < pages.length; i++) {
      const rot = ((pages[i].rotation || 0) + readRotation) % 360;
      await renderPage(pdf, pages[i].page, canvases[i], rot, readZoom);
    }
    requestAnimationFrame(() => scrollToReadPage(readPageIdx));
  }, [pages, readZoom, readRotation, readPageIdx, activeDoc]);

  const scrollToReadPage = (idx) => {
    const host = readRef.current;
    if (!host) return;
    const el = host.querySelector(`[data-page-index="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fitReadWidth = useCallback(async () => {
    const pdf = pdfRef.current;
    const host = readRef.current;
    if (!pdf || !host || !pages.length) return;
    const slot = pages[readPageIdx] || pages[0];
    const page = await pdf.getPage(slot.page);
    const vp = page.getViewport({ scale: 1, rotation: readRotation });
    const w = Math.max(320, host.clientWidth - 48);
    setReadZoom(Math.min(3, Math.max(0.5, w / vp.width)));
  }, [pages, readPageIdx, readRotation]);

  const repaintViewer = useCallback(async () => {
    if (!active || !pages.length || tab !== "editor") return;
    await new Promise((r) => requestAnimationFrame(r));
    if (!pdfRef.current) await loadPdfDoc(active);
    if (readingMode) {
      await paintReading();
    } else {
      await paintMain();
      await paintThumbs();
    }
  }, [
    active,
    pages,
    tab,
    readingMode,
    loadPdfDoc,
    paintMain,
    paintThumbs,
    paintReading,
  ]);

  useEffect(() => {
    if (!active || !pages.length || tab !== "editor") return;
    let cancelled = false;
    (async () => {
      try {
        if (isPdfDoc) {
          if (!pdfRef.current) await loadPdfDoc(active);
        }
        if (cancelled) return;
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled) return;
        if (readingMode) await paintReading();
        else if (isPdfDoc) {
          await paintMain();
          await paintThumbs();
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    active,
    pages,
    currentIdx,
    readingMode,
    readZoom,
    readRotation,
    readPageIdx,
    tab,
    isPdfDoc,
    loadPdfDoc,
    paintMain,
    paintThumbs,
    paintReading,
  ]);

  const changeOfficeSheet = async (sheetName) => {
    const office = officeStoreRef.current.get(active);
    if (!office?.bytes) return;
    office.activeSheet = sheetName;
    office.previewHtml = renderSheetFromBytes(office.bytes, sheetName);
    officeStoreRef.current.set(active, office);
    await paintReading();
  };

  const goEditor = () => {
    setTab("editor");
    setError("");
  };

  const openDoc = async (doc, pageList) => {
    pdfRef.current = null;
    setActive(doc.file_id);
    setPages(pageList || doc.pages || []);
    setCurrentIdx(0);
    setReadPageIdx(0);
    setReadRotation(0);
    setSelected(new Set());
    setError("");
    setTab("editor");
    if (doc.kind && doc.kind !== DOC_KIND.PDF) {
      setReadingMode(true);
    }
  };

  const removeDoc = (fileId, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const doc = docs.find((d) => d.file_id === fileId);
    if (!doc) return;
    if (doc.source === "local") {
      revokeStore(localStoreRef.current.get(fileId));
      localStoreRef.current.delete(fileId);
      officeStoreRef.current.delete(fileId);
    }
    setMergeIds((m) => {
      const n = new Set(m);
      n.delete(fileId);
      return n;
    });
    const remaining = docs.filter((d) => d.file_id !== fileId);
    setDocs(remaining);
    if (active === fileId) {
      pdfRef.current = null;
      if (remaining.length) {
        openDoc(remaining[0], remaining[0].pages);
      } else {
        setActive(null);
        setPages([]);
        setCurrentIdx(0);
        setSelected(new Set());
      }
    }
    setHint(`"${doc.filename}" removido da lista.`);
  };

  const registerLocalDoc = (loaded) => {
    localStoreRef.current.set(loaded.file_id, loaded.store);
    const doc = {
      file_id: loaded.file_id,
      filename: loaded.filename,
      kind: DOC_KIND.PDF,
      num_pages: loaded.num_pages,
      pages: loaded.pages,
      source: "local",
      viewUrl: loaded.viewUrl,
    };
    return doc;
  };

  const registerOfficeDoc = (loaded) => {
    officeStoreRef.current.set(loaded.file_id, loaded.office);
    const { office, ...meta } = loaded;
    return { ...meta, kind: loaded.kind, source: "local" };
  };

  const onUpload = async (fileList) => {
    setLoading(true);
    setError("");
    const files = [...fileList].filter(
      FEATURES.officeReader ? isSupportedFile : (f) => isPdfFile(f)
    );
    if (!files.length) {
      setError(
        FEATURES.officeReader
          ? "Selecione PDF, Word (.docx) ou Excel (.xls/.xlsx). Ficheiros .doc antigos: converta para .docx."
          : "Selecione um arquivo .pdf (no celular o tipo pode vir vazio — use arquivo .pdf)."
      );
      setLoading(false);
      return;
    }
    const apiOk = apiOnline === true ? true : await checkApiHealth();
    setApiOnline(apiOk);
    const uploadErrors = [];
    try {
      for (const file of files) {
        let doc = null;
        if (FEATURES.officeReader && isLegacyWordDoc(file)) {
          uploadErrors.push(
            `${file.name || "Word"}: .doc não suportado — guarde como .docx e envie de novo.`
          );
          continue;
        }
        if (apiOk && detectDocKind(file) === DOC_KIND.PDF) {
          try {
            const res = await uploadPdf(file);
            doc = {
              ...res,
              kind: DOC_KIND.PDF,
              pages: res.pages || [],
              source: "api",
            };
          } catch (apiErr) {
            console.warn("Upload API falhou, modo local:", apiErr);
          }
        }
        if (!doc) {
          const kind = FEATURES.officeReader ? detectDocKind(file) : DOC_KIND.PDF;
          if (kind && kind !== DOC_KIND.PDF) {
            const loaded = await loadOfficeDocument(file);
            doc = registerOfficeDoc(loaded);
            setHint("Documento aberto no modo leitura (sem propagandas, no navegador).");
          } else {
            const loaded = await loadLocalDocument(file);
            doc = registerLocalDoc(loaded);
            setHint(
              apiOk
                ? "PDF carregado localmente."
                : "Modo local: PDF no seu dispositivo (API Vercel indisponível ou deploy pendente)."
            );
          }
        }
        setDocs((d) => [...d, doc]);
        await openDoc(doc, doc.pages);
      }
      if (uploadErrors.length) {
        setError(uploadErrors.join(" "));
      }
    } catch (e) {
      setError(e.message || "Falha ao abrir o PDF");
    } finally {
      setLoading(false);
    }
  };

  onUploadRef.current = onUpload;

  useEffect(() => {
    if (!("launchQueue" in window)) return;
    window.launchQueue.setConsumer(async (launchParams) => {
      if (!launchParams.files?.length) return;
      const files = await Promise.all(
        [...launchParams.files].map((handle) => handle.getFile())
      );
      await onUploadRef.current?.(files);
    });
  }, []);

  const saveChanges = async () => {
    if (!active || !pages.length) return;
    setLoading(true);
    setError("");
    try {
      const name = (activeDoc?.filename || "documento.pdf").replace(
        /\.pdf$/i,
        "_editado.pdf"
      );
      if (activeDoc?.source === "local") {
        const store = localStoreRef.current.get(active);
        if (!store) throw new Error("Arquivo local não encontrado.");
        const bytes = await buildPdfBytes(store.bytes, pages);
        revokeStore(store);
        store.bytes = bytes;
        store.blobUrl = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" })
        );
        store.filename = name;
        const updated = {
          ...activeDoc,
          filename: name,
          num_pages: pages.length,
          pages: pages.map((p) => ({ ...p })),
          viewUrl: store.blobUrl,
        };
        setDocs((d) => d.map((x) => (x.file_id === active ? updated : x)));
        pdfRef.current = null;
        await loadPdfDoc(active);
        downloadBytes(bytes, name);
        setHint("PDF salvo e baixado no seu dispositivo.");
        return;
      }
      const res = await applyPages(active, pages, name);
      const info = await getInfo(res.file_id);
      const doc = { ...res, ...info, pages: info.pages, source: "api" };
      setDocs((d) => [...d, doc]);
      setActive(res.file_id);
      setPages(info.pages);
      setCurrentIdx(0);
      setSelected(new Set());
      pdfRef.current = null;
      await loadPdfDoc(res.file_id);
      setHint("PDF salvo no servidor.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const targetIndices = () => {
    if (selected.size > 0) return [...selected];
    if (pages.length && currentIdx >= 0) return [currentIdx];
    return [];
  };

  const rotateLocal = (delta) => {
    const targets = targetIndices();
    if (!targets.length) {
      setHint("Clique numa miniatura para escolher a página.");
      return;
    }
    const set = new Set(targets);
    setPages((prev) =>
      prev.map((p, i) =>
        set.has(i)
          ? { ...p, rotation: ((p.rotation || 0) + delta + 360) % 360 }
          : p
      )
    );
    setHint(`Rotação aplicada em ${targets.length} página(s).`);
  };

  const deleteLocal = () => {
    const targets = targetIndices();
    if (!targets.length) {
      setHint("Clique numa miniatura ou dê duplo clique para selecionar páginas.");
      return;
    }
    const set = new Set(targets);
    if (pages.length - set.size < 1) {
      setError("Deixe pelo menos uma página.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => !set.has(i)));
    setSelected(new Set());
    setCurrentIdx(0);
    setHint(`${set.size} página(s) removida(s). Salve para gravar no PDF.`);
  };

  const movePage = (dir) => {
    const idx = currentIdx;
    const next = idx + dir;
    if (next < 0 || next >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
    setCurrentIdx(next);
  };

  const copyPage = () => {
    const indices =
      selected.size > 0
        ? [...selected].sort((a, b) => a - b)
        : currentIdx >= 0
          ? [currentIdx]
          : [];
    if (!indices.length) {
      setHint(
        "Copiar: clique na miniatura da página (borda azul) e depois em Copiar. " +
          "Ou dê duplo clique em várias miniaturas (borda laranja) e Copiar duplica todas."
      );
      return;
    }
    setPages((prev) => {
      const next = [...prev];
      for (const idx of [...indices].sort((a, b) => b - a)) {
        const slot = next[idx];
        if (!slot) continue;
        next.splice(idx + 1, 0, { ...slot });
      }
      return next;
    });
    const focus = indices[indices.length - 1] + 1;
    setCurrentIdx(Math.min(focus, pages.length));
    setHint(
      indices.length === 1
        ? `Página ${indices[0] + 1} duplicada logo abaixo. Use "Salvar alterações" para gravar.`
        : `${indices.length} páginas duplicadas. Use "Salvar alterações" para gravar.`
    );
  };

  const doMerge = async () => {
    const ids = [...mergeIds];
    if (ids.length < 2) {
      setError("Marque 2+ arquivos para unir.");
      return;
    }
    setLoading(true);
    try {
      const picked = docs.filter((d) => ids.includes(d.file_id));
      const allLocal = picked.every((d) => d.source === "local");
      if (allLocal) {
        const bytesList = ids.map((id) => localStoreRef.current.get(id)?.bytes).filter(Boolean);
        const merged = await mergeBytesList(bytesList);
        const file = new File([merged], "merged.pdf", { type: "application/pdf" });
        const loaded = await loadLocalDocument(file);
        const doc = registerLocalDoc(loaded);
        setDocs((d) => [...d, doc]);
        await openDoc(doc, doc.pages);
      } else {
        const res = await mergePdfs(ids);
        const doc = {
          ...res,
          source: "api",
          pages: Array.from({ length: res.num_pages }, (_, i) => ({
            page: i + 1,
            rotation: 0,
          })),
        };
        setDocs((d) => [...d, doc]);
        await openDoc(doc, doc.pages);
      }
      setMergeIds(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doSplit = async () => {
    if (!active || !pages.length) return;
    setLoading(true);
    try {
      if (activeDoc?.source === "local") {
        const store = localStoreRef.current.get(active);
        const newDocs = [];
        for (let i = 0; i < pages.length; i++) {
          const slot = pages[i];
          const bytes = await buildPdfBytes(store.bytes, [slot]);
          const file = new File([bytes], `page_${i + 1}.pdf`, { type: "application/pdf" });
          const loaded = await loadLocalDocument(file);
          const doc = registerLocalDoc(loaded);
          newDocs.push(doc);
        }
        setDocs((d) => [...d, ...newDocs]);
        alert(`${newDocs.length} PDFs criados (uma página cada).`);
      } else {
        const res = await splitPdf(active);
        const newDocs = res.split_files.map((f) => ({
          ...f,
          source: "api",
          pages: [{ page: 1, rotation: 0 }],
        }));
        setDocs((d) => [...d, ...newDocs]);
        alert(`${res.total_files} arquivos criados (uma página cada).`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pagesUnchanged = (list) =>
    list.every((p, i) => p.page === i + 1 && !(p.rotation || 0));

  const pdfBytesForDocx = async () => {
    const store = localStoreRef.current.get(active);
    if (!store) return null;
    if (store.originalBytes && pagesUnchanged(pages)) {
      return store.originalBytes;
    }
    return buildPdfBytes(store.bytes, pages);
  };

  const exportSimpleDocx = async () => {
    if (!pdfRef.current) await loadPdfDoc(active);
    const sections = await extractPageTexts(pdfRef.current, pages);
    const name = await downloadSimpleDocx(activeDoc.filename, sections);
    return name;
  };

  /** PDF atual como File — uma requisição POST (evita file_id em serverless). */
  const pdfFileForApiDocx = async () => {
    const fn = activeDoc.filename || "documento.pdf";
    if (activeDoc.source === "local") {
      const store = localStoreRef.current.get(active);
      if (!store) throw new Error("Arquivo local não encontrado.");
      const bytes = await pdfBytesForDocx();
      return new File([bytes], fn, { type: "application/pdf" });
    }
    const res = await fetch(docViewUrl(active));
    if (!res.ok) throw new Error("Não foi possível ler o PDF para conversão.");
    const blob = await res.blob();
    return new File([blob], fn, { type: "application/pdf" });
  };

  const doExportDocx = async () => {
    if (!active || !activeDoc || !pages.length) return;
    if (!isPdfDoc) {
      setError("Exportar DOCX só para PDF. Word/Excel: use o modo leitura.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const apiOk = apiOnline === true ? true : await checkApiHealth();
      setApiOnline(apiOk);

      if (apiOk) {
        try {
          const file = await pdfFileForApiDocx();
          await convertPdfFileToDocx(file);
          setHint("DOCX completo — tabelas, logos e layout (API).");
          return;
        } catch (apiErr) {
          console.warn("DOCX API:", apiErr);
        }
      }

      const name = await exportSimpleDocx();
      setHint(
        apiOk
          ? `${name} — DOCX editável (texto). Conversão completa na API indisponível.`
          : `${name} — DOCX editável (texto por página), sem API.`
      );
    } catch (e) {
      setError(e.message || "Falha ao gerar DOCX");
    } finally {
      setLoading(false);
    }
  };

  const doExportDocxTextOnly = async () => {
    if (!active || !pages.length) return;
    setLoading(true);
    setError("");
    try {
      const name = await exportSimpleDocx();
      setHint(`${name} — DOCX simples (somente texto extraído do PDF).`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const extractActiveText = useCallback(async () => {
    if (!active || !activeDoc) return "";

    if (activeDoc.kind === DOC_KIND.DOCX || activeDoc.kind === DOC_KIND.XLS) {
      return extractOfficePlainText(active, activeDoc.kind, officeStoreRef.current);
    }

    if (!pdfRef.current) await loadPdfDoc(active);
    if (pdfRef.current) {
      const parts = [];
      for (let i = 0; i < pages.length; i++) {
        const page = await pdfRef.current.getPage(pages[i].page);
        const tc = await page.getTextContent();
        const text = tc.items.map((it) => it.str).join(" ").trim();
        parts.push(`--- Página ${i + 1} ---\n${text || "(sem texto nesta página)"}`);
      }
      return parts.join("\n\n");
    }

    const res = await extractText(active);
    const parts = Object.entries(res.extracted_text || {}).map(
      ([k, v]) => `--- ${k} ---\n${v}`
    );
    return parts.join("\n\n") || "(sem texto detectável)";
  }, [active, activeDoc, pages, loadPdfDoc]);

  const openTextTab = async () => {
    setTab("texto");
    setError("");
    if (!active || !activeDoc) {
      setTextOut("");
      return;
    }
    setLoading(true);
    try {
      const text = await extractActiveText();
      setTextOut(text);
    } catch (e) {
      setError(e.message || "Falha ao extrair texto");
      setTextOut("");
    } finally {
      setLoading(false);
    }
  };

  const doExtractText = async () => {
    await openTextTab();
  };

  const toggleSelect = (idx) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });
  };

  return (
    <div className={`app ${readingMode ? "reading" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <img src={LOGO_PIENG} alt="PIENG" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-title">PDF Web</span>
            <span className="brand-sub">Manipulação de PDF no navegador</span>
          </div>
        </div>
        <div className="topbar-end">
          <div className="top-actions">
            {FEATURES.defaultAppPrompt && !isInstalledPwa() && (
              <button
                type="button"
                className="secondary"
                onClick={() => setShowInstallPrompt(true)}
                title="Instalar como leitor de PDF e Office"
              >
                Instalar leitor
              </button>
            )}
            <button type="button" onClick={() => setReadingMode((r) => !r)}>
              {readingMode ? "Modo editor" : "Modo leitura"}
            </button>
            <button type="button" className="primary" onClick={saveChanges} disabled={!active}>
              Salvar alterações
            </button>
          </div>
          <span className="build-tag" title={BUILD_TITLE}>
            {BUILD_LABEL}
          </span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src={LOGO_PIENG} alt="PIENG" className="sidebar-logo" />
          </div>
          <label className="upload-zone">
            <input
              type="file"
              accept={acceptUploadTypes()}
              multiple
              onChange={(e) => onUpload([...e.target.files])}
            />
            {FEATURES.officeReader ? "Enviar PDF / Word / Excel" : "Enviar PDF"}
          </label>

          <div className="doc-list">
            <h3>Arquivos</h3>
            {docs.map((d) => (
              <div
                key={d.file_id}
                className={`doc-item ${active === d.file_id ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="doc-open"
                  onClick={() => openDoc(d, d.pages)}
                  title={d.filename}
                >
                  <span className="doc-name">{d.filename}</span>
                  <small>{d.num_pages} pág.</small>
                </button>
                <div className="doc-actions">
                  <label className="merge-check" title="Incluir no merge">
                    <input
                      type="checkbox"
                      checked={mergeIds.has(d.file_id)}
                      onChange={(e) => {
                        setMergeIds((m) => {
                          const n = new Set(m);
                          if (e.target.checked) n.add(d.file_id);
                          else n.delete(d.file_id);
                          return n;
                        });
                      }}
                    />
                  </label>
                  <a
                    href={d.source === "local" ? d.viewUrl : downloadUrl(d.file_id)}
                    download={d.filename}
                    className="icon-btn"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ↓
                  </a>
                  <button
                    type="button"
                    className="icon-btn icon-btn-remove"
                    title="Remover da lista"
                    aria-label="Remover"
                    onClick={(e) => removeDoc(d.file_id, e)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="secondary full" onClick={doMerge}>
            Unir selecionados
          </button>
        </aside>

        <main className="workspace">
          {apiOnline === false && !hideApiBanner && (
            <div className="api-banner" role="status">
              <p>
                <strong>Modo local ativo</strong> — PDFs abrem no navegador.
                DOCX completo: confira o deploy na{" "}
                <a href="https://github.com/Flavioprogramador123/pieng_pdf_WEB/blob/main/VERCEL.md" target="_blank" rel="noreferrer">
                  Vercel
                </a>{" "}
                ou use <code>run.bat</code> em <code>localhost:5001</code>.
              </p>
              <button type="button" className="api-banner-close" onClick={dismissApiBanner} title="Ocultar">
                ×
              </button>
            </div>
          )}
          {error && <div className="error-bar">{error}</div>}

          <div className="tabs">
            <button
              type="button"
              className={tab === "editor" ? "on" : ""}
              onClick={() => {
                goEditor();
                requestAnimationFrame(() => repaintViewer().catch((e) => setError(e.message)));
              }}
            >
              Editor
            </button>
            <button
              type="button"
              className={tab === "texto" ? "on" : ""}
              onClick={() => openTextTab().catch((e) => setError(e.message))}
              title="Extrair e ver texto do arquivo ativo"
            >
              Texto
            </button>
          </div>

          {hint && tab === "editor" && <div className="hint-bar">{hint}</div>}

          {tab === "texto" ? (
            <div className="text-tab">
              <div className="text-tab-bar">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => openTextTab().catch((e) => setError(e.message))}
                  disabled={!active || loading}
                >
                  Atualizar texto
                </button>
                {activeDoc && (
                  <span className="text-tab-file">{activeDoc.filename}</span>
                )}
              </div>
              <pre className="text-panel">
                {loading && tab === "texto"
                  ? "Extraindo texto…"
                  : textOut ||
                    (active
                      ? "(nenhum texto — clique em Atualizar texto)"
                      : "Selecione um arquivo em Arquivos.")}
              </pre>
            </div>
          ) : !active ? (
            <div className="empty">
              <img src={LOGO_PIENG} alt="PIENG" className="empty-logo" />
              <p>Envie um arquivo para começar</p>
              <span className="empty-sub">
                PDF (editor + DOCX) · Word/Excel (leitor) · modo leitura com zoom
              </span>
            </div>
          ) : readingMode ? (
            <div className="reading-panel">
              <ReadingToolbar
                zoom={readZoom}
                rotation={readRotation}
                pageIndex={readPageIdx}
                pageCount={pages.length}
                docLabel={activeDoc?.filename || ""}
                isPdf={isPdfDoc}
                sheetNames={officeStoreRef.current.get(active)?.sheetNames}
                activeSheet={officeStoreRef.current.get(active)?.activeSheet}
                onZoomIn={() => setReadZoom((z) => nextZoom(z, 1))}
                onZoomOut={() => setReadZoom((z) => nextZoom(z, -1))}
                onZoomReset={() => setReadZoom(1.4)}
                onFitWidth={() => fitReadWidth().catch((e) => setError(e.message))}
                onRotateLeft={() => setReadRotation((r) => (r - 90 + 360) % 360)}
                onRotateRight={() => setReadRotation((r) => (r + 90) % 360)}
                onPrevPage={() => {
                  const n = Math.max(0, readPageIdx - 1);
                  setReadPageIdx(n);
                  scrollToReadPage(n);
                }}
                onNextPage={() => {
                  const n = Math.min(pages.length - 1, readPageIdx + 1);
                  setReadPageIdx(n);
                  scrollToReadPage(n);
                }}
                onSheetChange={(name) => changeOfficeSheet(name).catch((e) => setError(e.message))}
              />
              <div className="reading-scroll" ref={readRef} />
            </div>
          ) : !isPdfDoc ? (
            <div className="office-hint">
              <p>
                <strong>{activeDoc?.filename}</strong> — leitura de Word/Excel no navegador.
              </p>
              <button type="button" className="primary" onClick={() => setReadingMode(true)}>
                Abrir modo leitura
              </button>
            </div>
          ) : (
            <>
              <div className="toolbar">
                <button type="button" onClick={() => rotateLocal(-90)} title="Girar esquerda">
                  ↺
                </button>
                <button type="button" onClick={() => rotateLocal(90)} title="Girar direita">
                  ↻
                </button>
                <button type="button" onClick={deleteLocal} title="Excluir selecionadas">
                  Excluir
                </button>
                <button type="button" onClick={() => movePage(-1)} title="Mover para cima">
                  ↑
                </button>
                <button type="button" onClick={() => movePage(1)} title="Mover para baixo">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={copyPage}
                  title="Duplica a miniatura ativa (clique simples) ou todas selecionadas (duplo clique nas miniaturas)"
                >
                  Copiar
                </button>
                <button type="button" onClick={doSplit}>Dividir</button>
                <button
                  type="button"
                  onClick={doExportDocx}
                  title="DOCX editável — tenta API; se falhar, gera no navegador (como v10)"
                >
                  → DOCX
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={doExportDocxTextOnly}
                  title="Só texto, sem formatação — funciona sem API"
                >
                  DOCX texto
                </button>
                <button type="button" onClick={doExtractText}>Extrair texto</button>
                <span className="hint">
                  Pág. {currentIdx + 1}/{pages.length}
                  {selected.size > 0 && ` · ${selected.size} selecionada(s)`}
                  {" · "}
                  <em>1 clique</em> = página ativa · <em>duplo clique</em> na miniatura = selecionar
                </span>
              </div>

              <div className="viewer-wrap">
                <canvas ref={canvasRef} className="main-canvas" />
              </div>

              <div className="thumbs-strip">
                {pages.map((slot, i) => (
                  <div
                    key={`${i}-${slot.page}-${slot.rotation}`}
                    className={`thumb ${currentIdx === i ? "current" : ""} ${selected.has(i) ? "sel" : ""}`}
                    onClick={() => setCurrentIdx(i)}
                    onDoubleClick={() => toggleSelect(i)}
                  >
                    <canvas
                      ref={(el) => {
                        thumbRefs.current[i] = el;
                      }}
                    />
                    <span>{i + 1}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {FEATURES.defaultAppPrompt && (
        <DefaultAppPrompt
          forceOpen={showInstallPrompt}
          onDismiss={() => setShowInstallPrompt(false)}
          onInstallRequest={requestPwaInstall}
        />
      )}

      {loading && (
        <div className="overlay">
          <div className="spinner" />
          Processando…
        </div>
      )}
    </div>
  );
}

export default App;
