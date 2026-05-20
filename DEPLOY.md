# Publicar no GitHub e Netlify

Guia passo a passo para o projeto **PIENG PDF Web**.

---

## Parte 1 — Criar repositório no GitHub

Na tela **“Criar um novo repositório”**, preencha assim:

| Campo | Valor sugerido |
|--------|----------------|
| **Proprietário** | Sua conta (ex.: `seu-usuario`) |
| **Nome do repositório** | `pieng-pdf-web` |
| **Descrição** | Editor de PDF no navegador — visualizar, editar páginas, merge, split e exportar DOCX. PIENG. |
| **Visibilidade** | **Privado** (recomendado) ou **Público** |
| **Adicionar README** | **Desligado** (o projeto já tem README) |
| **Adicionar .gitignore** | **Desligado** (já existe `.gitignore`) |
| **Adicionar licença** | Opcional (ex.: MIT) |

Clique em **Criar repositório**.

O GitHub mostrará comandos. Use os da **seção 2** abaixo (já com git inicializado no PC).

---

## Parte 2 — Enviar código do seu PC

No PowerShell:

```powershell
cd E:\Projetos\pieng_pdf_WEB

git init
git branch -M main
git add .
git commit -m "feat: PIENG PDF Web — editor PDF no navegador"

git remote add origin https://github.com/SEU-USUARIO/pieng-pdf-web.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu usuário GitHub.

Se pedir login: use **GitHub CLI** (`gh auth login`) ou **Personal Access Token** como senha.

---

## Parte 3 — API (obrigatório para upload/edição)

O Netlify publica só o **site (React)**. Upload, merge, DOCX etc. rodam no **backend Flask**.

Hospede a API em um destes (grátis para teste):

- [Railway](https://railway.app)
- [Render](https://render.com)

### Railway (resumo)

1. **New Project** → **Deploy from GitHub** → escolha `pieng-pdf-web`.
2. **Root Directory**: deixe vazio (raiz do repo).
3. **Start Command**:
   ```bash
   pip install -r requirements.txt && python src/main.py
   ```
4. Variável de ambiente: `PORT` (Railway define automaticamente).
5. Após o deploy, copie a URL pública, ex.: `https://pieng-pdf-web-production.up.railway.app`.

Teste: abra `https://SUA-URL/api/pdf/list` — deve retornar JSON.

---

## Parte 4 — Netlify (site no navegador)

1. Acesse [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
2. **GitHub** → autorize → selecione `pieng-pdf-web`.
3. Configuração de build (pode deixar o Netlify ler o `netlify.toml`):

| Campo | Valor |
|--------|--------|
| **Base directory** | *(vazio)* |
| **Build command** | `cd frontend && npm install && npm run build` |
| **Publish directory** | `src/static` |

4. **Environment variables** (opcional):
   - Só use `VITE_API_URL` se **não** for usar o proxy do `netlify.toml`.
   - Ex.: `VITE_API_URL` = `https://sua-api.railway.app`

5. Antes do deploy, edite `netlify.toml` na raiz do repo e troque a URL da API:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://SUA-URL-RAILWAY.up.railway.app/api/:splat"
  status = 200
  force = true
```

6. **Deploy site**.

URL final: `https://nome-aleatorio.netlify.app` (ou domínio próprio).

---

## Parte 5 — Conferir se tudo funciona

1. Abra o site Netlify.
2. Envie um PDF.
3. Se der erro de rede/CORS:
   - Confirme a URL no `netlify.toml`.
   - No Railway, o Flask já usa `flask-cors` (liberado).

---

## Atualizações futuras

```powershell
cd E:\Projetos\pieng_pdf_WEB
git add .
git commit -m "sua mensagem"
git push
```

Netlify e Railway refazem o deploy automaticamente (se conectados ao GitHub).

---

## Resumo da arquitetura

```
Usuário → Netlify (React + PDF.js)
              ↓ /api/*
         Railway/Render (Flask + pypdf)
```

| O quê | Onde |
|--------|------|
| Interface | Netlify |
| Processar PDF | Railway / Render |
| Código | GitHub |
