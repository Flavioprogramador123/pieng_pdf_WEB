# Deploy no Vercel (site + API)

Tudo em **um único projeto Vercel**: interface React e API Flask (`/api/pdf/...`).

Não é necessário Railway, Netlify nem Render para produção.

---

## 1. Conectar o repositório

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe **`Flavioprogramador123/pieng_pdf_WEB`** · branch **`main`**

### Tela “New Project” (preencha assim)

| Campo | Valor |
|--------|--------|
| **Vercel Team** | Pieng's projects (Hobby) |
| **Project Name** | `pieng-pdf-web` |
| **Application Preset** | **Other** (não use só “Flask”) |
| **Root Directory** | `./` |

Clique em **Deploy** ou expanda **Build and Output Settings** e confira:

| Campo | Valor |
|--------|--------|
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Output Directory** | `src/static` |
| **Install Command** | `cd frontend && npm install` (sem `pip` — Python instala via `api/requirements.txt`) |

O arquivo **`vercel.json`** na raiz aplica isso automaticamente. Se o Vercel sugerir **Flask**, mude para **Other** — senão o site React pode não buildar.

### Variáveis de ambiente

**Não adicione nenhuma.** Deixe a seção **Environment Variables** vazia.

| Variável | Usar? |
|----------|--------|
| `VITE_API_URL` | **Não** — a Vercel não aceita valor vazio e não é necessária (API em `/api/pdf` no mesmo site) |
| `EXAMPLE_NAME` | Apague se existir |

4. Aguarde o **Deploy**

URL exemplo: `https://pieng-pdf-web.vercel.app`

---

## 2. Testar API

Abra no navegador:

```
https://SEU-SITE.vercel.app/api/pdf/health
```

Resposta esperada:

```json
{"ok": true, "service": "pieng-pdf-api"}
```

---

## 3. Usar o app

1. Abra o site Vercel (não precisa de `localhost` nem Netlify).
2. Envie o PDF.
3. **→ DOCX** usa `pdf2docx` na API Vercel (tabelas e logos, quando o PDF permitir).
4. A faixa amarela **“API offline”** deve **sumir** após o deploy correto.

---

## 4. Desenvolvimento local

**Opção A — tudo local (recomendado para testar DOCX com Word):**

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
```

→ http://localhost:5001

**Opção B — Vercel CLI:**

```powershell
npm i -g vercel
cd E:\Projetos\pieng_pdf_WEB
vercel login
vercel dev
```

---

## 5. Atualizar o projeto

```powershell
git add .
git commit -m "sua alteração"
git push
```

O Vercel redeploya automaticamente.

---

## Limitações na Vercel

| Item | Detalhe |
|------|---------|
| **DOCX** | Usa `pdf2docx` (Linux). No PC, `run.bat` pode usar **Microsoft Word** (melhor em formulários). |
| **Tamanho** | Upload até ~50 MB |
| **Tempo** | Conversão grande: até 60 s (plano Hobby) |
| **Memória** | Máx. 2048 MB no Hobby (já configurado no `vercel.json`) |
| **Arquivos** | Guardados em `/tmp` (podem sumir entre requisições) |

---

## Netlify / Railway

- **Netlify** e **Railway** não são mais necessários para este projeto.
- Arquivos antigos: `netlify.toml`, `railway.toml` → pasta `obsoleto/` (referência).

---

## Problemas

| Sintoma | Solução |
|---------|---------|
| API offline no site | Aguarde o deploy; teste `/api/pdf/health` |
| DOCX só texto | API não respondeu — use **→ DOCX** com health OK |
| Erro 500 no DOCX | PDF muito grande; tente de novo ou use `run.bat` no PC |
| Build falha `pip install` | Apague Install Command no painel Vercel — ver **[VERCEL-CORRIGIR-BUILD.md](./VERCEL-CORRIGIR-BUILD.md)** |
