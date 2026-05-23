# Álbum Copa 2026 ⚽

App de controle de figurinhas da Copa do Mundo 2026 (Panini Brasil + Coca-Cola).

- 994 figurinhas: 980 oficiais + 14 Coca-Cola
- Marcação por tela ou por scanner (OCR do nome do jogador)
- Lista de trocas (repetidas / faltantes)
- Estatísticas detalhadas por seleção
- Backup local + import/export JSON
- PWA — instala como app no celular

---

## Como subir no GitHub e publicar no Vercel

⚠️ **Importante**: o erro mais comum é subir a pasta `album-copa-26/` inteira para o repositório. **Suba o CONTEÚDO** dela: `package.json`, `index.html`, `src/`, `public/` precisam aparecer na **raiz** do repositório, não dentro de uma subpasta.

### Parte 1 — Criar conta no GitHub (se ainda não tem)

1. Acesse [github.com/signup](https://github.com/signup)
2. Use email, escolha senha e usuário (algo simples: `seunome-mauricio`)
3. Confirme o email

### Parte 2 — Criar repositório novo

1. Acesse [github.com/new](https://github.com/new)
2. **Repository name**: `album-copa-26`
3. **Public** (recomendado — Vercel gratuito funciona com público)
4. **Não marque** README, .gitignore nem license (já temos)
5. Clique em **"Create repository"**

### Parte 3 — Subir os arquivos

No computador, descompacte o `album-copa-26.zip`. Vai aparecer uma pasta `album-copa-26/`. **Entre dentro dela.** Você deve ver:

```
album-copa-26/
  package.json
  index.html
  vite.config.js
  .gitignore
  README.md
  backup-suas-marcacoes.json
  public/
  src/
```

Agora na página do repositório recém-criado no GitHub, clique em **"uploading an existing file"** (link azul no meio da tela).

**Selecione TUDO que está dentro da pasta** `album-copa-26/`:
- No Windows: abra a pasta, Ctrl+A, arraste para o navegador
- No Mac: abra a pasta, Cmd+A, arraste para o navegador
- No celular: tem que ser pelo computador mesmo, pelo celular fica complicado

⚠️ **Confira antes de commitar**: na lista que aparece abaixo da área de upload, você deve ver `package.json`, `index.html`, e as pastas `public/` e `src/` listadas separadamente. **Se aparecer só `album-copa-26/` como uma única pasta, você arrastou errado** — apague e refaça arrastando o conteúdo, não a pasta.

Mensagem do commit: `primeira versao`. Clique em **"Commit changes"**.

### Parte 4 — Deploy no Vercel

1. Acesse [vercel.com/signup](https://vercel.com/signup)
2. Clique em **"Continue with GitHub"** — vai conectar sua conta
3. Após login, clique em **"Add New… → Project"**
4. Encontre `album-copa-26` na lista e clique **"Import"**
5. **Não mexa em nada nas configurações** — o Vercel detecta Vite + React automaticamente
6. Clique em **"Deploy"**

Aguarde ~1-2 minutos. O Vercel vai te dar uma URL como `album-copa-26-xyz.vercel.app`.

### Parte 5 — Instalar no iPhone como app

1. Abra a URL do Vercel no **Safari** (não no Chrome — Safari é obrigatório no iPhone)
2. Toque no botão de **compartilhar** (quadrado com seta pra cima na barra de baixo)
3. Role para baixo e toque em **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**

Agora aparece um ícone verde "Álbum 26" na sua tela inicial. Abre em tela cheia, sem barra do navegador, e a câmera funciona.

### Parte 6 — Importar suas marcações (448 coladas + 82 repetidas + 9 Coca)

1. Abra o app (no celular ou desktop)
2. Vá em **Ajustes** (última aba)
3. Toque em **"Importar backup"**
4. Escolha o arquivo `backup-suas-marcacoes.json` (vem junto no zip)
5. Confirme

Suas 448 coladas + 82 repetidas + 9 Coca-Cola voltam todas. Pronto!

---

## Estrutura técnica

```
src/
├── main.jsx              entrada React
├── App.jsx               raiz com navegação
├── Icon.jsx              ícones SVG
├── index.css             tema e componentes utilitários
├── album-data.json       base de 994 figurinhas
├── storage.js            localStorage + import/export
├── flags.js              bandeira por país/código
├── scanner.js            OCR + matching tolerante
└── views/
    ├── HomeView.jsx      lista de seções
    ├── SectionView.jsx   grid de uma seção
    ├── StatsView.jsx     estatísticas
    ├── TradesView.jsx    repetidas e faltantes
    ├── ScannerView.jsx   câmera + OCR
    └── SettingsView.jsx  backup, reset
```

---

## Sobre o scanner

A figurinha física **não tem código impresso**. Tem o país lateral em letras grandes (`BRA`) e o nome do jogador no rodapé. O scanner faz OCR do **nome**, não do código.

Estratégias para tolerância a erro:
- Pré-processamento: escala de cinza + ganho de contraste antes do OCR
- Whitelist de caracteres no Tesseract (só letras maiúsculas, espaço, hífen, apóstrofo)
- Múltiplas capturas (3 frames seguidos) — escolhe o melhor resultado
- Matching por distância de Levenshtein contra os 994 nomes da base
- Bônus por palavras compartilhadas (o sobrenome é o mais identificador)
- Retorna top 5 candidatos com % de similaridade — você confirma o certo

Primeira utilização baixa ~5MB do modelo de OCR em português, que fica no cache do navegador depois.

---

## Manutenção

- Backups: faça com frequência em Ajustes → Exportar backup. Os dados ficam só neste dispositivo
- Mudou de celular: exporte no antigo, importe no novo
- Limpar dados: Ajustes → Apagar todas as marcações

---

## Para desenvolver localmente

```bash
npm install
npm run dev
```

Servidor de desenvolvimento em http://localhost:5173.

```bash
npm run build
npm run preview
```

Build de produção e preview local.
