'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const frontend = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('front-end gates cart, add-to-cart, and VIP page behind a verified account session', () => {
  assert.match(frontend, /function contaAutenticada\(\)[\s\S]*?sessionStorage\.getItem\(AUTH_TOKEN_KEY\)/);
  assert.match(frontend, /page === "carrinho" && !exigirConta\("visualizar seu carrinho"/);
  assert.match(frontend, /page === "comerciantes" && !exigirConta\("acessar Comerciantes & Grupo VIP"/);
  assert.match(frontend, /function adicionarAoCarrinho\(id, opcoes = \{\}\) \{\s*if \(!exigirConta\("adicionar produtos ao carrinho"/);
  assert.match(frontend, /function renderizarComerciantes\(\) \{\s*if \(!exigirConta\("acessar Comerciantes & Grupo VIP"/);
});

test('cart and checkout storage is scoped to a user, not a shared guest key', () => {
  assert.match(frontend, /function chaveCarrinhoConta\(conta = usuario\)/);
  assert.match(frontend, /carrinho_lv_usuario_\$\{Number\(conta\.id\)\}/);
  assert.match(frontend, /function chaveCheckoutConta\(conta = usuario\)/);
  assert.match(frontend, /checkout_lv_usuario_\$\{Number\(conta\.id\)\}/);
  assert.match(frontend, /if \(!contaAutenticada\(\)\) \{\s*badge\.textContent = "";/);
});

test('server enforces authentication for orders and merchant/VIP APIs', () => {
  assert.match(backend, /app\.post\('\/api\/pedidos',auth,/);
  assert.match(backend, /app\.post\('\/api\/comerciantes\/cadastro',auth,/);
  assert.match(backend, /app\.get\('\/api\/comerciantes\/promocoes',auth,/);
  assert.match(backend, /const usuarioId=req\.user\.id/);
  assert.match(backend, /emailEnviado!==email/);
});
