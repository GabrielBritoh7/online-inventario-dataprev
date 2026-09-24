# 📦 Inventário TI — Sistema de Cadastro e Controle Patrimonial

Aplicação web progressiva (**PWA**) desenvolvida para agilizar o processo de triagem, controle e inventário físico de computadores e equipamentos de TI em bancada ou campo, operando de forma independente, sem necessidade de servidor ou banco de dados externo.

---

## 📑 Sumário

1. [Visão Geral](#-visão-geral)
2. [Principais Funcionalidades](#-principais-funcionalidades)
3. [Regras de Negócio e Automações](#-regras-de-negócio-e-automações)
4. [Estrutura de Arquivos](#-estrutura-de-arquivos)
5. [Tecnologias Utilizadas](#-tecnologias-utilizadas)
6. [Como Executar e Hospedar](#-como-executar-e-hospedar)
   - [Hospedagem Gratuita com HTTPS (GitHub Pages)](#1-hospedagem-gratuita-com-https-github-pages)
   - [Execução Local no Computador](#2-execução-local-no-computador)
7. [Como Usar no Celular (Passo a Passo)](#-como-usar-no-celular-passo-a-passo)
8. [Exportação e Manipulação de Dados](#-exportação-e-manipulação-de-dados)
9. [Segurança e Privacidade](#-segurança-e-privacidade)
10. [Guia de Customização](#-guia-de-customização)

---

## 🎯 Visão Geral

O **Inventário TI** foi projetado para resolver a lentidão e os erros comuns no levantamento manual de parques de equipamentos (como estações de trabalho e desktops Daten, Dell, Lenovo, etc.). 

A ferramenta funciona diretamente no navegador do smartphone ou computador, permitindo leitura por câmera de códigos de barras, validação de duplicidades em tempo real, armazenamento seguro na memória do navegador e exportação para planilhas compatíveis com Excel e Google Sheets.

---

## ✨ Principais Funcionalidades

- 📷 **Leitura de Código de Barras pela Câmera:** Utiliza a API nativa `BarcodeDetector` para leitura rápida de etiquetas de patrimônio e número de série, com opção alternativa de digitação manual.
- 🔢 **Tratamento Automático de Patrimônio:** Normalização inteligente que extrai apenas os 6 dígitos úteis do patrimônio quando o leitor retorna etiquetas de 8 dígitos (descartando o prefixo padrão `39`).
- 🚫 **Bloqueio de Duplicidades:** Alerta imediato e impedimento de cadastro caso um patrimônio ou número de série já tenha sido registrado anteriormente.
- 📊 **Painel com Indicadores:** Contadores automáticos no topo da tela exibindo:
  - Total registrado no aparelho
  - Quantidade em estado funcional (OK)
  - Quantidade com defeito
- 🔍 **Busca Instantânea:** Filtro em tempo real por patrimônio, número de série, marca ou modelo.
- ✏️ **Edição e Exclusão:** Gerenciamento completo de registros existentes direto da lista de equipamentos.
- 📥 **Exportação para Planilha (.CSV):** Geração de arquivo CSV formatado com codificação UTF-8 com BOM e delimitador `;`, abrindo perfeitamente no Microsoft Excel e Google Planilhas.
- 📱 **Instalação como Aplicativo (PWA):** Pode ser instalado na tela inicial do celular ou do desktop e funciona **mesmo sem conexão com a internet** (offline).

---

## ⚙️ Regras de Negócio e Automações

### 1. Regra do Número de Patrimônio
Muitas etiquetas de código de barras patrimoniais de órgãos públicos e empresas utilizam 8 dígitos (iniciados com prefixo fixo, como `39`). A aplicação aplica a seguinte tratativa:
- **Ao ler/inserir 8 dígitos (ex.: `39289751`):** O sistema remove os dois primeiros dígitos e armazena apenas os **6 últimos dígitos** (`289751`).
- **Ao ler/inserir 6 dígitos (ex.: `289751`):** O sistema mantém o valor original sem alterações.
- Essa regra é acionada na leitura por câmera, na perda de foco do campo (`change`), em leitores de código de barras USB e na submissão do formulário.

### 2. Validação de Unicidade
- Não é permitido salvar dois equipamentos com o mesmo **Patrimônio** ou o mesmo **Número de Série**.
- Ao editar um item existente, o sistema reconhece o próprio ID e não o acusa como duplicata de si mesmo.

### 3. Componentes Monitorados
- **SSD**
- **HD**
- **Memória RAM**

*(A opção de Fonte foi descontinuada do formulário conforme alinhamento operacional).*

---

## 📂 Estrutura de Arquivos

```text
DATENBOMBA-inventario-ti/
├── index.html            # Estrutura visual, formulários, modais e telas
├── app.js                # Lógica da aplicação, scanner, filtros, validações e persistência
├── styles.css            # Folha de estilos moderna, tema escuro na barra e layout responsivo
├── sw.js                 # Service Worker responsável pelo cache e funcionamento offline
├── manifest.webmanifest  # Configuração para instalação como PWA (nome, ícone, tema)
├── icon.svg              # Ícone vetorial da aplicação
└── README.md             # Esta documentação completa do projeto
```

---

## 💻 Tecnologias Utilizadas

- **HTML5 Semântico:** Estrutura acessível com suporte a diálogos modais e tags de formulário nativas.
- **CSS3 Moderno:** Flexbox, CSS Grid, variáveis customizadas (*design tokens*) e media queries para celulares e telas maiores.
- **JavaScript Vanilla (ES6+):** Código leve, sem frameworks pesados, garantindo carregamento instantâneo.
- **Web APIs:**
  - `localStorage`: Persistência local no navegador do cliente.
  - `BarcodeDetector API` & `getUserMedia`: Acesso à câmera do dispositivo e decodificação de códigos de barras (Code 128, Code 39, EAN, QR Code, etc.).
  - `Service Worker API` & `Cache API`: Cache de ativos estáticos para suporte offline.

---

## 🚀 Como Executar e Hospedar

### 1. Hospedagem Gratuita com HTTPS (GitHub Pages)
> **Recomendado:** Os navegadores de celular exigem conexão segura (`HTTPS`) para permitir o uso da câmera no scanner.

1. Crie uma conta ou entre no [GitHub](https://github.com).
2. Crie um novo repositório público (ex.: `inventario-ti`).
3. Faça o upload dos arquivos da pasta do projeto.
4. No repositório, acesse **Settings** > **Pages**.
5. Em **Source**, selecione a branch `main` e a pasta `/ (root)`, depois clique em **Save**.
6. Em instantes, o link público seguro estará disponível (ex.: `https://seu-usuario.github.io/inventario-ti/`).

### 2. Execução Local no Computador
Caso queira testar apenas no computador de trabalho via navegador:
- Basta dar duplo clique no arquivo `index.html`.
- Para simular um servidor local no Windows (com Python instalado):
  ```powershell
  cd "C:\Users\gabriel.bmendes\OneDrive - Dataprev\Área de Trabalho\DATENBOMBA-inventario-ti"
  py -m http.server 8000
  ```
  Acesse no navegador: `http://localhost:8000`.

---

## 📱 Como Usar no Celular (Passo a Passo)

1. **Acesso:** Abra o link HTTPS gerado (pelo GitHub Pages) no Google Chrome ou Safari do celular.
2. **Instalação:** 
   - No Chrome: toque nos três pontinhos superiores e selecione **Adicionar à tela inicial** ou toque no botão **Instalar** no topo da página.
   - O aplicativo criará um ícone igual a um app nativo no celular.
3. **Cadastro:**
   - Preencha o Patrimônio ou toque em **Escanear** para acionar a câmera e ler a etiqueta.
   - Preencha o Número de Série (ou escaneie).
   - Selecione a Marca (**Daten**, Dell, Lenovo, HP, etc.) e digite o Modelo.
   - Indique o **Estado** (Funcionando / Com defeito) e a **Situação** (Não formatado / Em formatação / Formatado).
   - Marque os componentes encontrados e adicione laudos/observações se necessário.
   - Toque em **Salvar computador**.
4. **Listagem e Busca:**
   - Alterne para a aba **Equipamentos** para consultar o que já foi registrado ou buscar por qualquer termo.

---

## 📊 Exportação e Manipulação de Dados

1. Acesse a aba **Equipamentos**.
2. Clique no botão **Exportar planilha**.
3. O navegador fará o download imediato de um arquivo nomeado no padrão:
   `estoque_computadores_AAAA-MM-DD.csv`
4. **Campos do CSV:**
   `ID; Patrimônio; Número de série; Marca; Modelo; Estado; Situação; Componentes; Observações / laudo; Última atualização`
5. **Compatibilidade:** O arquivo já inclui o caractere de controle `\uFEFF` (BOM UTF-8), garantindo que acentos e caracteres especiais abram corretamente no Excel sem desconfigurar o texto.

---

## ☁️ Conexão com Banco em Nuvem (Supabase)

O sistema possui integração nativa opcional com o **Supabase** (PostgreSQL gratuito em nuvem com sincronização em tempo real).

Quando configurado, qualquer equipamento cadastrado no celular ou computador é sincronizado instantaneamente com todos os outros aparelhos conectados. Se não for configurado ou se o aparelho ficar sem internet, ele continua salvando e funcionando no `localStorage`.

### Como ativar:
1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu lateral do projeto, abra o **SQL Editor** e execute:
   ```sql
   create table if not exists inventario (
     id text primary key,
     asset_tag text not null,
     serial_number text not null,
     brand text not null,
     model text not null,
     state text not null,
     status text not null,
     components text[] default '{}',
     notes text default '',
     updated_at timestamp with time zone default now()
   );

   alter table inventario enable row level security;
   create policy "Permitir leitura publica" on inventario for select using (true);
   create policy "Permitir insercao publica" on inventario for insert with check (true);
   create policy "Permitir atualizacao publica" on inventario for update using (true);
   create policy "Permitir exclusao publica" on inventario for delete using (true);

   alter publication supabase_realtime add table inventario;
   ```
3. Acesse **Project Settings** > **API** e copie a **Project URL** e a **anon public key**.
4. No arquivo `app.js`, preencha as constantes no topo:
   ```javascript
   const SUPABASE_URL = 'SUA_PROJECT_URL_AQUI';
   const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';
   ```
5. Faça o commit e upload para o GitHub. A partir desse momento, a barra superior exibirá `● NUVEM CONECTADA` e todos os aparelhos passarão a ter a mesma relação de dados!

---

## 🔒 Segurança e Privacidade

- **Operação Híbrida (Offline / Nuvem):** Se o Supabase estiver configurado, os dados são sincronizados com seu projeto em nuvem privado. Caso contrário, permanecem 100% locais no dispositivo (`localStorage`).
- **Backup:** A exportação para planilha CSV continua disponível a qualquer momento para backups físicos locais.

---

## 🛠️ Guia de Customização

- **Adicionar novas marcas:** Abra o arquivo `index.html` e adicione novas opções na tag `<select id="brand">`.
- **Adicionar componentes:** Abra o arquivo `index.html` e insira um novo `<label><input type="checkbox" name="components" value="NomeDoComponente"> NomeDoComponente</label>`. O script `app.js` detecta e exporta dinamicamente todos os componentes marcados.
- **Limpar dados do aparelho:** No navegador, basta limpar os dados de navegação/armazenamento do site ou executar no console: `localStorage.removeItem('inventario-ti-registros-v1')`.
- **Atualização de versão de cache:** Sempre que fizer alterações em arquivos estáticos, altere o identificador `const CACHE = 'inventario-ti-vX';` no arquivo `sw.js` para forçar os navegadores a baixarem a nova versão.
