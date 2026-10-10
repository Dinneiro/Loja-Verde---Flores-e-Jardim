'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../catalog');

test('catálogo tem 47 produtos e ids únicos', () => {
  assert.equal(catalog.length, 47);
  assert.equal(new Set(catalog.map(p => p.id)).size, catalog.length);
  assert.deepEqual(catalog.map(p => p.id).sort((a,b) => a-b), Array.from({length: 47}, (_, i) => i + 1));
});

test('todos os produtos possuem campos mínimos válidos', () => {
  for (const p of catalog) {
    assert.ok(typeof p.nome === 'string' && p.nome.trim().length >= 2, `nome inválido no ID ${p.id}`);
    assert.ok(typeof p.categoria === 'string' && p.categoria.trim(), `categoria inválida no ID ${p.id}`);
    assert.ok(Number.isFinite(p.preco) && p.preco > 0, `preço inválido no ID ${p.id}`);
    assert.ok(Number.isInteger(p.estoque) && p.estoque >= 0, `estoque inválido no ID ${p.id}`);
    assert.ok(typeof p.imagem === 'string' && /^https:\/\//.test(p.imagem), `imagem inválida no ID ${p.id}`);
    assert.ok(p.cuidados && p.cuidados.luz && p.cuidados.agua, `cuidados incompletos no ID ${p.id}`);
  }
});

test('há exatamente 30 plantas novas no intervalo de IDs 18 a 47', () => {
  assert.equal(catalog.filter(p => p.id >= 18 && p.id <= 47).length, 30);
});
