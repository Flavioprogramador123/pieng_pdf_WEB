# Leitor oficial (PWA) — PC e celular

**Produção:** v45 — https://pieng-pdf-web.vercel.app

O PIENG PDF Web pode ser **instalado** e, em navegadores compatíveis, abrir **PDF**, **.docx** e **Excel** direto pelo sistema. **`.doc` antigo** não tem preview na web — use `.docx`.

## O que o app pergunta ao usuário

Na primeira visita (após ~2 s), um diálogo pergunta:

> **Leitor oficial de documentos?** — Sim, quero instalar / Agora não / Não perguntar de novo

Também há o botão **Instalar leitor** no topo (some quando o app já está instalado).

## Limitações honestas

| Plataforma | Instalar PWA | Abrir arquivo “Abrir com” | App padrão do sistema |
|------------|--------------|---------------------------|------------------------|
| Chrome/Edge desktop | Sim | Sim (com PWA + `file_handlers`) | Parcial (Windows pode listar após instalar) |
| Android Chrome | Sim | Sim (v40+: MIME `octet-stream`) | Abrir com → PIENG → Sempre; ver [LEITOR-MOBILE-ARQUIVOS.md](./LEITOR-MOBILE-ARQUIVOS.md) |
| iOS Safari | Adicionar à Tela de Início | Limitado | Partilhar ou Enviar dentro do app — não leitor padrão .docx |
| Só aba do navegador | Não | Não | Não |

Um site na Vercel **não substitui** o Adobe por registro nativo do Windows sem instalar o PWA pelo navegador.

## Reverter o pedido de instalação

`frontend/src/features/featureFlags.js` → `defaultAppPrompt: false`

Ou o usuário clica **Não perguntar de novo** (grava em `localStorage`).

## Arquivos técnicos

- `frontend/public/manifest.webmanifest` — PWA + `file_handlers`
- `frontend/public/sw.js` — service worker mínimo
- `frontend/src/DefaultAppPrompt.jsx` — diálogo
- `frontend/src/defaultApp.js` — preferências e dicas por plataforma

## Testar

1. Chrome → site → deve aparecer o diálogo ou **Instalar leitor**
2. Instalar → abrir `.pdf` do Explorer com “Abrir com” → PIENG Leitor (se o SO listar)
3. F12 → Application → Manifest — conferir `file_handlers`
