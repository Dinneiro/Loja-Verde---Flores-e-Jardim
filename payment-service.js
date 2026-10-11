const crypto = require('crypto');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const config = require('./config');

let client = null;
if (config.mp.accessToken) {
  client = new MercadoPagoConfig({
    accessToken: config.mp.accessToken,
    options: { timeout: 10000 }
  });
} else {
  console.warn('⚠️  MP_ACCESS_TOKEN ausente — cobrança online desligada (pedidos ficam para pagamento manual).');
}

if (client && !config.urlPublica) {
  console.warn('⚠️  BASE_URL não é https público: webhook e retorno automático do Mercado Pago ficam desligados.');
}

const urlNotificacao = () =>
  config.urlPublica ? `${config.baseUrl}/api/pagamentos/webhook` : undefined;

function separarNome(nome) {
  const partes = String(nome || '').trim().split(/\s+/);
  return { first_name: partes[0] || 'Cliente', last_name: partes.slice(1).join(' ') || undefined };
}

async function criarPagamentoPix(pedido, usuario) {
  if (!client) throw new Error('Gateway não configurado.');
  const r = await new Payment(client).create({
    body: {
      transaction_amount: Number(pedido.total.toFixed(2)),
      description: `Pedido #${pedido.id} — Loja Verde`,
      payment_method_id: 'pix',
      payer: { email: usuario.email, ...separarNome(usuario.nome) },
      external_reference: String(pedido.id),
      notification_url: urlNotificacao(),
      metadata: { pedido_id: pedido.id, usuario_id: usuario.id }
    },
    requestOptions: { idempotencyKey: `loja-verde-pedido-${pedido.id}-pix` }
  });
  const dados = r.point_of_interaction?.transaction_data || {};
  return {
    id: r.id,
    status: r.status,
    qr_code: dados.qr_code,
    qr_code_base64: dados.qr_code_base64,
    ticket_url: dados.ticket_url
  };
}

// Checkout hospedado (cartão em até 3x ou boleto). Enviamos UM item com o valor final
// do pedido: assim cupom, desconto Pix e frete batem centavo a centavo com o que o
// cliente viu, sem ratear descontos por item.
async function criarPreference(pedido, usuario) {
  if (!client) throw new Error('Gateway não configurado.');

  const excluidos = pedido.metodo_pagamento === 'boleto'
    ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'bank_transfer' }]
    : [{ id: 'ticket' }, { id: 'bank_transfer' }];

  const body = {
    items: [{
      id: String(pedido.id),
      title: `Pedido #${pedido.id} — Loja Verde`,
      quantity: 1,
      unit_price: Number(pedido.total.toFixed(2)),
      currency_id: 'BRL'
    }],
    payer: { email: usuario.email, name: usuario.nome },
    external_reference: String(pedido.id),
    notification_url: urlNotificacao(),
    payment_methods: { excluded_payment_types: excluidos, installments: 3 },
    statement_descriptor: 'LOJAVERDE'
  };

  if (config.urlPublica) {
    body.back_urls = {
      success: `${config.baseUrl}/?pagamento=sucesso&pedido=${pedido.id}`,
      failure: `${config.baseUrl}/?pagamento=falha&pedido=${pedido.id}`,
      pending: `${config.baseUrl}/?pagamento=pendente&pedido=${pedido.id}`
    };
    body.auto_return = 'approved';
  }

  const r = await new Preference(client).create({ body });
  const usarSandbox = config.mp.env === 'sandbox' && r.sandbox_init_point;
  return {
    preference_id: r.id,
    checkout_url: usarSandbox ? r.sandbox_init_point : r.init_point
  };
}

async function consultarPagamento(paymentId) {
  if (!client) throw new Error('Gateway não configurado.');
  const r = await new Payment(client).get({ id: paymentId });
  return {
    id: r.id,
    status: r.status,
    status_detail: r.status_detail,
    external_reference: r.external_reference,
    transaction_amount: r.transaction_amount,
    payment_method_id: r.payment_method_id,
    date_approved: r.date_approved
  };
}

// Assinatura conforme a documentação do Mercado Pago:
// manifest = "id:<data.id em minúsculas>;request-id:<x-request-id>;ts:<ts>;"
function validarAssinaturaWebhook(req) {
  const secret = config.mp.webhookSecret;
  if (!secret) return !config.isProd; // em produção, sem segredo = rejeita
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature || !xRequestId) return false;

  const partes = {};
  for (const trecho of String(xSignature).split(',')) {
    const i = trecho.indexOf('=');
    if (i > 0) partes[trecho.slice(0, i).trim()] = trecho.slice(i + 1).trim();
  }
  if (!partes.ts || !partes.v1) return false;

  const dataId = String(req.query['data.id'] || req.body?.data?.id || '').toLowerCase();
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${partes.ts};`;
  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  const a = Buffer.from(esperado);
  const b = Buffer.from(partes.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  criarPagamentoPix,
  criarPreference,
  consultarPagamento,
  validarAssinaturaWebhook,
  habilitado: !!client
};
