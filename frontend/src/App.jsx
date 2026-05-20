import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyPages,
  downloadDocx,
  downloadUrl,
  extractText,
  getInfo,
  mergePdfs,
  pdfViewUrl,
  splitPdf,
  uploadPdf,
} from "./api.js";
import { loadPdf, renderPage, renderThumb } from "./pdfViewer.js";

const LOGO_HEADER = "/assets/logos/logo-pieng-oficial.png";
const LOGO_MARK = "/assets/logos/logo-pieng.png";

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

  const canvasRef = useRef(null);
  const readRef = useRef(null);
  const pdfRef = useRef(null);
  const thumbRefs = useRef({});

  const activeDoc = docs.find((d) => d.file_id === active);

  const loadPdfDoc = useCallback(async (fileId) => {
    const pdf = await loadPdf(pdfViewUrl(fileId));
    pdfRef.current = pdf;
    return pdf;
  }, []);

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
    const pdf = pdfRef.current;
    if (!host || !pdf) return;
    host.innerHTML = "";
    for (let i = 0; i < pages.length; i++) {
      const c = document.createElement("canvas");
      c.className = "read-page";
      host.appendChild(c);
      await renderPage(pdf, pages[i].page, c, pages[i].rotation || 0, 1.4);
    }
  }, [pages]);

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
        if (!pdfRef.current) await loadPdfDoc(active);
        if (cancelled) return;
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled) return;
        if (readingMode) await paintReading();
        else {
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
    tab,
    loadPdfDoc,
    paintMain,
    paintThumbs,
    paintReading,
  ]);

  const goEditor = () => {
    setTab("editor");
    setError("");
  };

  const openDoc = async (doc, pageList) => {
    setActive(doc.file_id);
    setPages(pageList || doc.pages || []);
    setCurrentIdx(0);
    setSelected(new Set());
    setError("");
    setTab("editor");
  };

  const onUpload = async (fileList) => {
    setLoading(true);
    setError("");
    try {
      for (const file of fileList) {
        if (file.type !== "application/pdf") continue;
        const res = await uploadPdf(file);
        const doc = { ...res, pages: res.pages || [] };
        setDocs((d) => [...d, doc]);
        await openDoc(doc, doc.pages);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!active || !pages.length) return;
    setLoading(true);
    setError("");
    try {
      const name = (activeDoc?.filename || "documento.pdf").replace(
        /\.pdf$/i,
        "_editado.pdf"
      );
      const res = await applyPages(active, pages, name);
      const info = await getInfo(res.file_id);
      const doc = { ...res, ...info, pages: info.pages };
      setDocs((d) => [...d, doc]);
      setActive(res.file_id);
      setPages(info.pages);
      setCurrentIdx(0);
      setSelected(new Set());
      await loadPdfDoc(res.file_id);
      setError("");
      alert("PDF salvo com as alterações.");
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
      const res = await mergePdfs(ids);
      const doc = {
        ...res,
        pages: Array.from({ length: res.num_pages }, (_, i) => ({
          page: i + 1,
          rotation: 0,
        })),
      };
      setDocs((d) => [...d, doc]);
      await openDoc(doc, doc.pages);
      setMergeIds(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doSplit = async () => {
    if (!active) return;
    setLoading(true);
    try {
      const res = await splitPdf(active);
      const newDocs = res.split_files.map((f) => ({
        ...f,
        pages: [{ page: 1, rotation: 0 }],
      }));
      setDocs((d) => [...d, ...newDocs]);
      alert(`${res.total_files} arquivos criados (uma página cada).`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const doExtractText = async () => {
    if (!active) return;
    setLoading(true);
    try {
      const res = await extractText(active);
      const parts = Object.entries(res.extracted_text || {}).map(
        ([k, v]) => `--- ${k} ---\n${v}`
      );
      setTextOut(parts.join("\n\n"));
      setTab("texto");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
          <img src={LOGO_HEADER} alt="PIENG" className="brand-logo" />
          <div className="brand-text">
            <span className="brand-title">PDF Web</span>
            <span className="brand-sub">Manipulação de PDF no navegador</span>
          </div>
        </div>
        <div className="top-actions">
          <button type="button" onClick={() => setReadingMode((r) => !r)}>
            {readingMode ? "Modo editor" : "Modo leitura"}
          </button>
          <button type="button" className="primary" onClick={saveChanges} disabled={!active}>
            Salvar alterações
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src={LOGO_MARK} alt="" className="sidebar-logo" aria-hidden />
          </div>
          <label className="upload-zone">
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => onUpload([...e.target.files])}
            />
            Enviar PDF
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
                >
                  {d.filename}
                  <small>{d.num_pages} pág.</small>
                </button>
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
                <a href={downloadUrl(d.file_id)} download className="icon-btn" title="Download">
                  ↓
                </a>
              </div>
            ))}
          </div>

          <button type="button" className="secondary full" onClick={doMerge}>
            Unir selecionados
          </button>
        </aside>

        <main className="workspace">
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
            <button type="button" className={tab === "texto" ? "on" : ""} onClick={() => setTab("texto")}>
              Texto
            </button>
          </div>

          {hint && tab === "editor" && <div className="hint-bar">{hint}</div>}

          {tab === "texto" ? (
            <pre className="text-panel">{textOut || "Extraia o texto do PDF ativo."}</pre>
          ) : !active ? (
            <div className="empty">
              <img src={LOGO_MARK} alt="PIENG" className="empty-logo" />
              <p>Envie um PDF para começar</p>
              <span className="empty-sub">Merge, split, rotação, DOCX e modo leitura</span>
            </div>
          ) : readingMode ? (
            <div className="reading-scroll" ref={readRef} />
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
                  onClick={() =>
                    activeDoc &&
                    downloadDocx(active, activeDoc.filename).catch((e) => setError(e.message))
                  }
                >
                  → DOCX
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
