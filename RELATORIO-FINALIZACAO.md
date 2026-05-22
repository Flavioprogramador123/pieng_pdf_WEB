# Relatório de finalização — PIENG PDF Web (leitor)

**Data de fecho:** maio/2026  
**Produção:** https://pieng-pdf-web.vercel.app  
**Repositório:** https://github.com/Flavioprogramador123/pieng_pdf_WEB  
**Versão em produção:** **v45** (`BUILD_SEQ = 45`, commit `89c65c6`)  
**Decisão:** **manter o sistema como está** — sem novas evoluções do leitor salvo correção crítica.

---

## 1. Objetivo alcançado

Substituto web do fluxo PIENG/Adobe para leitura e edição leve:

- **PDF** no browser (PDF.js + editor)
- **Word `.docx`** com layout e imagens (docx-preview)
- **Excel** no mobile com Fortune Sheet
- **PWA** para abrir ficheiros no Android (limitações iOS documentadas)
- Deploy unificado na **Vercel** (frontend + API serverless)

---

## 2. Linha do tempo (v32 → v45)

| Versão | Commit (ref.) | Tema |
|--------|---------------|------|
| v32 | `85d8606` | Base estável (Excel fundo branco, leitor v27+) |
| v33–v34 | `6424051`, `c55e896` | MIME mobile; **docx-preview** |
| v35–v36 | `a23f844`, `ddf7746` | API `.doc` → `.docx` (PC) |
| v37–v39 | `f9e942d` … `ade1827` | Zoom 100%; Fortune Sheet + ajuste finhas |
| v40 | `66f1260` | PWA `file_handlers` + `fileLaunch.js` |
| v41–v45 | `89c65c6` | Zoom PDF seguro; docx A4; `newFileId`; mensagem sem `.doc` |

---

## 3. Estado final aceite

| Formato | Mobile | PC / Vercel |
|---------|--------|-------------|
| **.pdf** | Modo leitura + editor; zoom CSS | Idem; API upload efémera (preferir modo local se 404 no view) |
| **.docx** | docx-preview, páginas A4 normalizadas | Idem |
| **.xlsx** | Fortune Sheet ~98% | Deformação leve **aceite** |
| **.doc** | Sem preview — guardar como `.docx` | Conversão só com `run.bat` + Word/LibreOffice |
| **PWA** | Android «Abrir com»; iOS Partilhar/Enviar | Instalar no Chrome/Edge |

---

## 4. Problemas resolvidos na v41–v45

| Problema | Solução |
|----------|---------|
| Zoom PDF lento / tela preta | Zoom só em CSS no PDF; não repinta todas as páginas |
| docx-preview quebrado após zoom | Office com `applyOfficeTransform` no paint; efeitos separados |
| Área branca enorme à esquerda | CSS `fit-content`; branco só nas secções A4 |
| Páginas Word grandes/pequenas | `normalizeDocxPageSizes`; sem override `max-width` |
| `crypto.randomUUID is not a function` | `newFileId.js` |

---

## 5. Limitações conhecidas (aceites)

1. **`.doc`** — não há preview no browser; UI não promete abertura.
2. **Excel PC** — layout ~2% diferente do Excel nativo.
3. **Zoom PDF muito alto** — ampliação CSS (pode ficar menos nítida que 300% nativo).
4. **Vercel** — storage efémero; PDF carregado pela API pode falhar em `/view` após tempo.
5. **iOS** — PWA raramente aparece como leitor predefinido de `.docx`.

---

## 6. Configuração e rollback

### Badge

UI mostra **v45** após deploy.

### Flags (`frontend/src/features/featureFlags.js`)

```javascript
export const FEATURES = {
  readingToolbar: true,
  officeReader: true,
  defaultAppPrompt: true,
  excelHtmlFallback: false,
};
```

### Rollback

| Alvo | Ação |
|------|------|
| Excel HTML antigo | `excelHtmlFallback: true` + deploy |
| Leitor v27 simples | `readingToolbar: false`, `officeReader: false` |
| Código histórico | Promote deploy v32/v40 na Vercel ou `git revert` |

### Local

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
# http://localhost:5001
```

---

## 7. Arquivos principais (v45)

| Área | Ficheiros |
|------|-----------|
| PDF / zoom | `App.jsx`, `pdfViewer.js` |
| Word | `officeReader.js`, `App.css` |
| Excel | `ExcelFortuneViewer.jsx`, `excelFortune.js` |
| IDs | `newFileId.js`, `localPdf.js` |
| PWA | `manifest.webmanifest`, `fileLaunch.js`, `defaultApp.js` |
| Versão | `buildVersion.js` |
| Flags | `features/featureFlags.js` |
| .doc API | `src/converters/doc_to_docx.py`, `src/routes/pdf.py` |

---

## 8. Deploy

```powershell
cd E:\Projetos\pieng_pdf_WEB
git add .
git commit -m "descrição"
git push origin main
```

Vercel: `installCommand` + `buildCommand` em `vercel.json` → `src/static`.

---

## 9. Conclusão

O leitor está **utilizável em produção** na **v45** para o caso de negócio principal (mobile `.docx`/`.xlsx`, PDF, PWA Android). O código fica **congelado** neste desenho até nova decisão explícita de produto.

**Documentação relacionada:** [EVOLUCAO-LEITOR.md](./EVOLUCAO-LEITOR.md) · [LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md) · [LEITOR-MOBILE-ARQUIVOS.md](./LEITOR-MOBILE-ARQUIVOS.md) · [Resumo.md](./Resumo.md)
