const STORAGE_KEY = "pieng-default-app-choice";

export const PROMPT_CHOICE = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DISMISSED: "dismissed",
  NEVER: "never",
};

export function getDefaultAppChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) || PROMPT_CHOICE.PENDING;
  } catch {
    return PROMPT_CHOICE.PENDING;
  }
}

export function setDefaultAppChoice(choice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore */
  }
}

export function shouldShowDefaultAppPrompt() {
  const c = getDefaultAppChoice();
  return c === PROMPT_CHOICE.PENDING || c === PROMPT_CHOICE.DISMISSED;
}

export function isInstalledPwa() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function supportsFileHandling() {
  return "launchQueue" in window;
}

export function platformHint() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) {
    return {
      id: "android",
      steps: [
        "Instale o app (botão abaixo ou menu do Chrome → «Instalar app»).",
        "Abra um PDF no celular → «Abrir com» → escolha PIENG Leitor.",
        "Opcional: Configurações → Apps → PIENG Leitor → «Abrir por padrão» → ative tipos de arquivo.",
      ],
    };
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return {
      id: "ios",
      steps: [
        "Safari → compartilhar → «Adicionar à Tela de Início».",
        "Abra arquivos pelo app instalado; o iOS não permite leitor padrão de PDF como no Android.",
      ],
    };
  }
  return {
    id: "desktop",
    steps: [
      "Instale o app (botão ou ícone ⊕ na barra de endereço do Chrome/Edge).",
      "Windows: Configurações → Aplicativos → Aplicativos padrão → escolha PIENG Leitor para .pdf (quando listado).",
      "Ou: clique direito no arquivo → Abrir com → PIENG Leitor / Chrome (app instalado).",
      "Chrome/Edge: o site precisa estar instalado como PWA para aparecer em «Abrir com».",
    ],
  };
}
