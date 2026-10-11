# 🌿 Loja Verde

**E-commerce de plantas, hortaliças e flores — do viveiro à porta do cliente.**

Catálogo, carrinho com conta, login por e-mail (OTP), Pix / cartão / boleto via Mercado Pago, perfil do cliente, painel admin com gráficos e gestão de pedidos.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org)
[![Mercado Pago](https://img.shields.io/badge/Mercado%20Pago-API-009EE3?logo=mercadopago&logoColor=white)](https://www.mercadopago.com.br)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](./package.json)

---

## Demo local em 2 minutos

```bash
# 1. Node.js 20.17+ instalado
# 2. Na pasta do projeto:
./iniciar_servidor.sh          # Mac / Linux
# ou dê dois cliques em iniciar_servidor.bat  (Windows)
```

Abra **http://127.0.0.1:5000**

Sem configurar nada além disso:

- o catálogo é criado sozinho no primeiro start
- o código de verificação de e-mail aparece **no terminal** (modo dev)
- o pagamento fica manual (pedido registrado + combina no WhatsApp) até você colar as chaves do Mercado Pago

```bash
npm test            # testes backend + front
npm run seed        # garante os 17 produtos (--reset recria)
npm run backup      # backup consistente do SQLite
npm run hash-admin -- "SuaSenhaForte123"
```

---

## O que a loja faz

| Área | Funcionalidades |
|------|-----------------|
| **Vitrine** | Catálogo com filtros, busca, quiz “qual planta combina com você”, kits, especial Finados, favoritos |
| **Conta** | Cadastro + OTP por e-mail, login, recuperação de senha, perfil com foto, pedidos, avaliações, devoluções e preferências |
| **Compra** | Carrinho liberado **após login**, cupom, desconto Pix 5%, frete grátis acima de R$ 99, checkout com endereço |
| **Pagamento** | Mercado Pago (Pix, cartão até 3x, boleto) ou modo manual via WhatsApp |
| **Pós-venda** | Status do pedido, rastreio por e-mail, Garantia Planta Viva 30 dias, páginas legais (LGPD, trocas, entrega, termos) |
| **B2B** | Cadastro de parceiros, cupom de atacado, grupo VIP, fluxo de compras do grupo |
| **Admin** | `/admin.html` — KPIs, gráficos de fluxo e receita, pedidos, estoque, produtos novos |

**Regra de negócio central:** preço, cupom, Pix e frete são **recalculados no servidor**. O front só sugere; o backend manda.

---

## Stack

```
Node.js 20+ · Express 5 · SQLite3 · JWT · bcrypt · Helmet · Rate limit
Mercado Pago SDK · Nodemailer · Front vanilla (HTML/CSS/JS)
```

Sem framework pesado no cliente: loja rápida de carregar e fácil de hospedar.

---

## Estrutura

```
server.js              API + arquivos estáticos
config.js              variáveis do .env
email-service.js       e-mails transacionais
payment-service.js     Mercado Pago + webhook
lib/                   banco, preços, cupons, seed-data.json
scripts/               hash-admin · seed · backup
public/                site (index, estilo, carrinho, auth, checkout, perfil)
  admin.html / admin.js
  privacidade · termos · trocas · entrega
test/                  api.test.js · front.test.js
iniciar_servidor.bat / .sh
```

---

## Painel admin

1. Gere o hash:
   ```bash
   npm run hash-admin -- "SuaSenhaComPeloMenos12Caracteres"
   ```
2. No `.env`:
   ```env
   ADMIN_EMAIL=voce@seudominio.com
   ADMIN_PASSWORD_HASH='cole_o_hash_aqui'
   ```
   (aspas **simples** se o hash tiver `$`)
3. Reinicie o servidor e abra **http://127.0.0.1:5000/admin.html**

Lá você:

- vê pedidos e muda status / rastreio (cliente recebe e-mail)
- edita preço, estoque e “ativo” dos produtos
- cadastra novos itens
- acompanha gráficos do funil de compras e receita por forma de pagamento

O link do painel **não** fica exposto no rodapé da loja.

---

## Pagamento real (Mercado Pago)

```env
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=...
PAYMENT_ENV=sandbox   # depois: producao
BASE_URL=https://seudominio.com.br
```

1. Use credencial de **teste** primeiro.
2. Webhook precisa de URL **pública https** → em local use ngrok/cloudflared e coloque em `BASE_URL`.
3. No painel MP → Webhooks → `SUA_BASE_URL/api/pagamentos/webhook` (evento *Pagamentos*).

Sem token MP, a loja registra o pedido e orienta o cliente a pagar pelo WhatsApp.

---

## Checklist para produção

- [ ] `NODE_ENV=production` e `BASE_URL=https://seudominio.com.br`
- [ ] `JWT_SECRET` com 32+ caracteres aleatórios (o servidor **não sobe** sem isso em produção)
- [ ] SMTP real (`SMTP_*`, `EMAIL_FROM`)
- [ ] `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`
- [ ] `MP_ACCESS_TOKEN` de produção + `PAYMENT_ENV=producao` + `MP_WEBHOOK_SECRET`
- [ ] HTTPS na frente (Nginx, Caddy, Render, Railway…)
- [ ] Trocar WhatsApp, CNPJ, endereço e e-mail de contato nos placeholders
- [ ] Revisar textos legais com um advogado (base LGPD / CDC)
- [ ] Agendar `npm run backup` e guardar cópias fora do servidor

> **GitHub Pages não serve** para esta loja: processa pagamento e precisa de Node + banco. Use VPS, Render, Railway, Fly.io etc.

---

## Segurança (já no código)

- Senhas com **bcrypt**; tokens de recuperação **hasheados**
- OTP com limite de tentativas
- Preço e estoque validados no servidor (reserva atômica)
- Webhook MP confere valor e é idempotente
- Helmet + CSP, rate limit na API e nas rotas de auth
- Admin e e-mails sem XSS (`textContent` / escape)
- Pedidos não pagos expiram e **devolvem estoque**

---

## Variáveis principais (`.env.example`)

| Variável | Para quê |
|----------|----------|
| `PORT` / `BASE_URL` | Porta local e URL pública |
| `JWT_SECRET` | Sessões assinadas |
| `ADMIN_*` | Acesso ao painel |
| `SMTP_*` | E-mails de OTP e pedidos |
| `MP_*` / `PAYMENT_ENV` | Mercado Pago |
| `WHATSAPP_NUMERO` | Botão e checkout manual |
| `FRETE_*` / `DESCONTO_PIX_PCT` / `CUPOM_*` | Regras comerciais |
| `PEDIDO_EXPIRA_HORAS` | Cancela não pagos (padrão 48h) |

Copie `.env.example` → `.env` e preencha. **Nunca** suba o `.env` no Git.

---

## Scripts

| Comando | Ação |
|---------|------|
| `npm start` | Sobe a API + site |
| `npm test` | Testes automatizados |
| `npm run seed` | Catálogo inicial |
| `npm run backup` | Snapshot do banco |
| `npm run hash-admin -- "senha"` | Hash para o `.env` |

---

## Licença

ISC — use, adapte e venda plantas com responsabilidade.

---

**Da horta para a casa.**  
Feito para quem quer uma loja de verdade, não só um catálogo estático.
