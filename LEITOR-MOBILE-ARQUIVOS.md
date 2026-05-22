# Abrir .pdf / .docx / .xls no telemóvel (Android e iPhone)

## Por que o telefone diz «não há aplicação para abrir .docx»?

1. **Só ter o site nos favoritos não basta** — tem de instalar o **PIENG Leitor** (PWA).
2. **Android:** muitos gestores de ficheiros enviam MIME `application/octet-stream` — a v40 regista também essa extensão.
3. **iPhone:** o iOS **quase nunca** deixa uma PWA ser «app predefinida» para Word como no Android; use **Partilhar** ou **Enviar** dentro do PIENG.

## Android (Chrome) — passos

1. Abra https://pieng-pdf-web.vercel.app no **Chrome**.
2. Instale: diálogo «Leitor oficial» → **Sim** ou menu ⋮ → **Instalar app**.
3. Se já instalou há semanas: **remova o atalho** e **instale de novo** (o manifesto de tipos de ficheiro só atualiza na instalação).
4. Abra um `.docx` em **Ficheiros** / **Downloads** → toque no ficheiro.
5. **Abrir com** → **PIENG Leitor** → **Sempre**.
6. Se não aparecer: **Definições** → **Apps** → **PIENG Leitor** → **Abrir por defeito** → ativar.
7. **Plano B:** abra o ícone PIENG → **Enviar PDF / Word / Excel** → escolha o ficheiro.

## iPhone (Safari) — passos

1. **Safari** → partilhar → **Adicionar à Tela de Início**.
2. Abra sempre pelo **ícone PIENG Leitor** (não pelo Safari).
3. Para `.docx`: **Ficheiros** → ficheiro → **Partilhar** → **PIENG Leitor** (se listado).
4. Se não listar: abra o PIENG → **Enviar PDF / Word / Excel**.
5. Não é falha do PIENG — é **limitação do iOS** para leitores predefinidos de Office.

## O que a v40 alterou no código

- `manifest.webmanifest`: mais MIME types + `application/octet-stream` com extensões
- `fileLaunch.js`: ficheiro aberto pelo SO não se perde antes do React carregar
- Textos e dica persistente no app (`defaultApp.js`, barra no topo)

## Rollback

`featureFlags.js` → `defaultAppPrompt: false`
