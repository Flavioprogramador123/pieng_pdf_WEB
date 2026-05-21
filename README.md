# PIENG PDF Web

Editor e leitor de PDF no navegador — versão web do **PIENG PDF Studio**.

**Continuidade e histórico:** **[Resumo.md](./Resumo.md)** — tudo o que foi feito, links e melhorias futuras.

**API offline no Netlify?** Siga **[RAILWAY.md](./RAILWAY.md)** (5 minutos).

**Prefere Vercel em vez de Netlify?** **[VERCEL.md](./VERCEL.md)** (mesma API no Railway).

**Publicar online:** veja **[DEPLOY.md](./DEPLOY.md)** (GitHub + Netlify/Vercel + API).
## Funcionalidades

- Abrir em qualquer navegador (Chrome, Edge, Firefox)
- Visualização completa com **PDF.js**
- Modo leitura (scroll contínuo)
- Rotacionar, excluir, mover, copiar páginas
- Unir (merge) e dividir (split) PDFs
- Salvar PDF editado
- Exportar para **DOCX** (via `pdf2docx` / LibreOffice no servidor)
- Extrair texto para leitura/cópia

## Estrutura

```
pieng_pdf_WEB/
├── frontend/          # React + Vite + PDF.js
├── src/
│   ├── main.py        # Flask (API + static)
│   ├── routes/pdf.py
│   └── converters/    # Lógica herdada do Studio
└── requirements.txt
```

## Executar localmente (Windows)

```powershell
cd E:\Projetos\pieng_pdf_WEB

# Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
cd ..

# Servidor (porta 5001)
python src\main.py
```

Abra: **http://localhost:5001**

### Desenvolvimento com hot-reload

Terminal 1: `python src\main.py`  
Terminal 2: `cd frontend && npm run dev` → http://localhost:5173 (proxy `/api` → 5001)

## Deploy (resumo)

| Parte | Onde |
|-------|------|
| **Código** | GitHub |
| **Site (interface)** | Netlify |
| **API (PDF)** | Railway ou Render |

Passo a passo completo: **[DEPLOY.md](./DEPLOY.md)**.

Variável opcional na API: `PDF_UPLOAD_DIR`. No Netlify (opcional): `VITE_API_URL` se não usar o proxy em `netlify.toml`.
## API principal

- `POST /api/pdf/upload`
- `GET /api/pdf/view/<id>` — visualização inline
- `POST /api/pdf/apply` — salvar ordem/rotação das páginas
- `POST /api/pdf/rotate`, `/delete-pages`, `/reorder`, `/duplicate-pages`
- `POST /api/pdf/merge`, `/split`
- `POST /api/pdf/to-docx/<id>`
- `GET /api/pdf/download/<id>`
