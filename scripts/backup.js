// Backup consistente do SQLite (funciona com o servidor rodando e com WAL ativo).
const fs = require('fs');
const path = require('path');
const config = require('../config');
const dbLib = require('../lib/db');

(async () => {
  if (!fs.existsSync(config.dbPath)) {
    console.error('❌ Banco não encontrado em', config.dbPath);
    process.exit(1);
  }
  fs.mkdirSync(config.backup.dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destino = path.join(config.backup.dir, `loja_verde_${stamp}.db`);

  const db = dbLib.abrir(config.dbPath);
  await db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
  await db.close();
  console.log('✅ Backup criado:', destino);

  const limiteMs = config.backup.retentionDays * 86400000;
  for (const f of fs.readdirSync(config.backup.dir)) {
    if (!/^loja_verde_.*\.db$/.test(f)) continue;
    const p = path.join(config.backup.dir, f);
    if (Date.now() - fs.statSync(p).mtimeMs > limiteMs) {
      fs.unlinkSync(p);
      console.log('🗑️  Removido backup antigo:', f);
    }
  }
})().catch(e => { console.error('❌ Falha no backup:', e.message); process.exit(1); });
