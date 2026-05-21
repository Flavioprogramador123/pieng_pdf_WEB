# PIENG PDF Web

Editor e leitor de PDF no navegador — versão web do **PIENG PDF Studio**.

**Deploy:** **[VERCEL.md](./VERCEL.md)** — site + API no Vercel (sem Railway).

**Continuidade:** **[Resumo.md](./Resumo.md)**

## Funcionalidades

- Visualização com **PDF.js**
- Modo leitura, rotação, exclusão, mover, copiar páginas
- Merge, split, salvar PDF editado
- **DOCX** com tabelas/logos (via API `pdf2docx` / Word no PC)
- Modo local no navegador se a API falhar

## Local (Windows)

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
```

→ http://localhost:5001

## Estrutura

```
pieng_pdf_WEB/
├── api/index.py       # API Flask (Vercel serverless)
├── frontend/          # React + Vite
├── src/               # Flask local + rotas
└── vercel.json
```
