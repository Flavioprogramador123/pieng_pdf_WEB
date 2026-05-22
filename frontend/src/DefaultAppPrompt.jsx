import { useEffect, useState } from "react";
import {
  PROMPT_CHOICE,
  getDefaultAppChoice,
  hasSeenFileOpenHint,
  isAndroid,
  isInstalledPwa,
  isIos,
  markFileOpenHintSeen,
  markPwaInstalled,
  noHandlerHint,
  platformHint,
  setDefaultAppChoice,
  supportsFileHandling,
} from "./defaultApp.js";

export default function DefaultAppPrompt({
  onInstallRequest,
  forceOpen = false,
  onDismiss,
}) {
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    const choice = getDefaultAppChoice();
    if (choice === PROMPT_CHOICE.NEVER) return;
    if (choice === PROMPT_CHOICE.ACCEPTED && isInstalledPwa()) return;
    const t = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(t);
  }, [forceOpen]);

  const close = (choice) => {
    setDefaultAppChoice(choice);
    setOpen(false);
    onDismiss?.();
  };

  const handleYes = async () => {
    setInstalling(true);
    setHint("");
    try {
      const ok = await onInstallRequest?.();
      markPwaInstalled();
      if (!ok) {
        setHint(
          "Use o menu do navegador (Instalar app / Adicionar à tela inicial). Depois siga os passos em «Como abrir .docx e .pdf»."
        );
      } else if (isAndroid() || isIos()) {
        setHint(
          "Importante: abra ficheiros pelo ícone PIENG Leitor na home. Se já instalou antes, remova o atalho e instale de novo para o sistema reconhecer .docx."
        );
      }
    } finally {
      setInstalling(false);
    }
  };

  if (!open) return null;

  const plat = platformHint();
  const installed = isInstalledPwa();
  const showNoAppNote = isAndroid() || isIos();

  return (
    <div className="default-app-backdrop" role="dialog" aria-labelledby="default-app-title">
      <div className="default-app-modal">
        <h2 id="default-app-title">Leitor oficial de documentos?</h2>
        <p>
          Quer usar o <strong>PIENG Leitor</strong> para abrir PDF, Word e Excel no telemóvel ou PC —
          sem outras apps de propaganda?
        </p>
        <ul className="default-app-benefits">
          <li>PDF, .doc, .docx, .xls e .xlsx</li>
          <li>Leitura com zoom e modo foco</li>
          <li>Instalado como app (PWA) — pode aparecer em «Abrir com»</li>
        </ul>
        {installed && (
          <p className="default-app-ok">App já instalado neste dispositivo.</p>
        )}
        {supportsFileHandling() && (
          <p className="default-app-ok">
            Este navegador pode associar ficheiros ao PIENG (PDF, Word, Excel).
          </p>
        )}
        {showNoAppNote && (
          <p className="default-app-hint">
            <strong>«Não há app para abrir .docx»?</strong> {noHandlerHint("documento.docx")}
          </p>
        )}
        {hint && <p className="default-app-hint">{hint}</p>}
        <div className="default-app-actions">
          <button type="button" className="primary" onClick={handleYes} disabled={installing}>
            {installing ? "Aguarde…" : "Sim, quero instalar"}
          </button>
          <button type="button" onClick={() => close(PROMPT_CHOICE.DISMISSED)}>
            Agora não
          </button>
          <button type="button" className="secondary" onClick={() => close(PROMPT_CHOICE.NEVER)}>
            Não perguntar de novo
          </button>
        </div>
        <details
          className="default-app-steps"
          open={!hasSeenFileOpenHint() && (isAndroid() || isIos())}
          onToggle={(e) => {
            if (e.target.open) markFileOpenHintSeen();
          }}
        >
          <summary>Como abrir .docx, .pdf e Excel ({plat.id})</summary>
          <ol>
            {plat.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </details>
        <button
          type="button"
          className="default-app-close"
          onClick={() => close(PROMPT_CHOICE.DISMISSED)}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
