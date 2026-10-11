// Testes de integração: node --test test/   (ou: npm test)
// Usam um banco temporário e deixam o gateway/SMTP desligados (e-mails vão para o console).
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX = '100000';
process.env.RATE_LIMIT_AUTH_MAX = '100000';
process.env.ADMIN_EMAIL = 'admin@teste.com';
process.env.MP_ACCESS_TOKEN = '';
process.env.SMTP_HOST = '';
process.env.PEDIDO_EXPIRA_HORAS = '48';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');

process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('SenhaAdminForte123', 4);

const config = require('../config');
const dbLib = require('../lib/db');
const emailSvc = require('../email-service');
const pagSvc = require('../payment-service');
const { criarApp } = require('../server');

let db, servidor, base, tmp;
const emails = { aprovado: 0, recuperacao: [], codigos: {} };

const chamar = async (metodo, rota, corpo, token, extra = {}) => {
  const r = await fetch(base + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...extra },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  let json = null;
  try { json = await r.clone().json(); } catch { /* html */ }
  return { status: r.status, json, r };
};

async function criarUsuario(email, nome = 'Maria Silva', senha = 'senhaSegura1') {
  let r = await chamar('POST', '/api/auth/registrar', { nome, email, senha });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const u = await db.get('SELECT codigo_verificacao FROM usuarios WHERE email = ?', [email]);
  r = await chamar('POST', '/api/auth/verificar-email', { email, codigo: u.codigo_verificacao });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.json.token;
}
const estoque = async id => (await db.get('SELECT estoque FROM produtos WHERE id = ?', [id])).estoque;

test.before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lv-'));
  db = dbLib.abrir(path.join(tmp, 't.db'));
  await dbLib.iniciarEsquema(db);
  const app = criarApp(db);
  app.locals.db = db;
  servidor = app.listen(0);
  base = 'http://127.0.0.1:' + servidor.address().port;
  test.app = app;

  emailSvc.enviarPagamentoAprovado = async () => { emails.aprovado++; return { ok: true }; };
  emailSvc.enviarRecuperacaoSenha = async (n, e, token) => { emails.recuperacao.push(token); return { ok: true }; };
});

