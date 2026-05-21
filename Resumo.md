# Resumo do projeto — PIENG PDF Web

Documento de continuidade: contexto, o que foi feito, links, arquitetura e melhorias futuras.

**Última atualização:** maio/2026

---

## 1. Objetivo do produto

Substituir o uso limitado do **Adobe Acrobat** para tarefas comuns de PDF:

- Abrir em **qualquer navegador**
- Ver o PDF completo
- Editar páginas (rotacionar, excluir, mover, copiar, unir, dividir)
- Exportar para **DOCX**
- Modo leitura confortável
- Hospedar na **Netlify** (interface) com API em nuvem (Railway/Render)

Versão desktop de referência: **`E:\Projetos\pieng-pdf-studio`** (PyQt, v6.2.x — funcionalidades mais amplas).

---

## 2. Links e dados do projeto

| Item | Valor |
|------|--------|
| **Pasta local** | `E:\Projetos\pieng_pdf_WEB` |
| **Repositório GitHub** | https://github.com/Flavioprogramador123/pieng_pdf_WEB |
| **Clone** | `https://github.com/Flavioprogramador123/pieng_pdf_WEB.git` |
| **Site Netlify** | https://pieng-pdf-web.netlify.app |
| **Site Vercel (alternativa)** | Importar repo — ver [VERCEL.md](./VERCEL.md) |
| **Time Netlify** | pieng |
| **Branch de deploy** | `main` |
| **Projeto Studio (código-fonte lógica)** | `E:\Projetos\pieng-pdf-studio` |
| **Logos originais** | `E:\Projetos\Prompt_ORC_pieng\.netlify\static\assets\logos` |

### Deploy Netlify (configuração usada)

| Campo | Valor |
|--------|--------|
| Base directory | *(vazio — raiz do repo)* |
| Build command | `cd frontend && npm install && npm run build` |
| Publish directory | `src/static` |
| Arquivo de config | `netlify.toml` (raiz) |

### API (pendente em produção)

O `netlify.toml` ainda contém placeholder:

```toml
to = "https://SUBSTITUA-SUA-API.up.railway.app/api/:splat"
```

**Enquanto isso não for trocado pela URL real do Railway/Render**, o site abre mas **upload e edição na nuvem falham**. Localmente funciona com Flask na porta 5001.

---

