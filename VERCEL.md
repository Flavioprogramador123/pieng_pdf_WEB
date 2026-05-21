# Deploy no Vercel (site + API)

Tudo em **um único projeto Vercel**: interface React e API Flask (`/api/pdf/...`).

Não é necessário Railway, Netlify nem Render para produção.

---

## 1. Conectar o repositório

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe **`Flavioprogramador123/pieng_pdf_WEB`**
3. O Vercel lê **`vercel.json`** automaticamente

| Campo | Valor |
|--------|--------|
| Framework | Other |
| Build Command | `cd frontend && npm install && npm run build` |
| Output Directory | `src/static` |
| Install Command | `pip install -r requirements.txt` |

4. **Deploy**

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
| Build falha | Veja logs Vercel; confirme `pip install -r requirements.txt` |
