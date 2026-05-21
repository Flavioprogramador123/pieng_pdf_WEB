import { useEffect, useState } from "react";
import {
  PROMPT_CHOICE,
  getDefaultAppChoice,
  isInstalledPwa,
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
      setDefaultAppChoice(PROMPT_CHOICE.ACCEPTED);
      if (!ok) {
        setHint(
          "Use o menu do navegador (Instalar aplicativo / Adicionar à tela inicial) e depois defina como app padrão nas dicas abaixo."
        );
      }
    } finally {
      setInstalling(false);
    }
  };

  if (!open) return null;

  const plat = platformHint();
  const installed = isInstalledPwa();

  return (
    <div className="default-app-backdrop" role="dialog" aria-labelledby="default-app-title">
      <div className="default-app-modal">
        <h2 id="default-app-title">Leitor oficial de documentos?</h2>
        <p>
          Quer usar o <strong>PIENG PDF Web</strong> para abrir PDF, Word e Excel no PC ou celular —
          sem apps cheias de propaganda?
        </p>
        <ul className="default-app-benefits">
          <li>Leitura com zoom, girar e modo foco</li>
          <li>Abre .pdf, .doc, .docx e .xls no app (conversão .doc no servidor quando disponível)</li>
          <li>Funciona instalado como aplicativo (PWA)</li>
        </ul>
        {installed && (
          <p className="default-app-ok">App já instalado neste dispositivo.</p>
        )}
        {supportsFileHandling() && (
          <p className="default-app-ok">Este navegador suporta abrir arquivos direto no PIENG.</p>
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
        <details className="default-app-steps">
          <summary>Como definir como leitor padrão ({plat.id})</summary>
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
