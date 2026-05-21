# Corrigir erro: pip install -r requirements.txt

## Erro no log

```
Running "install" command: `pip install -r requirements.txt`...
error: externally-managed-environment
```

## Causas (duas)

1. **Painel Vercel** ainda tem Install Command antigo (`pip install...`).
2. **Redeploy de commit antigo** — se o log mostra `Commit: 263cce7`, não é o `main` atual. Use **Redeploy** no último deploy de `main` ou faça **push** de novo.

O `vercel.json` no Git já define:

| Campo | Valor |
|--------|--------|
| **installCommand** | `cd frontend && npm install` |
| **buildCommand** | `cd frontend && npm run build` |

Python da API instala só na função serverless via **`api/requirements.txt`** (não há `requirements.txt` na raiz).

---

## Passo a passo no painel (obrigatório uma vez)

1. [vercel.com](https://vercel.com) → projeto **pieng-pdf-web**
2. **Settings** → **Build and Deployment**
3. **Build & Development Settings**:

| Campo | Valor |
|--------|--------|
| **Install Command** | **Override** → `cd frontend && npm install` **ou apague tudo** |
| **Build Command** | `cd frontend && npm run build` (ou deixe vazio para usar `vercel.json`) |
| **Output Directory** | `src/static` |

4. **Apague** `pip install -r requirements.txt`
5. **Save**
6. **Deployments** → último deploy da branch **main** (commit recente, ex. `a0f1f20` ou mais novo) → **Redeploy**

Não use “Redeploy” em um deploy antigo (263cce7) — isso repete o erro.

---

## Depois do build **Ready**

```
https://pieng-pdf-web.vercel.app/api/pdf/health
```

Esperado: `{"ok":true,"service":"pieng-pdf-api"}`
