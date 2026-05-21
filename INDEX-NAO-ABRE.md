# Index / tela em branco — diagnóstico

## Sintoma

Site abre em branco ou sem o app React; no F12 → **Rede** aparece `index-XXXX.js` com tipo **html** (404 disfarçado).

## Causa comum (PC local)

`src/static/index.html` apontava para um `.js` antigo após novo `npm run build` (pasta `src/static/` está no `.gitignore`).

O `run.bat` antigo **não rebuildava** se `index.html` já existisse.

## Correção (v36+)

- `run.bat` sempre roda `npm run build` antes do Flask
- Flask devolve **404** para `/assets/*.js` ausente (não devolve `index.html`)
- Vercel usa `rewrites` (arquivos estáticos servidos antes do fallback SPA)

## Conferir no navegador (F12 → Rede)

| URL | Esperado |
|-----|----------|
| `/` | 200, HTML |
| `/assets/index-….js` | 200, **javascript** |
| `/assets/index-….css` | 200, **css** |

Se o `.js` vier como `text/html`, force **Ctrl+F5** ou apague cache do site.

## PC local

```powershell
E:\Projetos\pieng_pdf_WEB\run.bat
```

Abra `http://localhost:5001` — canto deve mostrar **v36**.

## Vercel

Aguarde deploy **Ready** com commit recente. Production deve ter o mesmo hash de `.js` no HTML e na pasta `/assets/`.