## 3. Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│  Usuário (navegador)                                     │
└───────────────────────────┬─────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Netlify            │   /api/*     │  Railway / Render   │
│  React + PDF.js     │ ──────────►  │  Flask + pypdf      │
│  src/static (build) │   proxy      │  pdf2docx, uploads  │
└─────────────────────┘              └─────────────────────┘
         ▲
         │ git push main
┌─────────────────────┐
│  GitHub             │
└─────────────────────┘
```

| Camada | Tecnologia | Pasta |
|--------|------------|--------|
| Frontend | React 18, Vite 5, PDF.js 4 | `frontend/` |
| Backend | Flask 3, pypdf, flask-cors | `src/` |
| Build estático | Vite → `src/static/` | gerado (não versionar) |
| Conversão DOCX | pdf2docx (+ LibreOffice opcional) | `src/converters/pdf_to_docx.py` |

---

## 4. Estrutura de pastas

```
pieng_pdf_WEB/
├── frontend/
│   ├── public/
│   │   ├── assets/logos/     # logos PIENG (deploy)
│   │   └── favicon.png
│   ├── src/
│   │   ├── App.jsx           # UI principal
│   │   ├── App.css
│   │   ├── api.js            # chamadas à API
│   │   ├── pdfViewer.js      # PDF.js
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── src/
│   ├── main.py               # Flask (porta PORT ou 5001)
│   ├── routes/pdf.py         # API REST
│   ├── converters/pdf_to_docx.py
│   └── static/               # build do frontend (gitignore)
├── netlify.toml
├── railway.toml
├── Procfile
├── requirements.txt
├── run.bat                   # atalho Windows
├── README.md
├── DEPLOY.md                 # guia GitHub + Netlify + Railway
├── Resumo.md                 # este arquivo
└── obsoleto/                 # backups; netlify.toml duplicado foi removido
```

---

## 5. O que foi feito (cronologia)

### Fase 1 — Reorganização e produto web

- Projeto antigo tinha arquivos soltos na raiz (`App.jsx`, `pdf.py`, `main.py`) e imports quebrados.
- Criada estrutura `src/` + `frontend/`.
- API Flask completa em `src/routes/pdf.py` (inspirada no **PIENG PDF Studio**).
- Frontend React com **PDF.js**: visualização, miniaturas, toolbar.
- Funcionalidades: upload, merge, split, apply (salvar montagem), rotação, exclusão, reordenação, duplicar, extrair texto, DOCX, download.
- Upload temporário em `%TEMP%\pieng_pdf_uploads` (Windows) ou `PDF_UPLOAD_DIR`.

### Fase 2 — Correções de UX

- **Bug aba Texto → Editor:** canvas desmontado; corrigido com `tab` no `useEffect` + `requestAnimationFrame` ao voltar ao Editor.
- **Botão Copiar:** feedback visual; duplica página ativa (1 clique na miniatura) ou várias (duplo clique para selecionar).
- Rotação/exclusão passam a funcionar na página ativa se nada estiver selecionado.
- Faixa de dicas (`hint-bar`) na interface.

### Fase 3 — GitHub e Netlify

- Repositório: `Flavioprogramador123/pieng_pdf_WEB`.
- Commits iniciais na branch `main`.
- Site publicado: **pieng-pdf-web.netlify.app**.
- Documentação: `DEPLOY.md`, `README.md`, `netlify.toml`, `railway.toml`, `Procfile`.
- Pasta `obsoleto/`: cópia antiga de `netlify.toml` removida; README explicando que o ativo fica na raiz.

### Fase 4 — Identidade visual

- Logos copiados de `Prompt_ORC_pieng\.netlify\static\assets\logos`:
  - `logo-pieng-oficial.png` — header
  - `logo-pieng.png` — sidebar e tela vazia
  - `logo.png` / `grayscale_logo.png` — reserva
  - `favicon.png` — aba do navegador
- Commit: `feat: adicionar logos PIENG no header, sidebar e favicon`.

### Histórico Git (principal)

| Commit | Descrição |
|--------|-----------|
| `a3ebd85` | Projeto inicial web + guia deploy |
| `e5dc7e7` | Logos PIENG |

---

## 6. Funcionalidades atuais

### Interface (frontend)

| Recurso | Status | Como usar |
|---------|--------|-----------|
| Upload PDF | ✅ | Sidebar → Enviar PDF |
| Visualização página | ✅ | Miniaturas + canvas central |
| Modo leitura | ✅ | Botão no topo |
| Rotacionar | ✅ | Selecionar miniatura(s) → ↺ ↻ |
| Excluir | ✅ | Duplo clique para multi-seleção → Excluir |
| Mover ordem | ✅ | Página ativa → ↑ ↓ |
| Copiar página | ✅ | 1 clique = ativa; duplo = multi → Copiar |
| Salvar PDF editado | ✅ | **Salvar alterações** (chama `/api/pdf/apply`) |
| Merge | ✅ | Checkbox nos arquivos → Unir selecionados |
| Split | ✅ | Toolbar → Dividir |
| Extrair texto | ✅ | Toolbar ou aba **Texto** |
| Export DOCX | ✅ | **→ DOCX** (depende da API com pdf2docx) |
| Download | ✅ | Link ↓ na lista de arquivos |
| Logos / favicon | ✅ | Header, sidebar, empty state |

### API (backend) — endpoints

| Método | Rota | Função |
|--------|------|--------|
| POST | `/api/pdf/upload` | Upload |
| GET | `/api/pdf/view/<id>` | PDF inline (PDF.js) |
| GET | `/api/pdf/info/<id>` | Metadados e páginas |
| POST | `/api/pdf/apply` | Salvar ordem/rotação |
| POST | `/api/pdf/rotate` | Rotacionar (gera novo arquivo) |
| POST | `/api/pdf/delete-pages` | Excluir páginas |
| POST | `/api/pdf/reorder` | Reordenar |
| POST | `/api/pdf/duplicate-pages` | Duplicar |
| POST | `/api/pdf/merge` | Unir PDFs |
| POST | `/api/pdf/split` | Uma página por arquivo |
| POST | `/api/pdf/extract` | Extrair páginas específicas |
| POST | `/api/pdf/extract-text` | Texto |
| POST | `/api/pdf/to-docx/<id>` | Download DOCX |
| GET | `/api/pdf/download/<id>` | Download PDF |
| GET | `/api/pdf/list` | Listar temporários |
| DELETE | `/api/pdf/delete/<id>` | Remover do servidor |

Limite de upload Flask: **50 MB**.

---

## 7. Executar localmente

```powershell
cd E:\Projetos\pieng_pdf_WEB
.\run.bat
```

Ou manualmente:

```powershell
.\venv\Scripts\activate
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
python src\main.py
```

- **Produção local:** http://localhost:5001  
- **Dev frontend:** `cd frontend && npm run dev` → http://localhost:5173 (proxy `/api` → 5001)

---

## 8. Publicar alterações

```powershell
cd E:\Projetos\pieng_pdf_WEB
git add .
git commit -m "descrição da mudança"
git push
```

Netlify redeploya automaticamente ao push em `main`.

---

## 9. Pendências conhecidas

| Item | Prioridade | Notas |
|------|------------|--------|
| Deploy API Railway/Render | **Alta** | Sem isso o Netlify só mostra a UI |
| Atualizar URL em `netlify.toml` | **Alta** | Trocar `SUBSTITUA-SUA-API` |
| Persistência de arquivos na API | Média | Uploads em pasta temp; reinício do servidor limpa |
| Autenticação / login | Baixa | Não implementado |
| OCR PDF escaneado | Baixa | Studio tem mais recursos; web não |
| Compressão de PDF | Média | Existe no Studio, não na web |
| Assinatura digital | Baixa | Studio em desenvolvimento |
| Numeração de páginas | Média | Studio tem; portar para API |
| Undo/redo | Média | Studio tem; web só edita em memória até Salvar |
| Arrastar miniatura (drag-drop) | Média | Hoje só ↑↓ |
| `.doc` (legado) | Baixa | Só DOCX na API |
| Testes automatizados | Média | Não há suite de testes |
| CI GitHub Actions | Baixa | build + lint opcional |

---

## 10. Melhorias sugeridas (roadmap)

### Curto prazo

1. Concluir **Railway** + proxy Netlify → site 100% funcional online.
2. Variável `VITE_API_URL` documentada se não usar proxy.
3. Mensagem amigável no site quando API offline (“Configure a API…”).
4. Botão **Copiar texto** na aba Texto.
5. Confirmação antes de excluir várias páginas.

### Médio prazo

6. Reaproveitar do Studio: **compressão**, **numeração**, mais estratégias DOCX (Docling).
7. Drag-and-drop de miniaturas para reordenar.
8. Preview antes do merge.
9. Tema claro/escuro.
10. PWA (instalar como app).

### Longo prazo

11. Autenticação (Supabase — já usado no Studio).
12. Armazenamento em nuvem (S3/Supabase) em vez de temp local.
13. IA (resumo/tradução de PDF — módulo do Studio).
14. Domínio customizado `pdf.pieng.com.br` (exemplo).

---

## 11. Referência rápida — arquivos para editar

| Quer mudar… | Arquivo |
|-------------|---------|
| Layout / botões | `frontend/src/App.jsx`, `App.css` |
| Chamadas API | `frontend/src/api.js` |
| Render PDF | `frontend/src/pdfViewer.js` |
| Regras PDF servidor | `src/routes/pdf.py` |
| DOCX | `src/converters/pdf_to_docx.py` |
| Porta / CORS | `src/main.py` |
| Build Netlify | `netlify.toml` |
| Logos | `frontend/public/assets/logos/` |
| Deploy | `DEPLOY.md` |

---

## 12. Documentos relacionados no repositório

| Arquivo | Conteúdo |
|---------|----------|
| `README.md` | Visão geral e uso rápido |
| `DEPLOY.md` | GitHub, Netlify, Railway passo a passo |
| `Resumo.md` | Este documento (continuidade) |
| `Guia de Instalação Local - PDF Manipulator.md` | Guia antigo (pré-reestruturação) |
| `PDF Manipulator - Sistema de Manipulação de PDFs.md` | Doc antiga + deploy Manus |
| `obsoleto/README.md` | Pasta de arquivos obsoletos |

---

## 13. Contato / contexto PIENG

Projeto desenvolvido no ecossistema **PIENG** (Flavioprogramador123), alinhado ao **PIENG PDF Studio** desktop para relatórios, auditoria, contabilidade e uso administrativo.

Para retomar o trabalho: leia este `Resumo.md`, confira pendência da **API em produção** e use `DEPLOY.md` para publicar.
