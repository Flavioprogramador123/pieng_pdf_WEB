# Usar Vercel (alternativa ao Netlify)

Você **não precisa abandonar** o Netlify. Vercel e Netlify fazem a **mesma função** neste projeto: hospedar o **site (React)**.

A **API Python (Flask)** continua no **Railway** ou **Render** — o Vercel não substitui o Railway para processar PDF.

```
┌─────────────┐     /api/*      ┌──────────────┐
│  Netlify    │ ──────────────► │   Railway    │
│  ou Vercel  │    (proxy)      │   (Flask)    │
│  (só site)  │                 │              │
└─────────────┘                 └──────────────┘
```

---

## Quando usar Vercel

| Situação | Sugestão |
|----------|----------|
| Netlify com problema de build/deploy | Tente **Vercel** com o mesmo repo |
| Já tem conta/plano Vercel | Pode usar Vercel para o front |
| Quer tudo em um painel só | Front no Vercel + API no Railway (dois serviços) |

**Não é:** “Netlify falhou → mudar API para Vercel”. A API em Python pesada fica melhor no Railway/Render.

---

## Deploy do site no Vercel (passo a passo)

### 1. Importar projeto

1. [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe **`Flavioprogramador123/pieng_pdf_WEB`** (GitHub)
3. O Vercel lê o arquivo **`vercel.json`** na raiz

### 2. Configuração (confira na tela)

| Campo | Valor |
|--------|--------|
| **Framework Preset** | Other |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Output Directory** | `src/static` |
| **Install Command** | *(pode deixar vazio ou `cd frontend && npm install`)* |

### 3. Variáveis de ambiente (opcional)

Só se **não** usar o proxy no `vercel.json`:

| Nome | Valor |
|------|--------|
| `VITE_API_URL` | `https://sua-api.up.railway.app` |

Com o proxy em `vercel.json`, **não precisa** dessa variável.

### 4. Deploy

Clique **Deploy**. URL exemplo: `https://pieng-pdf-web.vercel.app`

### 5. Ligar a API (igual ao Netlify)

1. Suba a API no **Railway** — veja **[RAILWAY.md](./RAILWAY.md)**
2. Edite **`vercel.json`** na raiz:

```json
{
  "source": "/api/(.*)",
  "destination": "https://SUA-URL.up.railway.app/api/$1"
}
```

3. Commit + push → Vercel redeploya

Teste: `https://seu-site.vercel.app/api/pdf/health` → `{"ok":true,...}`

---

## Netlify vs Vercel (só frontend)

| | Netlify | Vercel |
|---|---------|--------|
| Arquivo de config | `netlify.toml` | `vercel.json` |
| Pasta publicada | `src/static` | `src/static` |
| Proxy `/api` | `[[redirects]]` | `rewrites` |
| Modo local sem API | ✅ | ✅ |
| API Flask no mesmo host | ❌ | ❌ (use Railway) |

Pode manter **os dois** apontando para a **mesma API Railway** (dois frontends, uma API).

---

## API direto no Vercel?

Possível em teoria (Serverless Functions Python), mas para este projeto **não recomendamos**:

- limite de tamanho/tempo em funções serverless
- upload grande de PDF
- `pdf2docx` e dependências pesadas
- disco temporário limitado

Se Railway não der certo, use **Render** ([`render.yaml`](./render.yaml)) antes de tentar API no Vercel.

---

## Ordem sugerida se algo falhar

1. **Netlify** (já em uso) + **Railway** (API)  
2. Se Netlify incomodar → **Vercel** (site) + **mesma API Railway**  
3. Se Railway incomodar → **Render** (API) + Netlify ou Vercel  
4. **PC local:** `run.bat` → http://localhost:5001  

---

## Comandos úteis (CLI Vercel)

```powershell
npm i -g vercel
cd E:\Projetos\pieng_pdf_WEB
vercel login
vercel --prod
```

O `vercel.json` na raiz já define build e rewrites.
