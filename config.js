const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';
const port = Number(process.env.PORT || 5000);

// Em produção estas variáveis são obrigatórias. Em desenvolvimento o servidor
// sobe sem elas (e-mails saem no console, pagamento real fica desligado).
const obrigatorias = ['JWT_SECRET', 'BASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'ADMIN_EMAIL', 'ADMIN_PASSWORD_HASH'];
if (isProd) {
  const faltando = obrigatorias.filter(k => !process.env[k]);
  if (faltando.length) {
    console.error('❌ Variáveis obrigatórias ausentes no .env:', faltando.join(', '));
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET precisa ter pelo menos 32 caracteres.');
    process.exit(1);
  }
  if (!/^https:\/\//.test(process.env.BASE_URL)) {
    console.error('❌ Em produção BASE_URL deve começar com https://');
    process.exit(1);
  }
}

const baseUrl = (process.env.BASE_URL || `http://127.0.0.1:${port}`).replace(/\/+$/, '');

module.exports = {
  env,
  isProd,
  port,
  baseUrl,
  // URL pública (https) é exigida pelo Mercado Pago para webhook e retorno automático.
  urlPublica: /^https:\/\//.test(baseUrl),

  // O arquivo "loja_verde.db" das versões antigas tem outro esquema; por isso o nome novo.
  dbPath: path.resolve(__dirname, process.env.DB_PATH || './database/loja_verde_v2.db'),

  // Sem JWT_SECRET em desenvolvimento: segredo aleatório (sessões caem ao reiniciar).
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 300),
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 20)
  },
  cspAtiva: process.env.CSP_DISABLED !== 'true',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  email: {
    from: process.env.EMAIL_FROM || 'Loja Verde <contato@lojaverde.com.br>',
    replyTo: process.env.EMAIL_REPLY_TO || process.env.LOJA_EMAIL || ''
  },

  mp: {
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    webhookSecret: process.env.MP_WEBHOOK_SECRET || '',
    env: process.env.PAYMENT_ENV || 'sandbox'
  },

  whatsapp: {
    numero: process.env.WHATSAPP_NUMERO || '5511999999999',
    grupoVip: process.env.WHATSAPP_GRUPO_VIP || ''
  },

  loja: {
    email: process.env.LOJA_EMAIL || 'contato@lojaverde.com.br',
    telefone: process.env.LOJA_TELEFONE || '(11) 9 9999-9999',
    endereco: process.env.LOJA_ENDERECO || ''
  },

  // Regras comerciais. O site mostra estes mesmos números; o servidor é quem manda.
  comercial: {
    freteGratisAcima: Number(process.env.FRETE_GRATIS_ACIMA || 99),
    fretePadrao: Number(process.env.FRETE_PADRAO || 15),
    descontoPixPct: Number(process.env.DESCONTO_PIX_PCT || 5),
    cupomPrimeiraCompra: (process.env.CUPOM_PRIMEIRA_COMPRA || 'VERDE10').toUpperCase(),
    cupomPrimeiraCompraPct: Number(process.env.CUPOM_PRIMEIRA_COMPRA_PCT || 10),
    cupomParceiroPct: Number(process.env.CUPOM_PARCEIRO_PCT || 20),
    // Pedidos não pagos são cancelados e o estoque volta. 0 desliga.
    pedidoExpiraHoras: Number(process.env.PEDIDO_EXPIRA_HORAS || 48)
  },

  backup: {
    dir: path.resolve(__dirname, process.env.BACKUP_DIR || './backups'),
    retentionDays: Number(process.env.BACKUP_RETENTION_DAYS || 30)
  }
};
