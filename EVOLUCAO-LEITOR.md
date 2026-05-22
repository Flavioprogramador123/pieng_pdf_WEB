# Evolução: leitor PDF / Word / Excel

**Estado congelado (produção):** **v45** — commit `89c65c6` — https://pieng-pdf-web.vercel.app  
**Relatório de fecho:** [RELATORIO-FINALIZACAO.md](./RELATORIO-FINALIZACAO.md)  
**Não evoluir o leitor sem necessidade** — o sistema está aceite nesta versão.

Base estável histórica: **v32** (`85d8606`). Evolução incremental v33→v45.

---

## Estado atual (maio/2026) — v45

| Área | Status |
|------|--------|
| **PDF** | Editor + modo leitura; zoom no PDF via **CSS** (sem re-render de todas as páginas) |
| **.docx** | **docx-preview** — layout A4, imagens; `normalizeDocxPageSizes`; mensagem UI sem `.doc` |
| **.xlsx / .xls** | **Fortune Sheet** no mobile (~98%); PC com deformação leve **aceite** |
| **.doc** | **Sem preview** na web/mobile; converter para `.docx` ou `run.bat` no PC (API local) |
| **PWA v40** | `file_handlers`, `fileLaunch.js`, guia [LEITOR-MOBILE-ARQUIVOS.md](./LEITOR-MOBILE-ARQUIVOS.md) |
| **IDs locais** | `newFileId.js` — funciona em HTTP sem `crypto.randomUUID` |
| **Deploy** | Vercel (`vercel.json`); push `main` → build automático |

### Flags ativas (`featureFlags.js`)

```javascript
readingToolbar: true,
officeReader: true,
defaultAppPrompt: true,
excelHtmlFallback: false,
```

### Opcional / adiado (não bloqueia)

- Excel no PC → PDF no servidor (só desktop)
- Nitidez máxima do zoom PDF (repintar só página visível)
- Páginas Word paisagem + retrato no mesmo ficheiro (tamanhos podem diferir de propósito)

---

## v45 — Zoom PDF + docx-preview + estabilidade

- Zoom PDF: escala fixa no canvas + `applyPdfReadTransform` (CSS)
- Word: `normalizeDocxPageSizes`, quebras Word (`ignoreLastRenderedPageBreak: false`), CSS sem `max-width` nas secções
- `newFileId` substitui `crypto.randomUUID`
- Mensagem upload: «Word (.docx)» — não promete `.doc`
- Build **v45** — deploy `89c65c6`

## v44 — `newFileId`

- Corrige `crypto.randomUUID is not a function` em HTTP/WebView antigo

## v43 — Layout A4 Word

- Contentor `fit-content`, branco só nas folhas, zoom em `.docx-wrapper`

## v42 — docx-preview após zoom v41

- Restaura `applyOfficeTransform` no paint; efeitos separados PDF vs Office

## v41 — Zoom PDF seguro

- Evita re-render de todas as páginas ao mudar zoom (regressão v32+)

## v40 — PWA abrir ficheiros no mobile

- Manifest: `application/octet-stream` + extensões
- `launchQueue` em `fileLaunch.js` (antes do React)

## v39 — Ajuste fino Excel (Fortune Sheet)

- Linhas/colunas ~14% margem; `devicePixelRatio` nativo

## v38 — Excel Fortune Sheet

- Rollback: `excelHtmlFallback: true`

## v37 — Layout Word/Excel fiel

- Zoom 100%; CSS Word/Excel separado

## v36–v35 — `.doc` no PC

- API `/convert-legacy-doc` (LibreOffice / Word Windows)

## v34 — docx-preview

- Substitui Mammoth no **preview** (Mammoth só texto na aba Texto)

## v33 — MIME mobile

- `.doc` vs `.docx` — mensagens claras

## v31 — Leitor oficial (PWA)

- Ver [LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md)

---

## O que foi adicionado (v28+)

- Modo leitura: zoom +/−, 100%, largura, girar, páginas (PDF)
- Upload: `.pdf`, `.docx`, `.xls`, `.xlsx`
- Leitor Word (**docx-preview**) e Excel (**Fortune Sheet**)

## O que NÃO mudou

- Editor PDF, merge, split, DOCX API, badge de versão, deploy Vercel

## Reverter rápido

### Flags (sem git)

```javascript
readingToolbar: false,
officeReader: false,
// ou excelHtmlFallback: true
```

### Git / Vercel

```powershell
git log --oneline -5
# Promote deploy anterior na Vercel ou git revert
```

## Testar após deploy

1. Badge **v45** no canto da app
2. `.docx` — folhas A4 uniformes, imagens
3. `.xlsx` no telemóvel — Fortune Sheet + zoom
4. PDF — modo leitura → zoom rápido, sem tela preta
5. **→ DOCX** em PDF (API) — Network `convert-docx` 200
