const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

function abrir(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const raw = new sqlite3.Database(dbPath);

  const run = (sql, params = []) => new Promise((resolve, reject) => {
    raw.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
  const get = (sql, params = []) => new Promise((resolve, reject) => {
    raw.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
  const all = (sql, params = []) => new Promise((resolve, reject) => {
    raw.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  const exec = (sql) => new Promise((resolve, reject) => {
    raw.exec(sql, err => (err ? reject(err) : resolve()));
  });
  const close = () => new Promise(resolve => raw.close(() => resolve()));

  return { raw, run, get, all, exec, close };
}

async function garantirColuna(db, tabela, coluna, definicao) {
  const cols = await db.all(`PRAGMA table_info(${tabela})`);
  if (!cols.some(c => c.name === coluna)) {
    await db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
  }
}

async function iniciarEsquema(db) {
  await db.exec('PRAGMA journal_mode = WAL');
  await db.exec('PRAGMA foreign_keys = ON');
  await db.exec('PRAGMA busy_timeout = 5000');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      email_verificado INTEGER DEFAULT 0,
      codigo_verificacao TEXT,
      codigo_expira_em TEXT,
      codigo_tentativas INTEGER DEFAULT 0,
      token_recuperacao_hash TEXT,
      token_recuperacao_expira TEXT,
      role TEXT DEFAULT 'cliente',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      descricao TEXT,
      preco REAL NOT NULL,
      preco_original REAL,
      imagem TEXT,
      estoque INTEGER NOT NULL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      cliente_nome TEXT NOT NULL,
      cliente_email TEXT NOT NULL,
      cliente_whatsapp TEXT,
      itens_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      cupom TEXT,
      desconto_cupom REAL DEFAULT 0,
      desconto_pix REAL DEFAULT 0,
      frete REAL DEFAULT 0,
      total REAL NOT NULL,
      metodo_pagamento TEXT,
      payment_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      endereco_entrega TEXT,
      data_entrega_desejada TEXT,
      mensagem_cartao TEXT,
      codigo_rastreio TEXT,
      status TEXT DEFAULT 'aguardando_pagamento',
      estoque_devolvido INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    );
    CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id);
    CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status, criado_em);
    CREATE TABLE IF NOT EXISTS comerciantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_negocio TEXT NOT NULL,
      contato_nome TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      cnpj_cpf TEXT,
      tipo_negocio TEXT,
      cupom_gerado TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'ativo',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS promocoes_comerciantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      cupom TEXT NOT NULL,
      desconto_pct INTEGER NOT NULL,
      minimo_unidades INTEGER DEFAULT 10,
      valido_ate TEXT,
      ativo INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS visitantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pagina TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ator TEXT,
      acao TEXT NOT NULL,
      detalhes TEXT,
      ip TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações leves para bancos criados por versões anteriores deste projeto.
  await garantirColuna(db, 'pedidos', 'estoque_devolvido', 'INTEGER DEFAULT 0');
  await garantirColuna(db, 'usuarios', 'codigo_tentativas', 'INTEGER DEFAULT 0');

  await semearPromocoes(db);
  await semearProdutosSeVazio(db);
}

async function semearPromocoes(db) {
  const { total } = await db.get('SELECT COUNT(*) AS total FROM promocoes_comerciantes');
  if (total > 0) return;
  const promos = [
    ['Lote Restaurante — Ervas e Temperos', 'Caixa com 20 mudas selecionadas (Manjericão, Alecrim, Hortelã)', 'REVENDAVERDE25', 25, 20, '2026-12-31'],
    ['Lote Condomínios & Escritórios', 'Plantas purificadoras de ar em vasos (Zamioculcas, Jibóias, Espadas)', 'VERDECORP30', 30, 15, '2026-12-31'],
    ['Especial Floriculturas — Finados & Eventos', 'Caixas com Crisântemos e Kalanchoes com selo anti-dengue', 'ATACADOFINADOS', 35, 30, '2026-11-02']
  ];
  for (const p of promos) {
    await db.run(
      'INSERT INTO promocoes_comerciantes (titulo, descricao, cupom, desconto_pct, minimo_unidades, valido_ate) VALUES (?, ?, ?, ?, ?, ?)',
      p
    );
  }
}

function lerSeed() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf8'));
}

async function inserirProdutosSeed(db) {
  for (const p of lerSeed()) {
    await db.run(
      `INSERT INTO produtos (id, nome, categoria, descricao, preco, preco_original, imagem, estoque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.id, p.nome, p.categoria, p.descricao, p.preco, p.preco_original, p.imagem, p.estoque]
    );
  }
}

async function semearProdutosSeVazio(db) {
  const { total } = await db.get('SELECT COUNT(*) AS total FROM produtos');
  if (total > 0) return false;
  await inserirProdutosSeed(db);
  console.log('🌱 Catálogo inicial criado a partir de lib/seed-data.json');
  return true;
}

module.exports = { abrir, iniciarEsquema, inserirProdutosSeed, semearProdutosSeVazio };
