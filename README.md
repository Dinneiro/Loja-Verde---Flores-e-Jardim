<div align="center">

<img src="https://i.pinimg.com/736x/06/79/aa/0679aa680bfffbcd9d62eeacb9222fab.jpg" alt="Loja Verde - Flores e Jardim" width="720">

# 🌿 Loja Verde — Flores e Jardim

**E-commerce completo de plantas, flores e jardinagem, com front-end elegante e back-end em Python.**

![Python](https://img.shields.io/badge/Python-3.x-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-API_REST-000000?logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Banco_de_dados-003B57?logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow.svg)

</div>

---

## 📑 Índice

- [Sobre o projeto](#-sobre-o-projeto)
- [Galeria](#-galeria)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Como rodar](#-como-rodar)
- [API REST](#-api-rest)
- [Banco de dados](#-banco-de-dados)
- [Configurações importantes](#-configurações-importantes)
- [Segurança e limitações](#-segurança-e-limitações)
- [Próximos passos](#-próximos-passos)
- [Contato](#-contato)

---

## 🌳 Sobre o projeto

A **Loja Verde** é um e-commerce para uma floricultura e loja de jardinagem, pensado para ter uma experiência de compra agradável: cores suaves, tipografia elegante e layout responsivo.

O site funciona em duas camadas:

- **Front-end** (HTML, CSS e JavaScript puro): catálogo, carrinho, favoritos, quiz, modais de produto e checkout.
- **Back-end** (Python + Flask + SQLite): cadastro e login com verificação de e-mail, portal de comerciantes (atacado), promoções B2B e rastreio de visitantes.

O fechamento do pedido é feito via **WhatsApp**: o checkout monta o resumo da compra e abre a conversa com a loja.

---

## 🖼️ Galeria

<div align="center">

<img src="https://i.pinimg.com/736x/f9/59/97/f95997d3508b5cb4ff5f36c6f0fc339c.jpg" alt="Inspiração visual da Loja Verde" width="560">

<sub>Inspiração visual: delicadeza, natureza e tons de verde.</sub>

</div>

---

## 🚀 Funcionalidades

### 🛍️ Loja

- **Catálogo em grade** com navegação por categorias: Hortaliças, Temperos e ervas, Plantas ornamentais, Mudas, Suculentas, Kits e **Especial Finados**.
- **Busca** de produtos e filtro por tags.
- **Modal de produto detalhado** com galeria de fotos, descrição, estoque, cálculo de frete e sugestões de outros produtos.
- **Opções de compra:** produto base ou **combo** (ex.: planta + vaso) com preço próprio.
- **Controle de estoque:** aviso de poucas unidades e bloqueio de compra para itens esgotados.
- **Parcelamento** em até 3x sem juros e **5% de desconto no Pix**.
- **Cupom de desconto** no checkout (ex.: `VERDE10`) e barra de progresso para frete grátis.

### 🛒 Carrinho e pedidos

- Carrinho persistido no `localStorage`, com variações (base/combo) e ajuste de quantidades.
- Escolha do método de pagamento, data de entrega e mensagem para cartão.
- **Finalização via WhatsApp** com o resumo completo do pedido.

### 👤 Conta do usuário

- **Cadastro e login** integrados à API.
- **Verificação de e-mail por código (OTP)** de 6 dígitos.
- **Lista de favoritos** e **página de perfil** (e-mail e foto).
- Opção de continuar como visitante.

### ✨ Experiências extras

- 🧠 **Quiz "Qual planta combina com você?"** para recomendar a planta ideal.
- 🥬 **Clube da Cesta Verde:** assinatura semanal ou quinzenal de hortaliças e temperos, com frete grátis.
- 🏢 **Plantas para Empresas e Eventos.**
- 🌿 **Garantia Planta Viva de 30 dias.**
- 💬 **Central de atendimento** com atalho para o WhatsApp.

### 🤝 Portal do Comerciante (B2B / Atacado)

- Cadastro de restaurantes, condomínios, floriculturas e outros negócios.
- **Geração automática de cupom exclusivo** de parceiro (`PARCEIRO20-XXXX`).
- Lista de **promoções de atacado** carregada do servidor, por exemplo:

| Cupom | Público | Desconto | Mínimo |
|---|---|---|---|
| `REVENDAVERDE25` | Restaurantes (ervas e temperos) | 25% | 20 un. |
| `VERDECORP30` | Condomínios e escritórios | 30% | 15 un. |
| `ATACADOFINADOS` | Floriculturas (Finados e eventos) | 35% | 30 un. |

### 📊 Rastreio de visitantes

- Registro de IP, navegador, página visitada e contagem de visitas acumuladas.

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Estrutura | HTML5 semântico |
| Estilo | CSS3 (variáveis `:root`, Grid, Flexbox, `@media` responsivo) |
| Lógica | JavaScript ES6+ (DOM, `fetch`, `localStorage`) |
| Back-end | Python 3 + **Flask** + **Flask-CORS** |
| Banco de dados | **SQLite** (SQL puro, com integridade referencial) |
| Fontes e ícones | Google Fonts (Great Vibes, Playfair Display, Lato) e Font Awesome |

---

## 📁 Estrutura de pastas

```text
loja-verde/
├── index.html              # Estrutura da página e modais
├── style.css               # Estilos e responsividade
├── script.js               # Catálogo, carrinho, checkout, auth, quiz, B2B
├── server.py               # API Flask + SQLite + servidor dos arquivos estáticos
├── iniciar_servidor.bat    # Atalho para iniciar o servidor no Windows
├── database/
│   └── loja_verde.db       # Banco SQLite (criado automaticamente pelo servidor)
└── README.md
```

> O `server.py` procura o front-end na própria pasta ou em uma subpasta chamada `Loja-Verde---Flores-e-Jardim-main`, e cria a pasta `database/` sozinho se ela não existir.

---

## ⚙️ Como rodar

### Pré-requisitos

- [Python 3.10+](https://www.python.org/downloads/)
- `pip` (já vem com o Python)

### 1. Baixe o projeto

```bash
git clone https://github.com/seu-usuario/loja-verde.git
cd loja-verde
```

### 2. (Opcional) Crie um ambiente virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install flask flask-cors
```

### 4. Inicie o servidor

**No Windows**, dê dois cliques em `iniciar_servidor.bat`, ou rode:

```bash
python server.py
```

### 5. Acesse no navegador

```text
http://127.0.0.1:5000
```

As tabelas do banco e as promoções de atacado são criadas automaticamente na primeira execução. 🌱

---

## 🔌 API REST

Base: `http://127.0.0.1:5000`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/visitante/rastrear` | Registra a visita (IP, navegador e página) |
| `POST` | `/api/auth/registrar` | Cria conta e gera o código de verificação |
| `POST` | `/api/auth/verificar-email` | Confirma o e-mail com o código e inicia a sessão |
| `POST` | `/api/auth/login` | Login com e-mail e senha, retorna token de sessão |
| `POST` | `/api/comerciantes/cadastro` | Cadastra comerciante e gera cupom de parceiro |
| `GET` | `/api/comerciantes/promocoes` | Lista as promoções de atacado ativas |
| `GET` | `/` e `/<arquivo>` | Serve o site e seus arquivos estáticos |

**Exemplo — cadastro de usuário:**

```bash
curl -X POST http://127.0.0.1:5000/api/auth/registrar \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","senha":"minhasenha"}'
```

---

## 🗄️ Banco de dados

O SQLite possui as seguintes tabelas:

| Tabela | Finalidade |
|---|---|
| `usuarios` | Contas, hash da senha, salt, código de verificação, token de sessão e papel (`role`) |
| `plantas` | Estrutura para produtos (preço, estoque, combo, cuidados, selo etc.) |
| `pedidos` | Pedidos com itens, valores, pagamento, entrega e status |
| `comerciantes` | Parceiros B2B e seus cupons |
| `promocoes_comerciantes` | Promoções exclusivas de atacado |
| `visitantes` | Rastreio de acessos |

> Atualmente o **catálogo de produtos fica no `script.js`**. A tabela `plantas` já está pronta para quando o catálogo for migrado para o banco.

---

## 🔧 Configurações importantes

| O que mudar | Onde |
|---|---|
| Número do WhatsApp da loja | `WHATSAPP_NUMERO` no topo do `script.js` |
| Link do grupo VIP de comerciantes | Rota `/api/comerciantes/cadastro` no `server.py` |
| Porta e modo debug | Última linha do `server.py` (`app.run(...)`) |
| URL da API no front-end | `API_BASE` no `script.js` |

⚠️ O número `5511999999999` é um **exemplo**. Troque pelo WhatsApp comercial real antes de publicar.

---

## 🔒 Segurança e limitações

Este projeto é uma **base de estudo e demonstração**. Antes de colocá-lo em produção, considere:

- 🔑 **Hash de senha:** hoje usa SHA-256 + salt. Para produção, prefira `bcrypt`, `argon2` ou `scrypt`.
- 📧 **Verificação de e-mail:** o código OTP é **retornado na resposta da API** (`codigo_simulado`) para facilitar a demonstração. Em produção, envie por e-mail (SMTP ou serviço transacional) e remova esse campo.
- 🧪 **Modo debug:** o servidor roda com `debug=True` e `host="0.0.0.0"`. Desative em produção.
- 🛡️ **CORS:** está aberto para qualquer origem. Restrinja ao seu domínio.
- 🔐 **Token de sessão:** é guardado no banco, mas as rotas ainda não exigem autenticação nem expiração.
- 🛒 **Preços e cupons** são calculados no navegador. Valide tudo no servidor antes de processar pedidos reais.

---

## 🗺️ Próximos passos

- [ ] Migrar o catálogo de produtos para a tabela `plantas` e criar rotas de CRUD
- [ ] Salvar os pedidos na tabela `pedidos` ao finalizar o checkout
- [ ] Painel administrativo protegido por `role: "admin"`
- [ ] Envio real de e-mail para verificação
- [ ] Hash de senha mais forte e expiração de sessão
- [ ] Integração com gateway de pagamento
- [ ] Deploy (Render, Railway, PythonAnywhere ou VPS)

---

## 👤 Contato

Desenvolvido por **Thiago Oliveira** — 2025

📧 thiagosilvafx5@gmail.com

---

<div align="center">

Feito com 💚 e muitas plantinhas 🌱

</div>
