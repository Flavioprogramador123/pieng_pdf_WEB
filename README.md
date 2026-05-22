# PIENG PDF Web

Editor e leitor de **PDF**, **Word (.docx)** e **Excel** no navegador — versão web do **PIENG PDF Studio**.

| | |
|--|--|
| **Produção** | https://pieng-pdf-web.vercel.app |
| **Versão** | **v45** (badge no canto da app) |
| **Repo** | https://github.com/Flavioprogramador123/pieng_pdf_WEB |

**Deploy:** [VERCEL.md](./VERCEL.md) · **Estado do leitor:** [EVOLUCAO-LEITOR.md](./EVOLUCAO-LEITOR.md) · **Continuidade:** [Resumo.md](./Resumo.md)

---

## Funcionalidades

### PDF

- Visualização **PDF.js**, miniaturas, modo leitura (zoom, rotação, páginas)
- Editar: rotacionar, excluir, mover, copiar, merge, split, salvar
- Exportar **DOCX** (API `pdf2docx`; no PC pode usar Word/LibreOffice)
- Modo local no browser se a API falhar

### Word (.docx)

- Leitor **docx-preview** (layout, imagens, páginas A4)
- Zoom e rotação no modo leitura
- **`.doc` antigo:** sem preview na web — guardar como `.docx` ou usar `run.bat` no PC

### Excel (.xlsx / .xls)

- **Fortune Sheet** no modo leitura (prioridade mobile)
- Rollback para tabela HTML: `excelHtmlFallback: true` em `featureFlags.js`

### PWA (leitor oficial)

- Instalar no telemóvel/PC — [LEITOR-OFICIAL.md](./LEITOR-OFICIAL.md)
- Android: abrir `.pdf` / `.docx` / `.xlsx` com «Abrir com» — [LEITOR-MOBILE-ARQUIVOS.md](./LEITOR-MOBILE-ARQUIVOS.md)

---

## Local (Windows)

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
```

→ http://localhost:5001 (Flask + build do frontend; Word `.doc` com conversão se Word/LibreOffice instalado)

---

## Publicar

```powershell
git push origin main
```

Build na Vercel: `cd frontend && npm run build` → `src/static/`

---

## Estrutura

```
pieng_pdf_WEB/
├── api/index.py          # API Flask (Vercel serverless)
├── frontend/             # React + Vite + PDF.js + docx-preview + Fortune Sheet
├── src/                  # Flask local + rotas + converters
├── vercel.json
└── run.bat
```

---

## Reverter leitor (emergência)

`frontend/src/features/featureFlags.js` — ver [EVOLUCAO-LEITOR.md](./EVOLUCAO-LEITOR.md#reverter-rápido)
