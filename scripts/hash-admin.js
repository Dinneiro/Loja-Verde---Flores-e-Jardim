const bcrypt = require('bcryptjs');

const senha = process.argv[2];
if (!senha || senha.length < 12) {
  console.error('Uso: npm run hash-admin -- "SuaSenhaComPeloMenos12Caracteres"');
  process.exit(1);
}

bcrypt.hash(senha, 12).then(hash => {
  console.log('\nCopie a linha abaixo para o seu arquivo .env.');
  console.log('IMPORTANTE: se o hash tiver "$", mantenha as ASPAS SIMPLES, senão o dotenv corrompe o valor.\n');
  console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
});
