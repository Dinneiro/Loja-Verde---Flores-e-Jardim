const nodemailer = require('nodemailer');
const config = require('./config');

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const brl = n => 'R$ ' + Number(n).toFixed(2).replace('.', ',');

// Sem SMTP configurado (só permitido fora de produção) os e-mails vão para o console.
const modoConsole = !config.smtp.host;
let transporter = null;

if (modoConsole) {
  console.warn('⚠️  SMTP não configurado — e-mails serão impressos no console (modo desenvolvimento).');
} else {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    pool: true,
    maxConnections: 5
  });
  transporter.verify(err => {
    if (err) console.error('❌ SMTP indisponível:', err.message);
    else console.log('📧 SMTP pronto.');
  });
}

function layout(titulo, corpo, cta, ctaUrl) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;background:#F0F6EC;font-family:Arial,sans-serif;color:#1A2820;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#1F4D3A;padding:24px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;">🌿 Loja Verde</h1></td></tr>
<tr><td style="padding:32px;">
<h2 style="color:#1F4D3A;margin:0 0 12px;font-size:20px;">${titulo}</h2>
${corpo}
${ctaUrl ? `<p style="text-align:center;margin:28px 0 8px;"><a href="${esc(ctaUrl)}" style="background:#B84E12;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;display:inline-block;">${esc(cta)}</a></p>` : ''}
</td></tr>
<tr><td style="background:#F8F7F2;padding:20px;text-align:center;font-size:12px;color:#4F5F54;">
Loja Verde${config.loja.endereco ? ' • ' + esc(config.loja.endereco) : ''}<br>${esc(config.loja.email)} • ${esc(config.loja.telefone)}
</td></tr></table></td></tr></table></body></html>`;
}

// Nunca lança erro: falha de e-mail não pode derrubar cadastro, pedido ou webhook.
async function enviar({ to, subject, html }) {
  if (modoConsole) {
    const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`\n📧 [DEV] Para: ${to}\n   Assunto: ${subject}\n   ${texto.slice(0, 300)}\n`);
    return { ok: true, console: true };
  }
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      replyTo: config.email.replyTo || undefined,
      subject,
      html
    });
    console.log(`📧 Enviado (${info.messageId}) para ${to}`);
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error('❌ Falha ao enviar e-mail:', err.message);
    return { ok: false, erro: err.message };
  }
}

exports.enviarCodigoVerificacao = (nome, email, codigo) => enviar({
  to: email,
  subject: `Seu código de verificação: ${codigo}`,
  html: layout(`Olá, ${esc(nome)}!`,
    `<p>Use o código abaixo para confirmar seu e-mail. Ele expira em <strong>15 minutos</strong>.</p>
     <div style="background:#F0F6EC;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
       <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1F4D3A;">${esc(codigo)}</span>
     </div>`)
});

exports.enviarBoasVindas = (nome, email) => enviar({
  to: email,
  subject: 'Bem-vindo(a) à Loja Verde 🌿',
  html: layout(`Que alegria ter você, ${esc(nome)}!`,
    `<p>Sua conta está ativa. Cupom de primeira compra:
     <strong style="background:#FDEEE4;padding:4px 10px;border-radius:6px;color:#B84E12;">${esc(config.comercial.cupomPrimeiraCompra)}</strong>
     (${config.comercial.cupomPrimeiraCompraPct}% de desconto).</p>`,
    'Ver catálogo', `${config.baseUrl}/`)
});

exports.enviarRecuperacaoSenha = (nome, email, token) => enviar({
  to: email,
  subject: 'Recuperação de senha — Loja Verde',
  html: layout(`Redefinir senha, ${esc(nome)}`,
    '<p>Recebemos um pedido para redefinir sua senha. O link abaixo expira em <strong>1 hora</strong>. Se não foi você, ignore este e-mail.</p>',
    'Redefinir minha senha', `${config.baseUrl}/?recuperar=${token}`)
});

exports.enviarPedidoCriado = (pedido, usuario) => enviar({
  to: usuario.email,
  subject: `Pedido #${pedido.id} recebido`,
  html: layout(`Recebemos seu pedido, ${esc(usuario.nome)}!`,
    `<p>Pedido <strong>#${pedido.id}</strong> registrado. Aguardamos a confirmação do pagamento.</p>
     <p>Total: <strong>${brl(pedido.total)}</strong></p>
     <p>Forma de pagamento: ${esc(pedido.metodo_pagamento)}</p>`)
});

exports.enviarPagamentoAprovado = (pedido, usuario) => enviar({
  to: usuario.email,
  subject: `✅ Pagamento aprovado — Pedido #${pedido.id}`,
  html: layout('Pagamento confirmado!',
    `<p>Seu pedido <strong>#${pedido.id}</strong> está em separação. 🌱</p>
     <p>Total pago: <strong>${brl(pedido.total)}</strong></p>`)
});

exports.enviarPedidoEnviado = (pedido, usuario, rastreio) => enviar({
  to: usuario.email,
  subject: `🚚 Pedido #${pedido.id} saiu para entrega`,
  html: layout('Seu pedido está a caminho',
    `<p>O pedido <strong>#${pedido.id}</strong> saiu para entrega.</p>
     ${rastreio ? `<p>Código de rastreio: <strong>${esc(rastreio)}</strong></p>` : ''}`)
});

exports.notificarAdminNovoPedido = (pedido) => {
  if (!config.adminEmail) return Promise.resolve();
  return enviar({
    to: config.adminEmail,
    subject: `🛒 Novo pedido #${pedido.id} — ${brl(pedido.total)}`,
    html: layout('Novo pedido',
      `<p>Cliente: <strong>${esc(pedido.cliente_nome)}</strong></p>
       <p>Total: <strong>${brl(pedido.total)}</strong></p>`,
      'Abrir painel', `${config.baseUrl}/admin.html`)
  });
};

exports.esc = esc;
