# Evolução: leitor PDF / Word / Excel

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
