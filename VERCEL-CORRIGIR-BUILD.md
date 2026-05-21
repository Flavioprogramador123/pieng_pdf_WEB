# Corrigir erro: pip install -r requirements.txt

A Vercel ainda está com o **Install Command antigo** salvo no painel (não no Git).

## Passo a passo (obrigatório)

1. Abra [vercel.com](https://vercel.com) → projeto **pieng-pdf-web**
2. **Settings** → **Build and Deployment**
3. Em **Build & Development Settings**:

| Campo | Coloque exatamente |
|--------|---------------------|
| **Install Command** | *(apague tudo — deixe VAZIO)* ou `cd frontend && npm install` |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Output Directory** | `src/static` |

4. **Apague** qualquer texto `pip install -r requirements.txt`
5. **Save**
6. Aba **Deployments** → ⋯ no último → **Redeploy**

## Por que o erro acontece

O log mostra:

```
Running "install" command: `pip install -r requirements.txt`
```

Isso vem da **configuração salva no site Vercel**, não do código atual do GitHub (já corrigido).

Python da API instala sozinho via `api/requirements.txt` na função serverless.

## Depois do build OK

Teste: `https://pieng-pdf-web.vercel.app/api/pdf/health`
