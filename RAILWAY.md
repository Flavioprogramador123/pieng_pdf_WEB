# Ligar a API (sumir com “API offline”)

O site **https://pieng-pdf-web.netlify.app** só mostra a interface. O upload na nuvem e o **DOCX** precisam da API Flask no **Railway** ou **Render**.

---

## Opção A — Railway (recomendado)

### 1. Criar projeto

1. Acesse [railway.app](https://railway.app) e entre com GitHub.
2. **New Project** → **Deploy from GitHub repo**.
3. Escolha **`Flavioprogramador123/pieng_pdf_WEB`**.
4. Railway detecta `railway.toml` automaticamente.

### 2. Ajustar serviço (se o deploy falhar)

Em **Settings** do serviço:

| Campo | Valor |
|--------|--------|
| **Root Directory** | *(vazio — raiz do repo)* |
| **Start Command** | `gunicorn main:app --chdir src --bind 0.0.0.0:$PORT --workers 1 --timeout 120` |

### 3. URL pública

1. Aba **Settings** → **Networking** → **Generate Domain**.
2. Copie a URL, exemplo:  
   `https://pieng-pdf-web-production.up.railway.app`

### 4. Testar API

No navegador:

```
https://SUA-URL.up.railway.app/api/pdf/health
```

Deve aparecer: `{"ok":true,"service":"pieng-pdf-api"}`

### 5. Conectar ao site (Netlify **ou** Vercel)

**Netlify** — edite **`netlify.toml`** (redirect):

**Vercel** — edite **`vercel.json`** (rewrite) — guia: **[VERCEL.md](./VERCEL.md)**

Exemplo Netlify — edite **`netlify.toml`** na raiz do repo (linha do redirect):

```toml
[[redirects]]
  from = "/api/*"
  to = "https://SUA-URL.up.railway.app/api/:splat"
  status = 200
  force = true
```

Salve, commit e push:

```powershell
cd E:\Projetos\pieng_pdf_WEB
git add netlify.toml
git commit -m "config: proxy Netlify para API Railway"
git push
```

Aguarde o redeploy do Netlify (1–2 min). A faixa **“API offline”** deve sumir e o upload usar a nuvem.

---

## Opção B — Render

1. [render.com](https://render.com) → **New** → **Web Service** → repo `pieng_pdf_WEB`.
2. O arquivo **`render.yaml`** já define o build.
3. Gere URL pública e use no `netlify.toml` como na etapa 5 acima.

---

## Só no seu PC (sem Railway)

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
```

Abra **http://localhost:5001** (Flask + site juntos).  
Não use o link Netlify se quiser API local — ou aceite o **modo local** no Netlify (já funciona para editar PDF).

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Netlify mostra “API offline” | Railway não deployado ou URL errada no `netlify.toml` |
| Railway “train not arrived” | Serviço parado — abra o projeto e faça **Deploy** |
| DOCX falha na nuvem | Instale dependências no Railway ou use modo local + API no PC |
| Upload ok no PC, falha no celular Netlify | Falta passo 5 (proxy `/api` → Railway) |

---

## Resumo

```
Netlify (site)  +  redirect /api  →  Railway (Flask)
```

Sem Railway: modo local continua válido (mensagem amarela é esperada).
