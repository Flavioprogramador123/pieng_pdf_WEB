# Relatório de finalização — PIENG PDF Web (leitor)

**Data:** 21/05/2026  
**Produção:** https://pieng-pdf-web.vercel.app  
**Repositório:** https://github.com/Flavioprogramador123/pieng_pdf_WEB  
**Versão em produção (código):** **v39** (`BUILD_SEQ = 39`, commit `ade1827`)  
**Base estável de referência:** **v32** (`85d8606`)

---

## 1. Objetivo da sessão

Recuperar estabilidade após problemas de zoom/tela preta (v33–v38), restaurar base **v32**, evoluir **aos poucos** com foco em:

- Leitura **Word** (.docx) fiel (logos, layout)
- Leitura **Excel** (.xlsx) fiel no **mobile** (prioridade do negócio)
- Não prejudicar PDF, API, PWA e deploy Vercel

---

## 2. Linha do tempo (resumo)

| Versão | Commit | O que foi feito |
|--------|--------|-----------------|
| **Restauração v32** | `91c56eb` | Código voltou ao estado `85d8606` (Excel fundo branco largo) |
| **v33** | `6424051` | `.doc` vs `.docx` — mensagens e MIME no telemóvel |
| **v34** | `c55e896` | **docx-preview** — Word com imagens/logos (substitui Mammoth no preview) |
| **v35** | `a23f844` | API `/convert-legacy-doc` para `.doc` (Word/LibreOffice no PC) |
| **v36** | `ddf7746` | LibreOffice em Program Files + Word via PowerShell |
| **v37** | `f9e942d` | Zoom 100%, CSS Word/Excel separado, docx sem tabela HTML por cima |
| **v38** | `3ff6cb8` | **Fortune Sheet** para Excel + flag `excelHtmlFallback` |
| **v39** | `ade1827` | Ajuste fino linhas/colunas Fortune Sheet (texto menos cortado) |

**Commits v36–v38 (tela preta / TDZ / index)** existem no histórico mas foram **revertidos** com o restore v32; correções equivalentes foram reintroduzidas de forma incremental (v37–v39).

---

## 3. Estado final aceite pelo utilizador

### Funciona bem (manter)

| Formato | Mobile | PC / Web |
|---------|--------|----------|
| **.docx** | Ok (v34+) | Ok — docx-preview |
| **.xlsx** | Ok (~98–100%) — Fortune Sheet v38/v39; scroll vertical para ler | Pequena deformação visual aceite; **não bloqueia** — prioridade é mobile |
| **.pdf** | Modo leitura + editor (base v32+) | Idem |
| **PWA / upload / API** | Operacional | Idem |

### Aceite / adiado

- **Deformação leve .xlsx no PC** — fica como está; amanhã ou futuro: vista tipo PDF/imagem só no desktop (LibreOffice → PDF + PDF.js).
- **Zoom** — precisa **revisão com calma** (foi a origem de regressões desde v33+). **Não alterar hoje.**
- **.doc na Vercel** — sem LibreOffice no servidor; converter para `.docx` ou usar `run.bat` no PC.

---

## 4. Problemas conhecidos (documentados)

### 4.1 Zoom (prioridade amanhã)

- A partir da **v32**, alterações de zoom no modo leitura PDF geraram:
  - Lentidão com vários ficheiros
  - Tela preta (race `pdfRef` / efeitos React) — corrigido em commits posteriores, depois restore
  - **404** em `/api/pdf/view/{id}` na **Vercel** ao dar zoom (armazenamento efémero + PDF.js pede ranges) — mitigação antiga: 1 página + debounce (revertido com v32)
- **Decisão:** revisar zoom **incrementalmente**, testando PDF + Word + Excel em mobile e PC, sem repetir “renderizar todas as páginas” no PDF ao mudar zoom.

### 4.2 Excel PC vs mobile

- **Mobile:** área de leitura utilizável (scroll da página); renderização aprovada na **v38**.
- **PC:** Fortune Sheet com ~2% de diferença vs Excel (Chrome; Edge por testar). Utilizador aceita manter.

### 4.3 Histórico `.doc` / Mammoth

- Na **v32** o Git **nunca** teve preview Word “completo” com Mammoth (sem imagens). A sensação de “como no Word” na v32 era layout simples ou ficheiros só com texto.

---

## 5. Configuração e rollback

### Badge

- UI: **v39** (canto superior após deploy).

### Flags (`frontend/src/features/featureFlags.js`)

```javascript
export const FEATURES = {
  readingToolbar: true,
  officeReader: true,
  defaultAppPrompt: true,
  excelHtmlFallback: false,  // true = tabela HTML antiga (v37)
};
```

### Rollback rápido

| Alvo | Ação |
|------|------|
| Só Excel HTML | `excelHtmlFallback: true` + deploy |
| Leitor simples v27 | `readingToolbar: false`, `officeReader: false` + deploy |
| Código v32 puro | `git checkout 85d8606` ou Promote deploy v32 na Vercel |

### Comandos locais

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
# http://localhost:5001
```

---

## 6. Arquivos principais tocados nesta evolução

| Área | Ficheiros |
|------|-----------|
| Word | `frontend/src/officeReader.js`, `docx-preview` |
| Excel | `frontend/src/ExcelFortuneViewer.jsx`, `excelFortune.js` |
| Layout | `frontend/src/App.css`, `App.jsx` |
| .doc API | `src/converters/doc_to_docx.py`, `src/routes/pdf.py` |
| Versão | `frontend/src/buildVersion.js` |
| Documentação | `EVOLUCAO-LEITOR.md`, este relatório |

---

## 7. Pendências para amanhã (não implementar hoje)

1. **Zoom** — plano de testes e alterações mínimas:
   - PDF na Vercel (blob local vs API; 1 página vs todas)
   - Word/Excel: `zoom` CSS vs `scale`; reset ao trocar ficheiro
   - Mobile: área útil do painel (se ainda ~50% em algum viewport)
2. **Excel PC (opcional)** — protótipo “só desktop”: xlsx → PDF no servidor → PDF.js
3. Validar **Edge** vs Chrome na deformação PC (só registo; sem obrigar mudança)

---

## 8. Testes recomendados no próximo dia

1. Confirmar badge **v39** no F12 (hash JS alinhado ao `index.html`).
2. Mobile: `.docx` + `.xlsx` — modo leitura, zoom +/−, troca de aba Excel.
3. PC: `.xlsx` — aceitar deformação ou testar Edge; **não** bloquear release por isso.
4. PDF: abrir → modo leitura → zoom (anotar 404 na Vercel se upload foi pela API).

---

## 9. Conclusão

A sessão fechou com **base v32 preservada na estratégia**, evolução **v33→v39** em passos pequenos, e **prioridade mobile** para Word/Excel. O sistema em produção está **utilizável** para o caso principal; zoom e refinamento Excel PC ficam **explicitamente adiados** para evitar nova regressão.

**Relacionado:** [EVOLUCAO-LEITOR.md](./EVOLUCAO-LEITOR.md) · [LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md)
