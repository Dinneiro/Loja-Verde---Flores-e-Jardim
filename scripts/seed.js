// Uso:
//   npm run seed            -> cria o catálogo inicial só se a tabela de produtos estiver vazia
//   npm run seed -- --reset -> APAGA todos os produtos e recria o catálogo inicial
const config = require('../config');
const dbLib = require('../lib/db');

(async () => {
  const db = dbLib.abrir(config.dbPath);
  await dbLib.iniciarEsquema(db); // já semeia se estiver vazio

  if (process.argv.includes('--reset')) {
    await db.run('DELETE FROM produtos');
    await db.run("DELETE FROM sqlite_sequence WHERE name = 'produtos'");
    await dbLib.inserirProdutosSeed(db);
    console.log('✅ Catálogo recriado (--reset).');
  } else {
    const { total } = await db.get('SELECT COUNT(*) AS total FROM produtos');
    console.log(`✅ Banco pronto. Produtos cadastrados: ${total}. (Use --reset para recriar o catálogo.)`);
  }
  await db.close();
})().catch(e => { console.error('❌', e.message); process.exit(1); });
