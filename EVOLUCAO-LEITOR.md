# Evolução: leitor PDF / Word / Excel

**Relatório de fecho da sessão:** [RELATORIO-FINALIZACAO.md](./RELATORIO-FINALIZACAO.md) (v39 em produção, pendências: zoom, Excel PC opcional).

Base estável: **v32** (`85d8606`). Mudanças pequenas a partir daqui (v33, v34…).

## v40 — PWA abrir ficheiros no mobile (Android / iOS)

- Manifest: `application/octet-stream` + extensões `.pdf` `.doc` `.docx` `.xls` `.xlsx`
- `launchQueue` registado antes do React (`fileLaunch.js`)
- Guia [LEITOR-MOBILE-ARQUIVOS.md](./LEITOR-MOBILE-ARQUIVOS.md) + dicas na app

## Estado atual (21/05/2026)

- **Produção:** v39 — mobile `.docx`/`.xlsx` ok; PC `.xlsx` com deformação leve aceite
- **Amanhã:** revisar **zoom** com calma (evitar regressões pós-v32)
- **Futuro PC:** Excel como PDF/imagem só no desktop (opcional)

## v39 — Ajuste fino Excel (Fortune Sheet)

- Linhas/colunas com ~14% margem após import (evita texto cortado em células mescladas)
- `devicePixelRatio` nativo; modo leitura sem destaque de seleção

## v38 — Excel com Fortune Sheet (modo leitura)

- `.xlsx` / `.xls` com **Fortune Sheet** + importador com estilos (substitui tabela HTML)
- Rollback: `excelHtmlFallback: true` em `featureFlags.js` (vista HTML v37)
- Se o import falhar, volta automaticamente para HTML simplificado

## v37 — Layout Word/Excel fiel

- Zoom padrão **100%** (antes 140% deformava o documento)
- Estilos de tabela Excel **não** sobrescrevem mais o Word (docx-preview)
- Word: largura real do `.docx`, scroll horizontal, imagens sem encolher
- Zoom com `zoom` CSS em vez de `scale()`; botão Largura também em Office

## v36 — Conversão .doc no Windows

- Procura LibreOffice em `C:\Program Files\LibreOffice\...`
- Fallback **Word via PowerShell** (sem pywin32) se o Word estiver instalado
- `run.bat` reinstala dependências locais (`pywin32`)

## v35 — Abrir .doc (Word antigo)

- Upload `.doc` tenta conversão na API (`/convert-legacy-doc`) com LibreOffice ou Word (Windows)
- Se o ficheiro for ZIP disfarçado de `.doc`, abre direto como `.docx`
- Na Vercel sem LibreOffice: guarde como `.docx` ou use `run.bat` no PC

## v34 — Word (.docx) com layout e imagens

- Leitor `.docx` passa a usar **docx-preview** (mantém logos, gráficos e páginas)
- v32–v33 usavam só **Mammoth** → HTML sem imagens (nunca foi “Word completo” no Git)
- Commit base v32: **`85d8606`** (`fix(v32): fundo branco Excel…`)

## v33 — Upload Word (.doc vs .docx)

- `.docx` e Excel: leitura no navegador (como v32)
- `.doc` (Word antigo): mensagem clara — converter para `.docx` (Mammoth não lê binário `.doc`)
- MIME `application/msword` / extensão vazia no telemóvel: deteção melhorada

## v31 — Leitor oficial (PWA)

- Diálogo: tornar PIENG o leitor de PDF/Word/Excel
- `manifest.webmanifest` + `file_handlers` + service worker
- Ver **[LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md)**

## O que foi adicionado (v28+)

- **Modo leitura** com barra de ferramentas: zoom +/−, 100%, largura (PDF), girar ↺↻, páginas ‹›
- **Upload** de `.pdf`, `.docx`, `.xls`, `.xlsx` (Word/Excel só no navegador; `.doc` → converter para `.docx`)
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
