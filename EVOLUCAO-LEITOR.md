# Evolução: leitor PDF / Word / Excel

## v38 — Crash ao abrir (`Cannot access before initialization`)

- `refreshReadingPdfPage` estava declarado **depois** do `useEffect` de zoom que o referencia (TDZ no render)

## v37 — Tela preta no modo leitura (PDF)

- Garante carregamento do PDF (`ensurePdfLoaded`) antes de pintar o canvas
- Zoom não depende mais de `readingMode` obsoleto no efeito (usa `readingModeRef`)
- `paintReading` espera o DOM do painel de leitura montar (`requestAnimationFrame`)
- Placeholder quando não há PDF selecionado

## v35 — Performance modo leitura PDF

- PDF: renderiza **só a página atual** (não todas de uma vez após zoom)
- Troca de arquivo: zoom volta ao padrão (100%) — abertura mais rápida
- Zoom PDF com pequeno atraso (120 ms) para não travar ao clicar +/− várias vezes

## v31 — Leitor oficial (PWA)

- Diálogo: tornar PIENG o leitor de PDF/Word/Excel
- `manifest.webmanifest` + `file_handlers` + service worker
- Ver **[LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md)**

## O que foi adicionado (v28+)

- **Modo leitura** com barra de ferramentas: zoom +/−, 100%, largura (PDF), girar ↺↻, páginas ‹›
- **Upload** de `.pdf`, `.docx`, `.doc`, `.xls`, `.xlsx` (Word/Excel só no navegador, sem API)
- Leitor **DOCX** (mammoth → HTML) e **planilha** (SheetJS → tabela HTML)

## O que NÃO mudou (v27 preservado)

- Editor de páginas PDF, merge, split, DOCX API + fallback
- API `/api/pdf/*`, deploy Vercel, badge de versão

## Reverter rápido (se algo quebrar)

### Opção A — flags (sem git)

Em `frontend/src/features/featureFlags.js`:

```javascript
export const FEATURES = {
  readingToolbar: false,
  officeReader: false,
};
```

Commit + deploy → volta ao leitor simples v27.

### Opção B — git

```powershell
cd E:\Projetos\pieng_pdf_WEB
git log --oneline -5
git revert HEAD
git push
```

Ou na Vercel: **Deployments** → deploy **v27** (commit `ba002e6` / `7e66a34`) → **Promote to Production**.

## Testar após deploy

1. PDF → **Modo leitura** → zoom e girar
2. Enviar `.docx` e `.xlsx` → abre no leitor
3. **→ DOCX** em PDF ainda baixa arquivo (Network: `convert-docx` 200)
