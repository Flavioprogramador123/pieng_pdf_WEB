# Guia de Instalação Local - PDF Manipulator

## 📋 Pré-requisitos

- Python 3.8+ instalado
- Node.js 16+ instalado
- npm ou yarn instalado
- Git (opcional)

## 🚀 Instalação Passo a Passo

### 1. Estrutura de Pastas

Crie a seguinte estrutura de pastas:

```
pdf_manipulator/
├── venv/                   # Ambiente virtual Python
├── src/
│   ├── routes/
│   │   └── pdf.py         # Rotas da API
│   ├── static/            # Arquivos estáticos do frontend
│   ├── main.py            # Aplicação Flask principal
│   ├── App.jsx            # Componente principal React
│   ├── index.html         # HTML principal
│   ├── package.json       # Dependências Node.js
│   ├── vite.config.js     # Configuração Vite
│   ├── tailwind.config.js # Configuração Tailwind
│   ├── postcss.config.js  # Configuração PostCSS
│   ├── index.css          # Estilos CSS
│   ├── components/
│   │   └── ui/            # Componentes UI
│   └── lib/
│       └── utils.js       # Utilitários
└── requirements.txt       # Dependências Python
```

### 2. Configuração do Backend (Python/Flask)

#### 2.1. Criar ambiente virtual
```bash
cd pdf_manipulator
python -m venv venv
```

#### 2.2. Ativar ambiente virtual
**Windows:**
```bash
.\venv\Scripts\activate
```

**Linux/macOS:**
```bash
source venv/bin/activate
```

#### 2.3. Criar requirements.txt
```txt
blinker==1.9.0
click==8.2.1
Flask==3.1.1
flask-cors==6.0.0
Flask-SQLAlchemy==3.1.1
greenlet==3.2.3
itsdangerous==2.2.0
Jinja2==3.1.6
MarkupSafe==3.0.2
pillow==11.3.0
pypdf==5.7.0
SQLAlchemy==2.0.41
typing_extensions==4.14.0
Werkzeug==3.1.3
```

#### 2.4. Instalar dependências Python
```bash
pip install -r requirements.txt
```

### 3. Configuração do Frontend (React/Vite)

#### 3.1. Navegar para pasta src
```bash
cd src
```

#### 3.2. Criar package.json
```json
{
  "name": "pdf-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "framer-motion": "^11.2.12",
    "lucide-react": "^0.399.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.2",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

#### 3.3. Instalar dependências Node.js
```bash
npm install
# ou
yarn install
```

#### 3.4. Criar vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: ".",
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: "static",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html"
      }
    }
  }
})
```

### 4. Construir Frontend

#### 4.1. Construir projeto React
```bash
# Na pasta src
npm run build
# ou
yarn build
```

#### 4.2. Verificar pasta static
Após o build, verifique se os arquivos foram gerados em `src/static/`

### 5. Executar Sistema

#### 5.1. Voltar para pasta raiz
```bash
cd ..  # Voltar para pdf_manipulator/
```

#### 5.2. Ativar ambiente virtual (se não estiver ativo)
```bash
.\venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/macOS
```

#### 5.3. Iniciar servidor Flask
```bash
python src/main.py
```

#### 5.4. Acessar sistema
Abra o navegador e acesse: `http://localhost:5001`

## 🔧 Resolução de Problemas

### Problema: "Could not resolve entry module 'index.html'"
**Solução:** Verifique se o `index.html` está na pasta `src` e se o `vite.config.js` tem a configuração correta.

### Problema: Erro de CORS
**Solução:** Verifique se `flask-cors` está instalado e configurado no `main.py`.

### Problema: Merge não funciona
**Solução:** 
1. Abra o console do navegador (F12)
2. Vá para aba Network
3. Tente fazer merge e verifique se há erros na requisição `/api/pdf/merge`
4. Verifique se os `file_id`s estão sendo enviados corretamente

### Problema: Upload não funciona
**Solução:** Verifique se a pasta `/tmp/pdf_uploads` existe ou se o sistema tem permissão para criá-la.

## 📝 Comandos Úteis

### Recriar ambiente virtual
```bash
rm -rf venv  # Linux/macOS
rmdir /s venv  # Windows
python -m venv venv
```

### Reinstalar dependências frontend
```bash
cd src
rm -rf node_modules package-lock.json  # ou yarn.lock
npm install  # ou yarn install
```

### Ver logs do Flask
```bash
python src/main.py --debug
```

## 🎯 Próximos Passos

1. **Testar todas as funcionalidades**: Upload, merge, split, download
2. **Depurar problemas específicos**: Use console do navegador
3. **Personalizar interface**: Modifique `App.jsx` conforme necessário
4. **Adicionar funcionalidades**: Implemente melhorias sugeridas no README.md

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos os arquivos estão nas pastas corretas
2. Confirme se todas as dependências foram instaladas
3. Use o console do navegador para identificar erros JavaScript
4. Verifique logs do Flask no terminal

**Sistema testado e funcional!** 🚀

