const STORAGE_KEY = "pieng-default-app-choice";
const FILE_HINT_KEY = "pieng-file-open-hint-seen";
const INSTALLED_KEY = "pieng-pwa-installed-mark";

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
    if (choice === PROMPT_CHOICE.ACCEPTED) {
      localStorage.setItem(INSTALLED_KEY, String(Date.now()));
    }
  } catch {
    /* ignore */
  }
}

export function markPwaInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, String(Date.now()));
    setDefaultAppChoice(PROMPT_CHOICE.ACCEPTED);
  } catch {
    /* ignore */
  }
}

export function hasSeenFileOpenHint() {
  try {
    return localStorage.getItem(FILE_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFileOpenHintSeen() {
  try {
    localStorage.setItem(FILE_HINT_KEY, "1");
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

export function isAndroid() {
  return /Android/i.test(navigator.userAgent || "");
}

export function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

export function platformHint() {
  if (isAndroid()) {
    return {
      id: "android",
      steps: [
        "Instale o PIENG Leitor (botão «Sim, quero instalar» ou menu Chrome ⋮ → «Instalar app» / «Adicionar ao ecrã inicial»).",
        "Abra o ficheiro .docx no Gestor de ficheiros ou Downloads (toque no ficheiro).",
        "Quando aparecer «Abrir com», escolha PIENG Leitor (ou Chrome → PIENG Leitor).",
        "Toque em «Sempre» ou «Só uma vez» — na primeira vez use «Sempre» para ficar como padrão.",
        "Se não aparecer na lista: Configurações → Apps → PIENG Leitor → «Abrir por defeito» → ativar «Abrir links suportados» e tipos de ficheiro.",
        "Alternativa: dentro do PIENG → «Enviar PDF / Word / Excel» e escolha o ficheiro.",
        "Partilhar: no ficheiro → Partilhar → PIENG Leitor (se listado).",
      ],
    };
  }
  if (isIos()) {
    return {
      id: "ios",
      steps: [
        "Safari → partilhar → «Adicionar à Tela de Início» (obrigatório — não basta favorito).",
        "Abra o PIENG Leitor pelo ícone na home screen (não pelo Safari).",
        "O iPhone muitas vezes NÃO mostra PWAs em «Abrir com» para .docx — é limitação do iOS.",
        "Use: Ficheiros → toque no .docx → Partilhar → PIENG Leitor (se aparecer).",
        "Ou: abra o PIENG Leitor → «Enviar PDF / Word / Excel» → escolha o ficheiro.",
        "Para PDF, o iOS costuma listar mais apps; Word/Excel dependem da versão do iOS 16+.",
      ],
    };
  }
  return {
    id: "desktop",
    steps: [
      "Instale o app (botão ou ícone ⊕ na barra de endereço do Chrome/Edge).",
      "Windows: clique direito no ficheiro → Abrir com → PIENG Leitor.",
      "Windows: Definições → Aplicações → Aplicações predefinidas → escolha por extensão (.pdf, .docx).",
      "O site tem de estar instalado como PWA para aparecer em «Abrir com».",
    ],
  };
}

/** Mensagem curta quando o SO diz que não há app para o tipo de ficheiro. */
export function noHandlerHint(filename = "") {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const plat = platformHint();
  if (plat.id === "ios") {
    return (
      `No iPhone, o sistema pode não oferecer o PIENG para .${ext || "docx"}. ` +
      "Abra o ícone «PIENG Leitor» na home e use «Enviar PDF / Word / Excel», " +
      "ou Partilhar → PIENG Leitor no ficheiro."
    );
  }
  if (plat.id === "android") {
    return (
      `Para .${ext || "docx"}: instale o PIENG Leitor, depois abra o ficheiro → «Abrir com» → PIENG Leitor → «Sempre». ` +
      "Se não aparecer, use «Enviar PDF / Word / Excel» dentro do app."
    );
  }
  return "Instale o PIENG Leitor como PWA e use «Abrir com» no ficheiro.";
}
