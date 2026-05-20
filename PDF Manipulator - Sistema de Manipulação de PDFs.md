# PDF Manipulator - Sistema de Manipulação de PDFs

## 🚀 Sistema Deployado

**URL do Sistema:** https://p9hwiqcl8yq1.manus.space

## 📋 Funcionalidades Implementadas

### ✅ Funcionalidades Principais
- **Upload de PDFs**: Arrastar e soltar ou selecionar arquivos
- **Merge de PDFs**: Unir múltiplos arquivos PDF em um só
- **Split de PDFs**: Dividir PDF em páginas individuais
- **Extração de Páginas**: Extrair páginas específicas de um PDF
- **Download**: Baixar PDFs processados
- **Extração de Texto**: Extrair texto de páginas específicas
- **Interface Moderna**: Design responsivo com drag & drop

### 🎨 Interface
- **Sidebar**: Upload e controles principais
- **Área Principal**: Visualização e manipulação de arquivos
- **Tabs**: Organização por funcionalidades (Arquivos, Operações, Extrair Texto)
- **Design Moderno**: Interface profissional com animações suaves

## 🛠️ Tecnologias Utilizadas

### Backend (Flask)
- **Flask**: Framework web Python
- **pypdf**: Biblioteca para manipulação de PDFs
- **Flask-CORS**: Suporte a requisições cross-origin
- **Werkzeug**: Upload seguro de arquivos

### Frontend (React)
- **React**: Interface de usuário moderna
- **Tailwind CSS**: Estilização responsiva
- **shadcn/ui**: Componentes UI profissionais
- **Lucide Icons**: Ícones modernos
- **Framer Motion**: Animações suaves

## 📖 Como Usar

### 1. Upload de Arquivos
- Acesse o sistema no link deployado
- Arraste arquivos PDF para a área de upload ou clique em "Selecionar Arquivos"
- Os arquivos aparecerão na aba "Arquivos"

### 2. Fazer Merge de PDFs
- Selecione 2 ou mais arquivos clicando neles (ficarão destacados em azul)
- Clique no botão "Fazer Merge" no sidebar ou na aba "Operações"
- O arquivo unificado aparecerá na lista

### 3. Dividir PDF
- Selecione 1 arquivo
- Vá para a aba "Operações" e clique em "Dividir PDF"
- Cada página será salva como arquivo separado

### 4. Extrair Páginas Específicas
- Use a API endpoint `/api/pdf/extract` com POST
- Envie `file_id` e array de `pages` (números das páginas)

### 5. Extrair Texto
- Use a API endpoint `/api/pdf/extract-text` com POST
- Envie `file_id` e opcionalmente array de `pages`

### 6. Download
- Clique no ícone de download em qualquer arquivo
- O arquivo será baixado automaticamente

## 🔧 API Endpoints

### Upload
```
POST /api/pdf/upload
Content-Type: multipart/form-data
Body: file (PDF)
```

### Merge
```
POST /api/pdf/merge
Content-Type: application/json
Body: {"file_ids": ["id1", "id2", ...]}
```

### Split
```
POST /api/pdf/split
Content-Type: application/json
Body: {"file_id": "id"}
```

### Extract Pages
```
POST /api/pdf/extract
Content-Type: application/json
Body: {"file_id": "id", "pages": [1, 3, 5]}
```

### Extract Text
```
POST /api/pdf/extract-text
Content-Type: application/json
Body: {"file_id": "id", "pages": [1, 2]}
```

### Download
```
GET /api/pdf/download/{file_id}
```

### List Files
```
GET /api/pdf/list
```

## 📁 Estrutura do Projeto

```
pdf-manipulator/
├── src/
│   ├── routes/
│   │   └── pdf.py          # Rotas da API
│   ├── static/             # Frontend React buildado
│   └── main.py             # Aplicação Flask principal
├── requirements.txt        # Dependências Python
└── README.md              # Esta documentação
```

## 🚀 Melhorias Futuras Sugeridas

### Funcionalidades Avançadas
- **Visualização de Thumbnails**: Reativar com biblioteca alternativa
- **Edição de Metadados**: Título, autor, palavras-chave
- **Proteção por Senha**: Adicionar/remover senhas de PDFs
- **Compressão**: Reduzir tamanho dos arquivos
- **OCR**: Reconhecimento de texto em PDFs escaneados
- **Rotação de Páginas**: Girar páginas individuais
- **Marcas d'água**: Adicionar texto ou imagem como marca d'água

### Interface
- **Preview de Páginas**: Visualização antes de operações
- **Drag & Drop entre Arquivos**: Reorganizar páginas visualmente
- **Histórico de Operações**: Log das ações realizadas
- **Batch Operations**: Operações em lote
- **Temas**: Modo escuro/claro

### Performance
- **Cache**: Sistema de cache para arquivos processados
- **Processamento Assíncrono**: Para arquivos grandes
- **Compressão de Upload**: Reduzir tempo de upload

## 💡 Notas Técnicas

- **Limite de Upload**: 50MB por arquivo
- **Formatos Suportados**: Apenas PDF
- **Armazenamento**: Temporário em `/tmp/pdf_uploads`
- **Segurança**: Nomes de arquivo seguros com UUID
- **CORS**: Habilitado para todas as origens

## 🎯 Sistema Pronto para Uso

O sistema está **100% funcional** e deployado. Você pode:
1. Acessar imediatamente em: https://p9hwiqcl8yq1.manus.space
2. Fazer upload de PDFs
3. Unir dois ou mais PDFs
4. Dividir PDFs em páginas
5. Extrair texto
6. Baixar resultados

**Perfeito para suas necessidades atuais de unir dois PDFs em arquivos distintos!**

