# Como ajudar pelo F12 (qual versão / commit está no ar)

O **v10** no canto **não é o número do commit no GitHub**. Na Vercel antiga, o build contava só ~10 commits (clone raso) e fixava **v10** em vários deploys diferentes.

Para saber **qual commit** está rodando em `pieng-pdf-web.vercel.app`, use o painel Vercel **ou** o F12 abaixo.

---

## A) Vercel (mais certo — 1 minuto)

1. [vercel.com](https://vercel.com) → projeto **pieng-pdf-web**
2. Aba **Deployments**
3. Linha com selo **Production** → copie:
   - **Commit** (ex.: `db964d0`)
   - **Mensagem** do commit
   - Data/hora

Envie essa captura ou cole o hash aqui no chat.

---

## B) F12 no Chrome / Edge (para o programador)

### 1. Abrir ferramentas

1. Abra `https://pieng-pdf-web.vercel.app`
2. **F12** (ou botão direito → Inspecionar)
3. Ícone **📱** (Toggle device toolbar) se estiver testando no celular emulado — ok manter 400px

### 2. Versão na tela

- Canto superior direito: anote **`v10`**, **`v25`**, **`v26`**, etc.
- Tire print da barra superior (logo + botões + `vNN`).

### 3. Aba **Rede** (Network)

1. Clique em **Rede** / **Network**
2. Marque **Preservar log** / **Preserve log**
3. Clique no ícone **🚫** para limpar a lista
4. **Recarregue a página** (Ctrl+R ou botão Reload page da própria aba Rede)
5. No filtro, digite: `health`  
   - Deve aparecer `health` → clique na linha  
   - Anote **Status** (ex. 200) e aba **Resposta** (ex. `{"ok":true,...}`)

6. Limpe de novo (🚫)
7. Abra um PDF, clique **→ DOCX**
8. No filtro, digite: `docx` ou `convert`
9. Clique na requisição (ex. `convert-docx` ou `health`)
10. Anote e envie print ou texto de:
    - **URL completa**
    - **Status** (200, 404, 500…)
    - **Tipo** (xhr / fetch)
    - Aba **Resposta** (primeiras linhas — JSON de erro ou arquivo)

### 4. Aba **Console**

1. Clique em **Console**
2. Se houver linhas **vermelhas**, expanda e copie a mensagem
3. Print se houver erro ao clicar **→ DOCX**

### 5. Aba **Fontes** (Sources) — achar o JS do build

1. **Ctrl+P** (Quick open)
2. Digite: `index-`
3. Abra o arquivo `index-xxxxx.js` (hash muda a cada deploy)
4. **Ctrl+F** → busque `BUILD_SEQ` ou `v10`
   - Se achar `BUILD_SEQ = 26` → deploy novo
   - Se não achar número fixo → build antigo (contagem Git)

### 6. O que enviar no chat

Cole ou print:

| Item | Exemplo |
|------|---------|
| Versão no canto | v10 |
| Production commit (Vercel) | db964d0 |
| GET `/api/pdf/health` | 200 + JSON |
| POST `convert-docx` (ao clicar DOCX) | 200 ou 500 + mensagem |
| Erros no Console | texto ou “nenhum” |
| Mensagem verde abaixo das abas | “DOCX completo…” ou outra |

---

## Mapa aproximado (v10 na tela ≠ commit exato)

| O que você vê | Significado provável |
|---------------|----------------------|
| **v10** + ícone **×** ao lado do download | Deploy com badge (`db964d0` ou posterior), build Vercel com contagem Git ≈ 10 |
| **v25 / v26** | Deploy com `buildVersion.js` explícito (`fc2163c` / `7e66a34`) |
| “DOCX completo — tabelas, logos…” | API respondeu e conversão servidor OK |
| DOCX baixa mas mensagem “texto / API indisponível” | Fallback navegador (`7e66a34`+) |

**Commit de referência do DOCX “completo” que costuma funcionar na API:** entre `db964d0` e `6b303b6`, com API health **200**.  
**Correção DOCX com fallback (como v10 no navegador):** `7e66a34` → **v26**.

---

## Produção deve apontar para o commit certo

Se Production na Vercel ainda está em deploy antigo com **v10**:

1. **Deployments** → último **main** com **v26** e build **Ready**
2. ⋯ → **Promote to Production** (se não for automático)

Depois: Ctrl+F5 no site e confira **v26** no canto.