test.after(async () => {
  servidor.close();
  await db.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('site e API básicos', async () => {
  let r = await chamar('GET', '/api/health');
  assert.equal(r.json.ok, true);

  r = await chamar('GET', '/');
  assert.equal(r.status, 200);
  const html = await r.r.text();
  for (const s of ['/script.js', '/auth.js', '/checkout.js', '/paginas.js']) assert.ok(html.includes(s), 'index sem ' + s);

  // Express 5: rota curinga do fallback precisa funcionar
  r = await chamar('GET', '/qualquer/coisa');
  assert.equal(r.status, 200);
  assert.ok((await r.r.text()).includes('Loja Verde'));

  r = await chamar('GET', '/termos');
  assert.equal(r.status, 200);

  r = await chamar('GET', '/api/nao-existe');
  assert.equal(r.status, 404);
  assert.equal(r.json.sucesso, false);

  r = await chamar('GET', '/api/produtos');
  assert.equal(r.json.produtos.length, 17);
  assert.equal(r.json.produtos[0].id, 1);
  assert.equal(r.json.produtos[0].preco, 6.9);
});

test('cadastro, OTP e login', async () => {
  let r = await chamar('POST', '/api/auth/registrar', { nome: 'A', email: 'x', senha: '123' });
  assert.equal(r.status, 400);

  r = await chamar('POST', '/api/auth/registrar', { nome: 'Joana Lima', email: 'Joana@Teste.com', senha: 'senhaSegura1' });
  assert.equal(r.status, 200);
  assert.equal(r.json.email, 'joana@teste.com');

  r = await chamar('POST', '/api/auth/login', { email: 'joana@teste.com', senha: 'senhaSegura1' });
  assert.equal(r.status, 403);
  assert.equal(r.json.precisa_verificar, true);

  r = await chamar('POST', '/api/auth/verificar-email', { email: 'joana@teste.com', codigo: '000000' });
  assert.equal(r.status, 400);

  // 5 erros bloqueiam o código mesmo que o próximo palpite esteja certo
  for (let i = 0; i < 5; i++) await chamar('POST', '/api/auth/verificar-email', { email: 'joana@teste.com', codigo: '111111' });
  const u = await db.get('SELECT codigo_verificacao FROM usuarios WHERE email = ?', ['joana@teste.com']);
  r = await chamar('POST', '/api/auth/verificar-email', { email: 'joana@teste.com', codigo: u.codigo_verificacao });
  assert.equal(r.status, 429);

  // novo registro do mesmo e-mail não verificado refaz o código (não trava a conta)
  r = await chamar('POST', '/api/auth/registrar', { nome: 'Joana Lima', email: 'joana@teste.com', senha: 'outraSenha99' });
  assert.equal(r.status, 200);
  const u2 = await db.get('SELECT codigo_verificacao FROM usuarios WHERE email = ?', ['joana@teste.com']);
  r = await chamar('POST', '/api/auth/verificar-email', { email: 'joana@teste.com', codigo: u2.codigo_verificacao });
  assert.equal(r.status, 200);
  assert.ok(r.json.token);

  r = await chamar('POST', '/api/auth/login', { email: 'joana@teste.com', senha: 'senhaErrada' });
  assert.equal(r.status, 401);
  r = await chamar('POST', '/api/auth/login', { email: 'joana@teste.com', senha: 'outraSenha99' });
  assert.equal(r.status, 200);

  r = await chamar('POST', '/api/auth/registrar', { nome: 'Joana', email: 'joana@teste.com', senha: 'senhaSegura1' });
  assert.equal(r.status, 409);
});

test('recuperação de senha usa token de uso único e guarda só o hash', async () => {
  await criarUsuario('rec@teste.com');
  let r = await chamar('POST', '/api/auth/recuperar-senha', { email: 'rec@teste.com' });
  assert.equal(r.status, 200);
  const token = emails.recuperacao.at(-1);
  assert.ok(token && token.length === 64);
  const linha = await db.get('SELECT token_recuperacao_hash FROM usuarios WHERE email = ?', ['rec@teste.com']);
  assert.notEqual(linha.token_recuperacao_hash, token);

  r = await chamar('POST', '/api/auth/redefinir-senha', { token, novaSenha: 'novaSenha123' });
  assert.equal(r.status, 200);
  r = await chamar('POST', '/api/auth/redefinir-senha', { token, novaSenha: 'outraCoisa123' });
  assert.equal(r.status, 400); // já usado
  r = await chamar('POST', '/api/auth/login', { email: 'rec@teste.com', senha: 'novaSenha123' });
  assert.equal(r.status, 200);

  // e-mail inexistente: mesma resposta (não revela cadastro)
  r = await chamar('POST', '/api/auth/recuperar-senha', { email: 'ninguem@teste.com' });
  assert.equal(r.status, 200);
});

const endereco = 'Rua das Flores, 123 - Centro - São Paulo/SP';

test('pedido: preço vem do banco, validações e totais', async () => {
  const token = await criarUsuario('compra@teste.com');
  const pedir = (itens, extra = {}) => chamar('POST', '/api/pedidos',
    { itens, metodo_pagamento: 'pix', endereco_entrega: endereco, ...extra }, token);

  assert.equal((await chamar('POST', '/api/pedidos', { itens: [{ id: 1, qtd: 1 }] })).status, 401);
  assert.equal((await pedir([{ id: 1, qtd: -5 }])).status, 400);
  assert.equal((await pedir([{ id: 1, qtd: 1.5 }])).status, 400);
  assert.equal((await pedir([{ id: 1, qtd: 100 }])).status, 400);
  assert.equal((await pedir([])).status, 400);
  assert.equal((await pedir([{ id: 9999, qtd: 1 }])).status, 400);
  assert.equal((await pedir([{ id: 1, qtd: 1 }], { endereco_entrega: 'curto' })).status, 400);
  assert.equal((await pedir([{ id: 1, qtd: 1 }], { metodo_pagamento: 'bitcoin' })).status, 400);
  assert.equal((await pedir([{ id: 1, qtd: 1 }], { cupom: 'FALSO' })).status, 400);
  assert.equal(await estoque(1), 45, 'pedido inválido não pode mexer no estoque');

  // preço enviado pelo navegador é ignorado; VERDE10 + Pix: 138,00 - 13,80 - 6,21 = 117,99 (frete grátis)
  let r = await pedir([{ id: 1, qtd: 20, preco: 0.01 }], { cupom: 'verde10' });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal(r.json.totais.subtotal, 138);
  assert.equal(r.json.totais.descontoCupom, 13.8);
  assert.equal(r.json.totais.descontoPix, 6.21);
  assert.equal(r.json.totais.frete, 0);
  assert.equal(r.json.total, 117.99);
  assert.ok(r.json.aviso, 'sem gateway deve avisar pagamento manual');
  assert.equal(await estoque(1), 25);

  // VERDE10 só na primeira compra
  r = await pedir([{ id: 4, qtd: 1 }], { cupom: 'VERDE10' });
  assert.equal(r.status, 400);

  // abaixo de R$ 99 cobra frete; cartão não tem desconto Pix
  r = await pedir([{ id: 4, qtd: 1 }], { metodo_pagamento: 'cartao' });
  assert.equal(r.status, 200);
  assert.equal(r.json.total, 29.9); // 14,90 + 15,00

  // itens repetidos são somados
  r = await pedir([{ id: 6, qtd: 1 }, { id: 6, qtd: 2 }], { metodo_pagamento: 'boleto' });
  assert.equal(r.json.totais.subtotal, 38.7);
  assert.equal(await estoque(6), 47);

  r = await chamar('GET', '/api/pedidos/meus', null, token);
  assert.equal(r.json.pedidos.length, 3);
  const outro = await criarUsuario('curioso@teste.com');
  r = await chamar('GET', '/api/pedidos/' + r.json.pedidos[0].id, null, outro);
  assert.equal(r.status, 404, 'não pode ver pedido de outro cliente');
});

test('estoque: duas compras simultâneas do último item — só uma passa', async () => {
  const t1 = await criarUsuario('c1@teste.com');
  const t2 = await criarUsuario('c2@teste.com');
  await db.run('UPDATE produtos SET estoque = 1 WHERE id = 17');
  const corpo = { itens: [{ id: 17, qtd: 1 }], metodo_pagamento: 'cartao', endereco_entrega: endereco };
  const [a, b] = await Promise.all([
    chamar('POST', '/api/pedidos', corpo, t1),
    chamar('POST', '/api/pedidos', corpo, t2)
  ]);
  const codigos = [a.status, b.status].sort();
  assert.deepEqual(codigos, [200, 409]);
  assert.equal(await estoque(17), 0);

  // estoque insuficiente não deixa baixa parcial em pedido com vários itens
  const antes5 = await estoque(5);
  const r = await chamar('POST', '/api/pedidos',
    { itens: [{ id: 5, qtd: 2 }, { id: 17, qtd: 1 }], metodo_pagamento: 'cartao', endereco_entrega: endereco }, t1);
  assert.equal(r.status, 409); // item 17 esgotado
  assert.equal(await estoque(5), antes5);
});

async function loginAdmin() {
  const r = await chamar('POST', '/api/admin/login', { email: 'admin@teste.com', senha: 'SenhaAdminForte123' });
  assert.equal(r.status, 200);
  return r.json.token;
}

test('admin: acesso, cancelamento devolve estoque uma única vez, validações', async () => {
  assert.equal((await chamar('POST', '/api/admin/login', { email: 'admin@teste.com', senha: 'errada' })).status, 401);
  assert.equal((await chamar('POST', '/api/admin/login', { email: 'outro@teste.com', senha: 'SenhaAdminForte123' })).status, 401);
  const admin = await loginAdmin();
  const cliente = await criarUsuario('adm-cli@teste.com');

  assert.equal((await chamar('GET', '/api/admin/pedidos')).status, 401);
  assert.equal((await chamar('GET', '/api/admin/pedidos', null, cliente)).status, 403);
  assert.equal((await chamar('GET', '/api/admin/pedidos', null, admin)).status, 200);

  const antes = await estoque(2);
  let r = await chamar('POST', '/api/pedidos',
    { itens: [{ id: 2, qtd: 3 }], metodo_pagamento: 'pix', endereco_entrega: endereco }, cliente);
  const id = r.json.pedido_id;
  assert.equal(await estoque(2), antes - 3);

  assert.equal((await chamar('PATCH', '/api/admin/pedidos/' + id, { status: 'invalido' }, admin)).status, 400);
  assert.equal((await chamar('PATCH', '/api/admin/pedidos/' + id, { status: 'cancelado' }, admin)).status, 200);
  assert.equal(await estoque(2), antes);
  assert.equal((await chamar('PATCH', '/api/admin/pedidos/' + id, { status: 'cancelado' }, admin)).status, 200);
  assert.equal(await estoque(2), antes, 'cancelar de novo não pode devolver em dobro');

  // produtos
  assert.equal((await chamar('POST', '/api/admin/produtos', { nome: 'X', categoria: 'hortalicas', preco: -1 }, admin)).status, 400);
  assert.equal((await chamar('POST', '/api/admin/produtos', { nome: 'Planta Nova', categoria: 'inexistente', preco: 10 }, admin)).status, 400);
  assert.equal((await chamar('POST', '/api/admin/produtos', { nome: 'Planta Nova', categoria: 'mudas', preco: 10, imagem: 'javascript:alert(1)' }, admin)).status, 400);
  r = await chamar('POST', '/api/admin/produtos', { nome: 'Planta Nova', categoria: 'mudas', preco: 10, estoque: 5, imagem: 'https://exemplo.com/a.jpg' }, admin);
  assert.equal(r.status, 200);
  assert.equal((await chamar('PATCH', '/api/admin/produtos/' + r.json.produto_id, { preco: 12.5, estoque: 7 }, admin)).status, 200);
  assert.equal((await chamar('PATCH', '/api/admin/produtos/' + r.json.produto_id, { estoque: -3 }, admin)).status, 400);
  assert.equal((await chamar('PATCH', '/api/admin/produtos/99999', { estoque: 1 }, admin)).status, 404);
  // produto inativo some do catálogo público
  await chamar('PATCH', '/api/admin/produtos/' + r.json.produto_id, { ativo: 0 }, admin);
  const cat = await chamar('GET', '/api/produtos');
  assert.ok(!cat.json.produtos.some(p => p.id === r.json.produto_id));
});

test('pedidos não pagos expiram e devolvem o estoque', async () => {
  const token = await criarUsuario('exp@teste.com');
  const antes = await estoque(3);
  const r = await chamar('POST', '/api/pedidos',
    { itens: [{ id: 3, qtd: 2 }], metodo_pagamento: 'cartao', endereco_entrega: endereco }, token);
  assert.equal(await estoque(3), antes - 2);
  await db.run("UPDATE pedidos SET criado_em = datetime('now', '-3 days') WHERE id = ?", [r.json.pedido_id]);
  await test.app.locals.expirarPedidosPendentes();
  await test.app.locals.expirarPedidosPendentes(); // idempotente
  const p = await db.get('SELECT status FROM pedidos WHERE id = ?', [r.json.pedido_id]);
  assert.equal(p.status, 'cancelado');
  assert.equal(await estoque(3), antes);
});

test('webhook: assinatura, valor, idempotência e estados', async () => {
  const token = await criarUsuario('hook@teste.com');
  const novo = async (item = { id: 8, qtd: 1 }) => (await chamar('POST', '/api/pedidos',
    { itens: [item], metodo_pagamento: 'cartao', endereco_entrega: endereco }, token)).json;

  const original = pagSvc.consultarPagamento;
  const simular = (pedido, status, valor) => {
    pagSvc.consultarPagamento = async id => ({
      id, status, external_reference: String(pedido.pedido_id), transaction_amount: valor ?? pedido.total
    });
  };
  const hook = (id = '555') => chamar('POST', '/api/pagamentos/webhook', { type: 'payment', data: { id } });
  const statusDe = async id => (await db.get('SELECT status, payment_status FROM pedidos WHERE id = ?', [id]));

  try {
    // valor menor que o total: não aprova
    let p = await novo();
    simular(p, 'approved', 1);
    assert.equal((await hook()).status, 200);
    assert.equal((await statusDe(p.pedido_id)).status, 'aguardando_pagamento');

    // aprovado: marca pago e manda e-mail UMA vez, mesmo com webhook repetido
    const antes = emails.aprovado;
    simular(p, 'approved');
    await Promise.all([hook(), hook(), hook()]);
    assert.equal((await statusDe(p.pedido_id)).status, 'pago');
    assert.equal(emails.aprovado - antes, 1);

    // evento atrasado "pending" não rebaixa pedido pago
    simular(p, 'pending');
    await hook();
    assert.equal((await statusDe(p.pedido_id)).status, 'pago');

    // rejected não cancela (cliente pode tentar outro cartão)
    let q = await novo({ id: 9, qtd: 1 });
    simular(q, 'rejected');
    await hook();
    assert.equal((await statusDe(q.pedido_id)).status, 'aguardando_pagamento');

    // cancelled/expirado cancela e devolve estoque
    const e9 = await estoque(9);
    simular(q, 'cancelled');
    await hook();
    assert.equal((await statusDe(q.pedido_id)).status, 'cancelado');
    assert.equal(await estoque(9), e9 + 1);

    // aprovado depois de cancelado: volta a "pago" e baixa o estoque de novo
    simular(q, 'approved');
    await hook();
    assert.equal((await statusDe(q.pedido_id)).status, 'pago');
    assert.equal(await estoque(9), e9);

    // pagamento inexistente (notificação de teste do MP) responde 200, sem erro
    pagSvc.consultarPagamento = async () => { const e = new Error('nf'); e.status = 404; throw e; };
    assert.equal((await hook('123456')).status, 200);

    // eventos que não são de pagamento são ignorados
    assert.equal((await chamar('POST', '/api/pagamentos/webhook', { type: 'merchant_order', data: { id: '1' } })).status, 200);

    // assinatura HMAC
    config.mp.webhookSecret = 'segredo-de-teste';
    assert.equal((await hook()).status, 401);
    const ts = String(Date.now());
    const reqId = 'req-abc';
    const dataId = 'ABC123';
    const v1 = crypto.createHmac('sha256', 'segredo-de-teste')
      .update(`id:${dataId.toLowerCase()};request-id:${reqId};ts:${ts};`).digest('hex');
    let r = await chamar('POST', '/api/pagamentos/webhook?data.id=' + dataId, { type: 'payment', data: { id: dataId } }, null,
      { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': reqId });
    assert.equal(r.status, 200);
    r = await chamar('POST', '/api/pagamentos/webhook?data.id=' + dataId, { type: 'payment', data: { id: dataId } }, null,
      { 'x-signature': `ts=${ts},v1=${'0'.repeat(64)}`, 'x-request-id': reqId });
    assert.equal(r.status, 401);
  } finally {
    pagSvc.consultarPagamento = original;
    config.mp.webhookSecret = '';
  }
});

test('comerciantes: cadastro gera cupom que funciona; promoções B2B exigem mínimo', async () => {
  let r = await chamar('POST', '/api/comerciantes/cadastro', { nome_negocio: 'X' });
  assert.equal(r.status, 400);
  r = await chamar('POST', '/api/comerciantes/cadastro', {
    nome_negocio: 'Restaurante Sabor', contato_nome: 'Carlos', email: 'rest@teste.com', whatsapp: '(11) 90000-0000', tipo_negocio: 'Restaurante'
  });
  assert.equal(r.status, 200);
  assert.match(r.json.cupom_gerado, /^PARCEIRO20-[0-9A-F]{4}$/);
  const v = await chamar('POST', '/api/cupons/validar', { codigo: r.json.cupom_gerado, itens: [{ id: 1, qtd: 1 }] });
  assert.equal(v.json.percentual, 20);
  assert.equal((await chamar('POST', '/api/cupons/validar', { codigo: 'PARCEIRO20-FFFF' })).json.sucesso, false);

  const b2b = await chamar('POST', '/api/cupons/validar', { codigo: 'REVENDAVERDE25', itens: [{ id: 4, qtd: 5 }] });
  assert.equal(b2b.json.sucesso, false);
  assert.match(b2b.json.mensagem, /mínimo 20 unidades/);
  const ok = await chamar('POST', '/api/cupons/validar', { codigo: 'REVENDAVERDE25', itens: [{ id: 4, qtd: 20 }] });
  assert.equal(ok.json.percentual, 25);

  r = await chamar('GET', '/api/comerciantes/promocoes');
  assert.ok(r.json.promocoes.length >= 1);
});

test('e-mails escapam HTML do nome do cliente', () => {
  assert.equal(emailSvc.esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});
