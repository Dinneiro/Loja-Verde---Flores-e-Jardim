'use strict';
/** Loja Verde — API REST (Node.js + Express + SQLite). */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const catalog = require('./catalog');

// Carrega variáveis de ambiente locais sem depender de pacote adicional.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['\"]|['\"]$/g, '');
  }
}
if (!process.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY.length < 24 || process.env.ADMIN_API_KEY.startsWith('COLOQUE_AQUI')) {
  process.env.ADMIN_API_KEY = crypto.randomBytes(32).toString('hex');
  let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  env = env.replace(/^ADMIN_API_KEY=.*$/m, '').trim();
  fs.writeFileSync(envPath, `${env}${env ? '\n' : ''}ADMIN_API_KEY=${process.env.ADMIN_API_KEY}\n`, { mode: 0o600 });
  console.log('\n[ADMIN] Chave administrativa criada e salva no arquivo .env:');
  console.log(process.env.ADMIN_API_KEY);
  console.log('Guarde-a em local seguro; ela não será exibida novamente.\n');
}
if (!process.env.OTP_SECRET || process.env.OTP_SECRET.length < 32) {
  process.env.OTP_SECRET = crypto.randomBytes(48).toString('hex');
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = current.split(/\r?\n/).filter(line => !/^\s*OTP_SECRET\s*=/.test(line));
  fs.writeFileSync(envPath, `${lines.join('\n').trim()}\nOTP_SECRET=${process.env.OTP_SECRET}\n`, { mode: 0o600 });
  console.log('[EMAIL] Segredo local de verificação criado e salvo em .env.');
}

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || '127.0.0.1';
// Banco privado fora do diretório público servido pelo Express.
const DB_DIR = path.join(__dirname, '.data');
const LEGACY_DB_FILE = path.join(__dirname, 'database', 'loja_verde.db');
const DB_FILE = path.join(DB_DIR, 'loja_verde.db');
fs.mkdirSync(DB_DIR, { recursive: true });
// Migra o banco antigo, se existir, sem apagar pedidos já registrados.
if (!fs.existsSync(DB_FILE) && fs.existsSync(LEGACY_DB_FILE)) {
  fs.copyFileSync(LEGACY_DB_FILE, DB_FILE);
  console.log('[DB] Banco antigo migrado para a pasta privada .data.');
}
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use('/api', (req, res, next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ sucesso:false, mensagem:'Envie o conteúdo como application/json.' });
  }
  next();
});
const db = new sqlite3.Database(DB_FILE);
db.configure('busyTimeout', 5000);
const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql,params,function(e){e?reject(e):resolve({lastID:this.lastID,changes:this.changes});}));
const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql,params,(e,row)=>e?reject(e):resolve(row)));
const all = (sql, params=[]) => new Promise((resolve,reject)=>db.all(sql,params,(e,rows)=>e?reject(e):resolve(rows)));
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const publicUser = u => ({ id:u.id, nome:u.nome, email:u.email, telefone:u.telefone || '', receber_novidades:!!u.receber_novidades, email_verificado:!!u.email_verificado, role:u.role || 'cliente' });
const money = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

async function initDb(){
  await run(`CREATE TABLE IF NOT EXISTS visitantes(id INTEGER PRIMARY KEY AUTOINCREMENT, ip TEXT, user_agent TEXT, pagina TEXT, data_hora TEXT DEFAULT CURRENT_TIMESTAMP, visitas_acumuladas INTEGER DEFAULT 1)`);
  await run(`CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha_hash TEXT NOT NULL, salt TEXT NOT NULL, codigo_verificacao TEXT, codigo_verificacao_hash TEXT, codigo_verificacao_expira INTEGER, codigo_tentativas INTEGER NOT NULL DEFAULT 0, codigo_enviado_em INTEGER, codigo_janela_inicio INTEGER, codigo_envios_janela INTEGER NOT NULL DEFAULT 0, codigo_reset_hash TEXT, codigo_reset_expira INTEGER, codigo_reset_tentativas INTEGER NOT NULL DEFAULT 0, reset_enviado_em INTEGER, reset_janela_inicio INTEGER, reset_envios_janela INTEGER NOT NULL DEFAULT 0, email_verificado INTEGER DEFAULT 0, telefone TEXT DEFAULT '', receber_novidades INTEGER NOT NULL DEFAULT 0, token_sessao TEXT, role TEXT DEFAULT 'cliente', password_scheme TEXT DEFAULT 'scrypt', criado_em TEXT DEFAULT CURRENT_TIMESTAMP)`);
  const cols = await all('PRAGMA table_info(usuarios)');
  const userColumns = [
    ['role', "TEXT DEFAULT 'cliente'"], ['password_scheme', "TEXT DEFAULT 'legacy-sha256'"],
    ['codigo_verificacao_hash','TEXT'], ['codigo_verificacao_expira','INTEGER'], ['codigo_tentativas','INTEGER NOT NULL DEFAULT 0'],
    ['codigo_enviado_em','INTEGER'], ['codigo_janela_inicio','INTEGER'], ['codigo_envios_janela','INTEGER NOT NULL DEFAULT 0'],
    ['codigo_reset_hash','TEXT'], ['codigo_reset_expira','INTEGER'], ['codigo_reset_tentativas','INTEGER NOT NULL DEFAULT 0'],
    ['reset_enviado_em','INTEGER'], ['reset_janela_inicio','INTEGER'], ['reset_envios_janela','INTEGER NOT NULL DEFAULT 0'],
    ['telefone',"TEXT DEFAULT ''"], ['receber_novidades','INTEGER NOT NULL DEFAULT 0']
  ];
  for (const [name,type] of userColumns) if(!cols.some(c=>c.name===name)) await run(`ALTER TABLE usuarios ADD COLUMN ${name} ${type}`);
  await run(`CREATE TABLE IF NOT EXISTS comerciantes(id INTEGER PRIMARY KEY AUTOINCREMENT, nome_negocio TEXT NOT NULL, contato_nome TEXT NOT NULL, email TEXT NOT NULL, whatsapp TEXT NOT NULL, cnpj_cpf TEXT, tipo_negocio TEXT, cupom_gerado TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'pendente', criado_em TEXT DEFAULT CURRENT_TIMESTAMP, user_id INTEGER REFERENCES usuarios(id))`);
  const merchantCols = await all('PRAGMA table_info(comerciantes)');
  if (!merchantCols.some(c => c.name === 'user_id')) await run('ALTER TABLE comerciantes ADD COLUMN user_id INTEGER');
  await run(`CREATE TABLE IF NOT EXISTS promocoes_comerciantes(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descricao TEXT NOT NULL, cupom TEXT NOT NULL, desconto_pct INTEGER NOT NULL, minimo_unidades INTEGER DEFAULT 10, valido_ate TEXT, ativo INTEGER DEFAULT 1, criado_em TEXT DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS produtos(id INTEGER PRIMARY KEY, nome TEXT NOT NULL, categoria TEXT NOT NULL, preco_centavos INTEGER NOT NULL, preco_original_centavos INTEGER, estoque INTEGER NOT NULL DEFAULT 0, imagem TEXT NOT NULL, descricao TEXT, produtor TEXT NOT NULL DEFAULT 'Loja Verde', ativo INTEGER NOT NULL DEFAULT 1, atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP)`);
  const productCols = await all('PRAGMA table_info(produtos)');
  if (!productCols.some(c => c.name === 'produtor')) await run("ALTER TABLE produtos ADD COLUMN produtor TEXT NOT NULL DEFAULT 'Loja Verde'");
  await run(`CREATE TABLE IF NOT EXISTS pedidos(id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT UNIQUE NOT NULL, usuario_id INTEGER, cliente_nome TEXT, cliente_email TEXT, cliente_telefone TEXT, endereco TEXT, bairro TEXT, cidade TEXT, uf TEXT, cep TEXT, itens_json TEXT NOT NULL, subtotal_centavos INTEGER NOT NULL, desconto_centavos INTEGER NOT NULL DEFAULT 0, frete_centavos INTEGER NOT NULL DEFAULT 0, total_centavos INTEGER NOT NULL, metodo_pagamento TEXT NOT NULL, data_entrega TEXT, mensagem_cartao TEXT, cupom TEXT, status TEXT DEFAULT 'recebido', criado_em TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(usuario_id) REFERENCES usuarios(id))`);
  const pedidoCols = await all('PRAGMA table_info(pedidos)');
  for (const [name, type] of [['cliente_telefone','TEXT'],['endereco','TEXT'],['bairro','TEXT'],['cidade','TEXT'],['uf','TEXT'],['cep','TEXT']]) {
    if (!pedidoCols.some(c => c.name === name)) await run(`ALTER TABLE pedidos ADD COLUMN ${name} ${type}`);
  }
  await run("UPDATE pedidos SET status='recebido' WHERE status='aguardando_contato'");
  await run(`CREATE TABLE IF NOT EXISTS pedido_itens(id INTEGER PRIMARY KEY AUTOINCREMENT, pedido_id INTEGER NOT NULL, produto_id INTEGER NOT NULL, nome_produto TEXT NOT NULL, quantidade INTEGER NOT NULL, preco_unit_centavos INTEGER NOT NULL, FOREIGN KEY(pedido_id) REFERENCES pedidos(id))`);
  await run(`CREATE TABLE IF NOT EXISTS avaliacoes_produtos(id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER NOT NULL, usuario_id INTEGER NOT NULL, nota_produto INTEGER NOT NULL CHECK(nota_produto BETWEEN 1 AND 5), nota_produtor INTEGER NOT NULL CHECK(nota_produtor BETWEEN 1 AND 5), comentario TEXT NOT NULL DEFAULT '', criado_em TEXT DEFAULT CURRENT_TIMESTAMP, atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(produto_id,usuario_id), FOREIGN KEY(produto_id) REFERENCES produtos(id), FOREIGN KEY(usuario_id) REFERENCES usuarios(id))`);
  await run(`CREATE TABLE IF NOT EXISTS configuracoes(chave TEXT PRIMARY KEY, valor TEXT NOT NULL, atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP)`);
  const settings = { nome_loja:'Loja Verde', email_contato:'contato@lojaverde.com.br', whatsapp:'5511999999999', frete_gratis_acima:'99', frete_valor:'15', desconto_cupom:'10', aviso_topo:'Frete grátis acima de R$ 99 • Pix com 5% de desconto • Cupom VERDE10 na primeira compra' };
  for (const [chave, valor] of Object.entries(settings)) await run('INSERT OR IGNORE INTO configuracoes(chave,valor) VALUES(?,?)',[chave,valor]);
  // Insere produtos novos (incluindo a expansão do catálogo) sem sobrescrever preços/estoque editados no admin.
  for(const p of catalog){
    await run(`INSERT OR IGNORE INTO produtos(id,nome,categoria,preco_centavos,preco_original_centavos,estoque,imagem,descricao,produtor) VALUES(?,?,?,?,?,?,?,?,?)`,
      [p.id,p.nome,p.categoria,Math.round(p.preco*100),p.precoOriginal?Math.round(p.precoOriginal*100):null,Math.max(0,Number(p.estoque)||0),p.imagem||'',p.descricao||'',String(p.vendedor||'Loja Verde').slice(0,120)]);
  }
  // Mantém o vendedor/fornecedor do catálogo inicial nos bancos migrados.
  for (const p of catalog) {
    if (p.vendedor) await run("UPDATE produtos SET produtor=? WHERE id=? AND (produtor IS NULL OR produtor='' OR produtor='Loja Verde')", [String(p.vendedor).slice(0,120), Number(p.id)]);
  }
  const promoCount = await get('SELECT COUNT(*) AS n FROM promocoes_comerciantes');
  if(!promoCount.n){
    const promos=[['Lote Restaurante — Ervas e Temperos','Caixa com 20 mudas selecionadas (Manjericão, Alecrim, Hortelã)','REVENDAVERDE25',25,20,'2026-12-31'],['Lote Condomínios & Escritórios','Plantas para vasos e ambientes internos','VERDECORP30',30,15,'2026-12-31'],['Especial Floriculturas — Finados & Eventos','Caixas com flores para homenagens e eventos','ATACADOFINADOS',35,30,'2026-11-02']];
    for(const p of promos) await run('INSERT INTO promocoes_comerciantes(titulo,descricao,cupom,desconto_pct,minimo_unidades,valido_ate) VALUES(?,?,?,?,?,?)',p);
  }
}
function hashPassword(password, salt=crypto.randomBytes(16).toString('hex')){
  return new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(e,buf)=>e?reject(e):resolve({hash:buf.toString('hex'),salt})));
}
function constantTimeEqual(a,b){const x=Buffer.from(String(a));const y=Buffer.from(String(b));return x.length===y.length && crypto.timingSafeEqual(x,y);}
function hashOtp(purpose,email,code){return crypto.createHmac('sha256',process.env.OTP_SECRET).update(`${purpose}:${String(email).trim().toLowerCase()}:${String(code).trim()}`).digest('hex');}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function emailProviderConfigured(){return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);}
async function sendTransactionalEmail({to,name,code,purpose='verification'}){
  if(!emailProviderConfigured()) return {sent:false};
  const isReset=purpose==='reset';
  const safeName=escapeHtml(name||'cliente');
  const subject=isReset?'Redefinição de senha — Loja Verde':'Confirme seu e-mail — Loja Verde';
  const intro=isReset?'Use o código abaixo para redefinir sua senha:':'Use o código abaixo para confirmar seu e-mail e ativar sua conta:';
  const text=`Olá, ${name||'cliente'}!\n\n${intro}\n\nCódigo: ${code}\n\nO código expira em 10 minutos. Se você não solicitou esta mensagem, ignore este e-mail.\n\nLoja Verde`;
  const html=`<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5f7f2;font-family:Arial,sans-serif;color:#173f2e;padding:28px"><div style="max-width:520px;margin:auto;background:#fff;border-radius:18px;padding:30px;border:1px solid #e4eadf"><p style="font-size:12px;letter-spacing:2px;font-weight:bold;color:#247447">LOJA VERDE</p><h1 style="font-size:24px">${isReset?'Redefina sua senha':'Confirme seu e-mail'}</h1><p>Olá, ${safeName}!</p><p>${intro}</p><div style="text-align:center;background:#edf4e9;border-radius:12px;padding:18px;font-size:32px;font-weight:bold;letter-spacing:8px">${escapeHtml(code)}</div><p>Este código expira em <strong>10 minutos</strong>.</p><p style="font-size:13px;color:#66736b">Se você não solicitou esta mensagem, ignore este e-mail. Não compartilhe seu código com ninguém.</p></div></body></html>`;
  let response;
  try {
    response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,text,html}),signal:AbortSignal.timeout(12_000)});
  } catch {
    const error=new Error('Serviço de e-mail indisponível. Tente novamente em alguns minutos.');
    error.status=502;
    throw error;
  }
  const body=await response.json().catch(()=>({}));
  if(!response.ok){console.error(`[EMAIL] O provedor recusou o envio (HTTP ${response.status}).`);const error=new Error('Não foi possível enviar o e-mail agora. Confira as configurações do provedor e tente novamente.');error.status=502;throw error;}
  return {sent:true,id:body.id||null};
}
const rateLimitBuckets = new Map();
function rateLimit(name, max, windowMs){return (req,res,next)=>{
  const now=Date.now();const ip=(req.socket.remoteAddress||'unknown').replace(/^::ffff:/,'');const key=`${name}:${ip}`;let b=rateLimitBuckets.get(key);
  if(!b||now-b.start>=windowMs){b={start:now,count:0};rateLimitBuckets.set(key,b);}b.count++;
  if(rateLimitBuckets.size>5000){for(const [k,v] of rateLimitBuckets)if(now-v.start>60*60*1000)rateLimitBuckets.delete(k);}
  if(b.count>max){res.setHeader('Retry-After',Math.max(1,Math.ceil((windowMs-(now-b.start))/1000)));return res.status(429).json({sucesso:false,mensagem:'Muitas tentativas. Aguarde um pouco e tente novamente.'});}
  next();
};}
async function auth(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token) return res.status(401).json({sucesso:false,mensagem:'Faça login para continuar.'});
  try { const u=await get('SELECT id,nome,email,telefone,receber_novidades,email_verificado,role FROM usuarios WHERE token_sessao=?',[token]); if(!u)return res.status(401).json({sucesso:false,mensagem:'Sessão inválida ou expirada.'}); if(!u.email_verificado)return res.status(403).json({sucesso:false,mensagem:'Verifique seu e-mail antes de continuar.'}); req.user=u; next(); }
  catch(e){next(e);}
}
function admin(req,res,next){
  const configured=process.env.ADMIN_API_KEY;
  const supplied=(req.headers['x-admin-key']||'').toString();
  if(!configured || configured.length<24) return res.status(503).json({sucesso:false,mensagem:'Configure ADMIN_API_KEY no arquivo .env antes de usar a administração.'});
  if(!constantTimeEqual(supplied,configured)) return res.status(403).json({sucesso:false,mensagem:'Chave administrativa inválida.'});
  next();
}

async function lerConfiguracoes(){
  const rows = await all('SELECT chave,valor FROM configuracoes');
  return Object.fromEntries(rows.map(r => [r.chave, r.valor]));
}
const produtoPublico = p => ({
  id:p.id, nome:p.nome, categoria:p.categoria, preco:Number(p.preco_centavos)/100,
  precoOriginal:p.preco_original_centavos == null ? null : Number(p.preco_original_centavos)/100,
  estoque:Number(p.estoque), imagem:p.imagem || '', descricao:p.descricao || '', vendedor:p.produtor || 'Loja Verde', ativo:!!p.ativo
});
app.get('/api/health', async (req,res)=>{try{await get('SELECT 1 AS ok');res.json({sucesso:true,servico:'Loja Verde API',banco:'conectado',email_verificacao:emailProviderConfigured()?'configurado':'modo_desenvolvimento_sem_envio_real',pagamento:'gateway_nao_configurado'});}catch{res.status(503).json({sucesso:false,mensagem:'Banco indisponível'});}});
app.get('/api/configuracoes/publicas', async(req,res,next)=>{try{const c=await lerConfiguracoes();const limite=Number(c.frete_gratis_acima),frete=Number(c.frete_valor),desconto=Number(c.desconto_cupom);res.json({sucesso:true,configuracoes:{nome_loja:c.nome_loja||'Loja Verde',email_contato:c.email_contato||'',whatsapp:c.whatsapp||'',frete_gratis_acima:Number.isFinite(limite)?limite:99,frete_valor:Number.isFinite(frete)?frete:15,desconto_cupom:Number.isFinite(desconto)?desconto:10,aviso_topo:c.aviso_topo||''}});}catch(e){next(e);}});
app.get('/api/produtos', async(req,res,next)=>{try{const rows=await all('SELECT id,nome,categoria,preco_centavos,preco_original_centavos,estoque,imagem,descricao,produtor,ativo FROM produtos WHERE ativo=1 ORDER BY id');res.json({sucesso:true,produtos:rows.map(produtoPublico)});}catch(e){next(e);}});
app.get('/api/produtos/:id/avaliacoes', async(req,res,next)=>{try{
  const produtoId=Number(req.params.id);
  if(!Number.isInteger(produtoId)||produtoId<1)return res.status(400).json({sucesso:false,mensagem:'Produto inválido.'});
  const produto=await get('SELECT id,produtor FROM produtos WHERE id=? AND ativo=1',[produtoId]);
  if(!produto)return res.status(404).json({sucesso:false,mensagem:'Produto não encontrado.'});
  const resumo=await get('SELECT COUNT(*) AS total, AVG(nota_produto) AS media_produto FROM avaliacoes_produtos WHERE produto_id=?',[produtoId]);
  const resumoProdutor=await get('SELECT COUNT(a.id) AS total, AVG(a.nota_produtor) AS media FROM avaliacoes_produtos a JOIN produtos p ON p.id=a.produto_id WHERE p.produtor=?',[produto.produtor]);
  const avaliacoes=await all('SELECT a.nota_produto,a.nota_produtor,a.comentario,a.criado_em,u.nome AS autor FROM avaliacoes_produtos a JOIN usuarios u ON u.id=a.usuario_id WHERE a.produto_id=? ORDER BY a.criado_em DESC,a.id DESC LIMIT 50',[produtoId]);
  res.json({sucesso:true,resumo:{total:Number(resumo.total||0),media_produto:resumo.media_produto==null?null:Number(Number(resumo.media_produto).toFixed(2)),media_produtor:resumoProdutor.media==null?null:Number(Number(resumoProdutor.media).toFixed(2)),total_produtor:Number(resumoProdutor.total||0),produtor:produto.produtor},avaliacoes});
}catch(e){next(e);}});
app.post('/api/produtos/:id/avaliacoes',auth,async(req,res,next)=>{try{
  const produtoId=Number(req.params.id), notaProduto=Number(req.body.nota_produto), notaProdutor=Number(req.body.nota_produtor), comentario=String(req.body.comentario||'').trim();
  if(!Number.isInteger(produtoId)||produtoId<1)return res.status(400).json({sucesso:false,mensagem:'Produto inválido.'});
  if(!Number.isInteger(notaProduto)||notaProduto<1||notaProduto>5||!Number.isInteger(notaProdutor)||notaProdutor<1||notaProdutor>5)return res.status(400).json({sucesso:false,mensagem:'Escolha notas de 1 a 5 para o produto e o produtor.'});
  if(comentario.length>1000)return res.status(400).json({sucesso:false,mensagem:'O comentário pode ter até 1000 caracteres.'});
  const produto=await get('SELECT id FROM produtos WHERE id=? AND ativo=1',[produtoId]);
  if(!produto)return res.status(404).json({sucesso:false,mensagem:'Produto não encontrado.'});
  await run('INSERT INTO avaliacoes_produtos(produto_id,usuario_id,nota_produto,nota_produtor,comentario) VALUES(?,?,?,?,?) ON CONFLICT(produto_id,usuario_id) DO UPDATE SET nota_produto=excluded.nota_produto,nota_produtor=excluded.nota_produtor,comentario=excluded.comentario,criado_em=CURRENT_TIMESTAMP,atualizado_em=CURRENT_TIMESTAMP',[produtoId,req.user.id,notaProduto,notaProdutor,comentario]);
  res.status(201).json({sucesso:true,mensagem:'Avaliação registrada. Você pode atualizar sua avaliação enviando outra.'});
}catch(e){next(e);}});

app.post('/api/visitante/rastrear',async(req,res,next)=>{try{const pagina=String(req.body.pagina||'home').slice(0,200);const ip=(req.socket.remoteAddress||'desconhecido').slice(0,80);const ua=String(req.get('user-agent')||'').slice(0,300);await run('INSERT INTO visitantes(ip,user_agent,pagina) VALUES(?,?,?)',[ip,ua,pagina]);res.json({sucesso:true});}catch(e){next(e);}});
app.post('/api/auth/registrar',rateLimit('auth-register',10,60*60*1000),async(req,res,next)=>{try{
  const nome=String(req.body.nome||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),senha=String(req.body.senha||'');
  const telefone=String(req.body.telefone||'').replace(/\D/g,'').slice(0,15),aceitaTermos=['on','true','1',true].includes(req.body.aceita_termos),receberNovidades=['on','true','1',true].includes(req.body.receber_novidades);
  if(nome.length<2||nome.length>120||!emailOk(email)||senha.length<10||senha.length>200||!aceitaTermos||(telefone&&telefone.length<10))return res.status(400).json({sucesso:false,mensagem:'Informe nome, e-mail válido, senha com pelo menos 10 caracteres, aceite os termos e confira o telefone.'});
  if(process.env.NODE_ENV==='production'&&!emailProviderConfigured())return res.status(503).json({sucesso:false,mensagem:'O envio de e-mail não está configurado. Configure RESEND_API_KEY e EMAIL_FROM no .env antes de ativar novos cadastros.'});
  if(await get('SELECT id FROM usuarios WHERE email=?',[email]))return res.status(409).json({sucesso:false,mensagem:'Este e-mail já está cadastrado. Entre na conta ou use “Reenviar código”.'});
  const {hash,salt}=await hashPassword(senha),otp=String(crypto.randomInt(100000,1000000)),now=Date.now(),otpHash=hashOtp('verify',email,otp);
  const result=await run('INSERT INTO usuarios(nome,email,senha_hash,salt,codigo_verificacao,codigo_verificacao_hash,codigo_verificacao_expira,codigo_tentativas,codigo_enviado_em,codigo_janela_inicio,codigo_envios_janela,email_verificado,telefone,receber_novidades,password_scheme) VALUES(?,?,?,?,NULL,?,?,0,?,?,1,0,?,?,?)',[nome,email,hash,salt,otpHash,now+10*60*1000,now,now,telefone,receberNovidades?1:0,'scrypt']);
  let envio={sent:false};
  try{envio=await sendTransactionalEmail({to:email,name:nome,code:otp,purpose:'verification'});}catch(e){await run('DELETE FROM usuarios WHERE id=? AND email_verificado=0',[result.lastID]).catch(()=>{});return res.status(e.status||502).json({sucesso:false,mensagem:e.message||'Não foi possível enviar o código por e-mail.'});}
  const resposta={sucesso:true,usuario_id:result.lastID,email,mensagem:envio.sent?'Enviamos um código de verificação para seu e-mail. Ele expira em 10 minutos.':'Conta criada em modo de demonstração. Use o código exibido apenas localmente.'};
  if(!envio.sent&&process.env.NODE_ENV!=='production')resposta.codigo_simulado=otp;
  res.status(201).json(resposta);
}catch(e){if(e.code==='SQLITE_CONSTRAINT')return res.status(409).json({sucesso:false,mensagem:'Este e-mail já está cadastrado.'});next(e);}});

app.post('/api/auth/verificar-email',rateLimit('auth-verify',20,15*60*1000),async(req,res,next)=>{try{
  const email=String(req.body.email||'').trim().toLowerCase(),codigo=String(req.body.codigo||'').trim();
  if(!emailOk(email)||!/^\d{6}$/.test(codigo))return res.status(400).json({sucesso:false,mensagem:'Informe o e-mail e o código de 6 dígitos.'});
  const u=await get('SELECT id,nome,email,telefone,receber_novidades,email_verificado,codigo_verificacao,codigo_verificacao_hash,codigo_verificacao_expira,codigo_tentativas,role FROM usuarios WHERE email=?',[email]);
  if(!u||u.email_verificado||(!u.codigo_verificacao_hash&&!u.codigo_verificacao))return res.status(400).json({sucesso:false,mensagem:'Código inválido ou expirado. Solicite um novo código.'});
  const tentativas=Number(u.codigo_tentativas||0);if(tentativas>=5){await run('UPDATE usuarios SET codigo_verificacao_hash=NULL,codigo_verificacao=NULL WHERE id=?',[u.id]);return res.status(429).json({sucesso:false,mensagem:'Limite de tentativas atingido. Solicite um novo código.'});}
  if(u.codigo_verificacao_expira&&Number(u.codigo_verificacao_expira)<Date.now()){await run('UPDATE usuarios SET codigo_verificacao_hash=NULL,codigo_verificacao=NULL WHERE id=?',[u.id]);return res.status(400).json({sucesso:false,mensagem:'O código expirou. Solicite um novo código.'});}
  const expected=hashOtp('verify',email,codigo),matches=u.codigo_verificacao_hash?constantTimeEqual(u.codigo_verificacao_hash,expected):constantTimeEqual(u.codigo_verificacao,codigo);
  if(!matches){const next=tentativas+1;await run('UPDATE usuarios SET codigo_tentativas=?,codigo_verificacao_hash=CASE WHEN ?>=5 THEN NULL ELSE codigo_verificacao_hash END,codigo_verificacao=CASE WHEN ?>=5 THEN NULL ELSE codigo_verificacao END WHERE id=?',[next,next,next,u.id]);return res.status(400).json({sucesso:false,mensagem:next>=5?'Limite de tentativas atingido. Solicite um novo código.':'Código incorreto. Confira e tente novamente.'});}
  const token=crypto.randomBytes(32).toString('hex');await run('UPDATE usuarios SET email_verificado=1,codigo_verificacao=NULL,codigo_verificacao_hash=NULL,codigo_verificacao_expira=NULL,codigo_tentativas=0,token_sessao=? WHERE id=?',[token,u.id]);
  res.json({sucesso:true,mensagem:'E-mail verificado com sucesso.',token,usuario:publicUser({...u,email_verificado:1})});
}catch(e){next(e);}});

app.post('/api/auth/reenviar-codigo',rateLimit('auth-resend',20,60*60*1000),async(req,res,next)=>{try{
  const email=String(req.body.email||'').trim().toLowerCase();if(!emailOk(email))return res.status(400).json({sucesso:false,mensagem:'Informe um e-mail válido.'});
  if(process.env.NODE_ENV==='production'&&!emailProviderConfigured())return res.status(503).json({sucesso:false,mensagem:'O serviço de e-mail ainda não está configurado.'});
  const u=await get('SELECT id,nome,email,email_verificado,codigo_enviado_em,codigo_janela_inicio,codigo_envios_janela FROM usuarios WHERE email=?',[email]);
  if(!u||u.email_verificado)return res.status(202).json({sucesso:true,mensagem:'Se a conta existir e ainda precisar de verificação, enviaremos um novo código.'});
  const now=Date.now();if(u.codigo_enviado_em&&now-Number(u.codigo_enviado_em)<60*1000)return res.status(429).json({sucesso:false,mensagem:'Aguarde 60 segundos antes de solicitar outro código.'});
  const janelaValida=u.codigo_janela_inicio&&now-Number(u.codigo_janela_inicio)<60*60*1000;const envios=janelaValida?Number(u.codigo_envios_janela||0):0;if(envios>=5)return res.status(429).json({sucesso:false,mensagem:'Limite de 5 códigos por hora atingido. Tente novamente mais tarde.'});
  const codigo=String(crypto.randomInt(100000,1000000));const envio=await sendTransactionalEmail({to:email,name:u.nome,code:codigo,purpose:'verification'});
  await run('UPDATE usuarios SET codigo_verificacao=NULL,codigo_verificacao_hash=?,codigo_verificacao_expira=?,codigo_tentativas=0,codigo_enviado_em=?,codigo_janela_inicio=?,codigo_envios_janela=? WHERE id=?',[hashOtp('verify',email,codigo),now+10*60*1000,now,janelaValida?u.codigo_janela_inicio:now,envios+1,u.id]);
  const resposta={sucesso:true,mensagem:envio.sent?'Novo código enviado. Confira a caixa de entrada e o spam.':'Código de demonstração gerado localmente.'};if(!envio.sent&&process.env.NODE_ENV!=='production')resposta.codigo_simulado=codigo;res.json(resposta);
}catch(e){next(e);}});

app.post('/api/auth/login',rateLimit('auth-login',12,15*60*1000),async(req,res,next)=>{try{const email=String(req.body.email||'').trim().toLowerCase(),senha=String(req.body.senha||'');const u=await get('SELECT * FROM usuarios WHERE email=?',[email]);if(!u)return res.status(401).json({sucesso:false,mensagem:'E-mail ou senha incorretos.'});let valid=false;if(u.password_scheme==='scrypt'){const result=await hashPassword(senha,u.salt);valid=constantTimeEqual(result.hash,u.senha_hash);}else{const legacy=crypto.createHash('sha256').update(senha+u.salt).digest('hex');valid=constantTimeEqual(legacy,u.senha_hash);if(valid){const n=await hashPassword(senha);await run('UPDATE usuarios SET senha_hash=?,salt=?,password_scheme=? WHERE id=?',[n.hash,n.salt,'scrypt',u.id]);}}if(!valid)return res.status(401).json({sucesso:false,mensagem:'E-mail ou senha incorretos.'});if(!u.email_verificado)return res.status(403).json({sucesso:false,mensagem:'Verifique seu e-mail antes de entrar.'});const token=crypto.randomBytes(32).toString('hex');await run('UPDATE usuarios SET token_sessao=? WHERE id=?',[token,u.id]);res.json({sucesso:true,token,usuario:publicUser(u)});}catch(e){next(e);}});

app.post('/api/auth/solicitar-redefinicao',rateLimit('auth-reset-request',12,60*60*1000),async(req,res,next)=>{try{
  const email=String(req.body.email||'').trim().toLowerCase();if(!emailOk(email))return res.status(400).json({sucesso:false,mensagem:'Informe um e-mail válido.'});
  if(process.env.NODE_ENV==='production'&&!emailProviderConfigured())return res.status(503).json({sucesso:false,mensagem:'O serviço de e-mail ainda não está configurado.'});
  const u=await get('SELECT id,nome,email,email_verificado,reset_enviado_em,reset_janela_inicio,reset_envios_janela FROM usuarios WHERE email=?',[email]);
  if(!u||!u.email_verificado)return res.status(202).json({sucesso:true,mensagem:'Se houver uma conta verificada para este e-mail, enviaremos instruções.'});
  const now=Date.now();if(u.reset_enviado_em&&now-Number(u.reset_enviado_em)<60*1000)return res.status(429).json({sucesso:false,mensagem:'Aguarde 60 segundos antes de solicitar outro código.'});
  const janelaValida=u.reset_janela_inicio&&now-Number(u.reset_janela_inicio)<60*60*1000;const envios=janelaValida?Number(u.reset_envios_janela||0):0;if(envios>=5)return res.status(429).json({sucesso:false,mensagem:'Limite de 5 códigos por hora atingido. Tente novamente mais tarde.'});
  const codigo=String(crypto.randomInt(100000,1000000));const envio=await sendTransactionalEmail({to:email,name:u.nome,code:codigo,purpose:'reset'});
  await run('UPDATE usuarios SET codigo_reset_hash=?,codigo_reset_expira=?,codigo_reset_tentativas=0,reset_enviado_em=?,reset_janela_inicio=?,reset_envios_janela=? WHERE id=?',[hashOtp('reset',email,codigo),now+10*60*1000,now,janelaValida?u.reset_janela_inicio:now,envios+1,u.id]);
  const resposta={sucesso:true,mensagem:'Se houver uma conta verificada para este e-mail, enviaremos instruções.'};if(!envio.sent&&process.env.NODE_ENV!=='production')resposta.codigo_simulado=codigo;res.json(resposta);
}catch(e){next(e);}});

app.post('/api/auth/redefinir-senha',rateLimit('auth-reset-complete',20,15*60*1000),async(req,res,next)=>{try{
  const email=String(req.body.email||'').trim().toLowerCase(),codigo=String(req.body.codigo||'').trim(),senha=String(req.body.senha||'');
  if(!emailOk(email)||!/^\d{6}$/.test(codigo)||senha.length<10||senha.length>200)return res.status(400).json({sucesso:false,mensagem:'Informe e-mail, código de 6 dígitos e senha nova com pelo menos 10 caracteres.'});
  const u=await get('SELECT id,codigo_reset_hash,codigo_reset_expira,codigo_reset_tentativas FROM usuarios WHERE email=? AND email_verificado=1',[email]);if(!u||!u.codigo_reset_hash)return res.status(400).json({sucesso:false,mensagem:'Código inválido ou expirado. Solicite outro.'});
  const tentativas=Number(u.codigo_reset_tentativas||0);if(tentativas>=5){await run('UPDATE usuarios SET codigo_reset_hash=NULL WHERE id=?',[u.id]);return res.status(429).json({sucesso:false,mensagem:'Limite de tentativas atingido. Solicite outro código.'});}
  if(Number(u.codigo_reset_expira||0)<Date.now()){await run('UPDATE usuarios SET codigo_reset_hash=NULL WHERE id=?',[u.id]);return res.status(400).json({sucesso:false,mensagem:'O código expirou. Solicite outro.'});}
  if(!constantTimeEqual(u.codigo_reset_hash,hashOtp('reset',email,codigo))){const n=tentativas+1;await run('UPDATE usuarios SET codigo_reset_tentativas=?,codigo_reset_hash=CASE WHEN ?>=5 THEN NULL ELSE codigo_reset_hash END WHERE id=?',[n,n,u.id]);return res.status(400).json({sucesso:false,mensagem:n>=5?'Limite de tentativas atingido. Solicite outro código.':'Código incorreto.'});}
  const {hash,salt}=await hashPassword(senha);await run('UPDATE usuarios SET senha_hash=?,salt=?,password_scheme=\'scrypt\',token_sessao=NULL,codigo_reset_hash=NULL,codigo_reset_expira=NULL,codigo_reset_tentativas=0 WHERE id=?',[hash,salt,u.id]);res.json({sucesso:true,mensagem:'Senha redefinida. Entre novamente com a nova senha.'});
}catch(e){next(e);}});

app.post('/api/auth/logout',auth,async(req,res,next)=>{try{await run('UPDATE usuarios SET token_sessao=NULL WHERE id=?',[req.user.id]);res.json({sucesso:true});}catch(e){next(e);}});
app.get('/api/auth/me',auth,(req,res)=>res.json({sucesso:true,usuario:publicUser(req.user)}));
app.patch('/api/auth/perfil',auth,async(req,res,next)=>{try{
  const nome=String(req.body.nome||'').trim(),telefone=String(req.body.telefone||'').replace(/\D/g,'').slice(0,15),receber=['on','true','1',true].includes(req.body.receber_novidades);
  if(nome.length<2||nome.length>120||(telefone&&telefone.length<10))return res.status(400).json({sucesso:false,mensagem:'Informe nome válido e confira o telefone.'});
  await run('UPDATE usuarios SET nome=?,telefone=?,receber_novidades=? WHERE id=?',[nome,telefone,receber?1:0,req.user.id]);const u=await get('SELECT id,nome,email,telefone,receber_novidades,email_verificado,role FROM usuarios WHERE id=?',[req.user.id]);res.json({sucesso:true,mensagem:'Perfil atualizado.',usuario:publicUser(u)});
}catch(e){next(e);}});
app.get('/api/auth/pedidos',auth,async(req,res,next)=>{try{
  const pedidos=await all('SELECT codigo,itens_json,total_centavos,metodo_pagamento,status,criado_em FROM pedidos WHERE usuario_id=? ORDER BY id DESC LIMIT 100',[req.user.id]);
  res.json({sucesso:true,pedidos:pedidos.map(p=>({codigo:p.codigo,itens:JSON.parse(p.itens_json),total:p.total_centavos/100,metodo_pagamento:p.metodo_pagamento,status:p.status,criado_em:p.criado_em}))});
}catch(e){next(e);}});
app.post('/api/comerciantes/cadastro',auth,async(req,res,next)=>{try{const nome=String(req.body.nome_negocio||'').trim(), contato=String(req.body.contato_nome||req.user.nome||'').trim(), email=String(req.user.email||'').trim().toLowerCase(), emailEnviado=String(req.body.email||'').trim().toLowerCase(), whatsapp=String(req.body.whatsapp||'').trim();if(emailEnviado&&emailEnviado!==email)return res.status(400).json({sucesso:false,mensagem:'Use o e-mail da conta autenticada para solicitar a parceria.'});if(nome.length<2||contato.length<2||!emailOk(email)||whatsapp.replace(/\D/g,'').length<10)return res.status(400).json({sucesso:false,mensagem:'Confira nome do negócio, contato, e-mail e WhatsApp.'});const cupom='PARCEIRO20-'+crypto.randomBytes(3).toString('hex').toUpperCase();const r=await run('INSERT INTO comerciantes(nome_negocio,contato_nome,email,whatsapp,cnpj_cpf,tipo_negocio,cupom_gerado,user_id) VALUES(?,?,?,?,?,?,?,?)',[nome,contato,email,whatsapp,String(req.body.cnpj_cpf||'').slice(0,30),String(req.body.tipo_negocio||'Outro').slice(0,60),cupom,req.user.id]);res.status(201).json({sucesso:true,comerciante_id:r.lastID,cupom_gerado:cupom,mensagem:'Solicitação recebida. A equipe confirmará a parceria.'});}catch(e){next(e);}});
app.get('/api/comerciantes/promocoes',auth,async(req,res,next)=>{try{const rows=await all('SELECT id,titulo,descricao,cupom,desconto_pct,minimo_unidades,valido_ate FROM promocoes_comerciantes WHERE ativo=1 AND (valido_ate IS NULL OR valido_ate>=date(\'now\')) ORDER BY desconto_pct DESC');res.json({sucesso:true,promocoes:rows});}catch(e){next(e);}});
app.post('/api/pedidos',auth,async(req,res,next)=>{try{
  const usuarioId=req.user.id;
  const itens=req.body.itens;const metodo=String(req.body.metodo_pagamento||'pix').toLowerCase();const cliente=req.body.cliente||{};
  const nome=String(cliente.nome||req.user.nome||'').trim().slice(0,120),email=String(req.user.email||'').trim().toLowerCase(),telefone=String(cliente.telefone||req.user.telefone||'').trim().slice(0,30);
  const endereco=String(cliente.endereco||'').trim().slice(0,200),bairro=String(cliente.bairro||'').trim().slice(0,100),cidade=String(cliente.cidade||'').trim().slice(0,100),uf=String(cliente.uf||'').trim().toUpperCase().slice(0,2),cep=String(cliente.cep||'').replace(/\D/g,'').slice(0,8);
  const dataEntrega=String(req.body.data_entrega||'').slice(0,10),mensagem=String(req.body.mensagem_cartao||'').slice(0,500),cupom=String(req.body.cupom||'').trim().toUpperCase();
  if(nome.length<2||!emailOk(email)||telefone.replace(/\D/g,'').length<10||endereco.length<5||bairro.length<2||cidade.length<2||uf.length!==2||cep.length!==8)return res.status(400).json({sucesso:false,mensagem:'Preencha nome, e-mail, telefone e endereço completo para entregar seu pedido.'});
  if(!Array.isArray(itens)||!itens.length||itens.length>40||!['pix','cartao','boleto'].includes(metodo))return res.status(400).json({sucesso:false,mensagem:'Carrinho ou forma de pagamento inválidos.'});
  const condicoes=new Set(['padrao','agendada','retirada']), linhas=[],quantidades=new Map();
  for(const i of itens){
    const id=Number(i.produto_id),q=Number(i.quantidade),condicao=String(i.condicao_entrega||'padrao'),obs=String(i.observacao||'').trim().slice(0,500);
    if(!Number.isInteger(id)||!Number.isInteger(q)||q<1||q>99||!condicoes.has(condicao))return res.status(400).json({sucesso:false,mensagem:'Há um item, quantidade ou condição de entrega inválida.'});
    linhas.push({id,quantidade:q,condicao_entrega:condicao,observacao:obs});quantidades.set(id,(quantidades.get(id)||0)+q);
  }
  if([...quantidades.values()].some(q=>q>99))return res.status(400).json({sucesso:false,mensagem:'Limite de 99 unidades por produto.'});
  const produtosPorId=new Map();
  for(const [id,q] of quantidades){const p=await get('SELECT id,nome,preco_centavos,estoque FROM produtos WHERE id=? AND ativo=1',[id]);if(!p)return res.status(400).json({sucesso:false,mensagem:`Produto ${id} não encontrado.`});if(p.estoque<q)return res.status(409).json({sucesso:false,mensagem:`Estoque insuficiente para ${p.nome}.`});produtosPorId.set(id,{...p,quantidade:q});}
  const produtosLinha=linhas.map(l=>({...produtosPorId.get(l.id),quantidade:l.quantidade,condicao_entrega:l.condicao_entrega,observacao:l.observacao}));
  const config=await lerConfiguracoes(),subtotalC=produtosLinha.reduce((sum,p)=>sum+p.preco_centavos*p.quantidade,0);
  let descontoC=0;const descontoBruto=Number(config.desconto_cupom),percentualCupom=Number.isFinite(descontoBruto)?Math.max(0,Math.min(80,descontoBruto)):10;
  if(cupom==='VERDE10')descontoC=Math.round(subtotalC*percentualCupom/100);else if(cupom)return res.status(400).json({sucesso:false,mensagem:'Este cupom não está disponível para checkout automático. Remova o cupom ou fale com a loja.'});
  if(metodo==='pix')descontoC+=Math.round((subtotalC-descontoC)*.05);
  const retiradaIntegral=produtosLinha.every(p=>p.condicao_entrega==='retirada');const limiteBruto=Number(config.frete_gratis_acima),limiteFrete=(Number.isFinite(limiteBruto)?Math.max(0,limiteBruto):99)*100;
  const freteC=retiradaIntegral||subtotalC>=limiteFrete?0:Math.max(0,Math.round((Number(config.frete_valor)||0)*100));const totalC=Math.max(0,subtotalC-descontoC+freteC);
  const codigo='LV-'+crypto.randomBytes(7).toString('hex').toUpperCase();
  const pedidoItems=produtosLinha.map(p=>({produto_id:p.id,nome:p.nome,quantidade:p.quantidade,preco:p.preco_centavos/100,condicao_entrega:p.condicao_entrega,observacao:p.observacao}));
  await run('BEGIN IMMEDIATE');try{
    for(const [id,q] of quantidades){const r=await run('UPDATE produtos SET estoque=estoque-? WHERE id=? AND estoque>=?',[q,id,q]);if(!r.changes)throw new Error('ESTOQUE_CONCORRENTE');}
    const r=await run('INSERT INTO pedidos(usuario_id,codigo,cliente_nome,cliente_email,cliente_telefone,endereco,bairro,cidade,uf,cep,itens_json,subtotal_centavos,desconto_centavos,frete_centavos,total_centavos,metodo_pagamento,data_entrega,mensagem_cartao,cupom,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[usuarioId,codigo,nome,email,telefone,endereco,bairro,cidade,uf,cep,JSON.stringify(pedidoItems),subtotalC,descontoC,freteC,totalC,metodo,dataEntrega,mensagem,cupom||null,'recebido']);
    for(const [id,q] of quantidades){const p=produtosPorId.get(id);await run('INSERT INTO pedido_itens(pedido_id,produto_id,nome_produto,quantidade,preco_unit_centavos) VALUES(?,?,?,?,?)',[r.lastID,id,p.nome,q,p.preco_centavos]);}
    await run('COMMIT');res.status(201).json({sucesso:true,pedido:{id:r.lastID,codigo,cliente:{nome,email,telefone,endereco,bairro,cidade,uf,cep},itens:pedidoItems,subtotal:subtotalC/100,desconto:descontoC/100,frete:freteC/100,total:totalC/100,metodo_pagamento:metodo,status:'recebido',aviso_pagamento:'Pedido registrado. O pagamento não foi cobrado automaticamente nesta versão.'}});
  }catch(e){await run('ROLLBACK').catch(()=>{});if(e.message==='ESTOQUE_CONCORRENTE')return res.status(409).json({sucesso:false,mensagem:'Estoque alterado durante a compra. Atualize o carrinho e tente novamente.'});throw e;}
}catch(e){next(e);}});
app.get('/api/pedidos/:codigo',async(req,res,next)=>{try{const codigo=String(req.params.codigo||'').toUpperCase();const p=await get('SELECT codigo,itens_json,subtotal_centavos,desconto_centavos,frete_centavos,total_centavos,metodo_pagamento,status,criado_em FROM pedidos WHERE codigo=?',[codigo]);if(!p)return res.status(404).json({sucesso:false,mensagem:'Pedido não encontrado.'});res.json({sucesso:true,pedido:{codigo:p.codigo,itens:JSON.parse(p.itens_json),subtotal:p.subtotal_centavos/100,desconto:p.desconto_centavos/100,frete:p.frete_centavos/100,total:p.total_centavos/100,metodo_pagamento:p.metodo_pagamento,status:p.status,criado_em:p.criado_em,aviso_pagamento:'Esta consulta não confirma recebimento de pagamento.'}});}catch(e){next(e);}});
app.get('/api/admin/resumo',admin,async(req,res,next)=>{try{const [pedidos,produtos,estoque,visitas,vendas]=await Promise.all([get('SELECT COUNT(*) n FROM pedidos WHERE status<>\'cancelado\''),get('SELECT COUNT(*) n FROM produtos WHERE ativo=1'),get('SELECT COUNT(*) n FROM produtos WHERE ativo=1 AND estoque<=5'),get('SELECT COUNT(*) n FROM visitantes'),get('SELECT COALESCE(SUM(total_centavos),0) n FROM pedidos WHERE status<>\'cancelado\'')]);res.json({sucesso:true,resumo:{pedidos:pedidos.n,produtos:produtos.n,estoque_baixo:estoque.n,visitas:visitas.n,total_pedidos_centavos:vendas.n}});}catch(e){next(e);}});
app.get('/api/admin/produtos',admin,async(req,res,next)=>{try{const rows=await all('SELECT id,nome,categoria,preco_centavos,preco_original_centavos,estoque,imagem,descricao,produtor,ativo FROM produtos ORDER BY id');res.json({sucesso:true,produtos:rows.map(produtoPublico)});}catch(e){next(e);}});
function validarProduto(body){const nome=String(body.nome||'').trim(),categoria=String(body.categoria||'').trim().toLowerCase(),preco=Number(body.preco),estoque=Number(body.estoque);const imagem=String(body.imagem||'').trim(),descricao=String(body.descricao||'').trim(),vendedor=String(body.vendedor||body.produtor||'Loja Verde').trim(),precoOriginal=body.precoOriginal===''||body.precoOriginal==null?null:Number(body.precoOriginal);if(nome.length<2||nome.length>160||categoria.length<2||categoria.length>60||!Number.isFinite(preco)||preco<0.01||preco>1000000||!Number.isInteger(estoque)||estoque<0||estoque>100000)return {erro:'Informe nome, categoria, preço positivo e estoque inteiro válido.'};if(precoOriginal!==null&&(!Number.isFinite(precoOriginal)||precoOriginal<preco||precoOriginal>1000000))return {erro:'O preço original precisa ser válido e maior ou igual ao preço atual.'};if(descricao.length>1000)return {erro:'A descrição pode ter até 1000 caracteres.'};if(vendedor.length<2||vendedor.length>120)return {erro:'Informe o nome do produtor/fornecedor (2–120 caracteres).'};if(imagem&&!(/^(https:\/\/|\/)/i.test(imagem)))return {erro:'A imagem deve usar uma URL HTTPS ou um caminho local iniciado por /. '};return {nome,categoria,preco,estoque,imagem,descricao,vendedor,precoOriginal,ativo:body.ativo===false||body.ativo===0||body.ativo==='0'?0:1};}
app.post('/api/admin/produtos',admin,async(req,res,next)=>{try{const p=validarProduto(req.body);if(p.erro)return res.status(400).json({sucesso:false,mensagem:p.erro});const r=await run('INSERT INTO produtos(nome,categoria,preco_centavos,preco_original_centavos,estoque,imagem,descricao,produtor,ativo) VALUES(?,?,?,?,?,?,?,?,?)',[p.nome,p.categoria,Math.round(p.preco*100),p.precoOriginal!==null?Math.round(p.precoOriginal*100):null,p.estoque,p.imagem,p.descricao,p.vendedor,p.ativo]);res.status(201).json({sucesso:true,id:r.lastID,mensagem:'Produto cadastrado.'});}catch(e){next(e);}});
app.patch('/api/admin/produtos/:id',admin,async(req,res,next)=>{try{const p=validarProduto(req.body);if(p.erro)return res.status(400).json({sucesso:false,mensagem:p.erro});const r=await run('UPDATE produtos SET nome=?,categoria=?,preco_centavos=?,preco_original_centavos=?,estoque=?,imagem=?,descricao=?,produtor=?,ativo=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',[p.nome,p.categoria,Math.round(p.preco*100),p.precoOriginal!==null?Math.round(p.precoOriginal*100):null,p.estoque,p.imagem,p.descricao,p.vendedor,p.ativo,Number(req.params.id)]);if(!r.changes)return res.status(404).json({sucesso:false,mensagem:'Produto não encontrado.'});res.json({sucesso:true,mensagem:'Produto atualizado.'});}catch(e){next(e);}});
app.patch('/api/admin/produtos/:id/estoque',admin,async(req,res,next)=>{try{const estoque=Number(req.body.estoque);if(!Number.isInteger(estoque)||estoque<0||estoque>100000)return res.status(400).json({sucesso:false,mensagem:'Estoque deve ser inteiro entre 0 e 100000.'});const r=await run('UPDATE produtos SET estoque=?,atualizado_em=CURRENT_TIMESTAMP WHERE id=?',[estoque,Number(req.params.id)]);if(!r.changes)return res.status(404).json({sucesso:false,mensagem:'Produto não encontrado.'});res.json({sucesso:true,mensagem:'Estoque atualizado.'});}catch(e){next(e);}});
app.get('/api/admin/promocoes',admin,async(req,res,next)=>{try{const promocoes=await all('SELECT id,titulo,descricao,cupom,desconto_pct,minimo_unidades,valido_ate,ativo FROM promocoes_comerciantes ORDER BY id DESC');res.json({sucesso:true,promocoes});}catch(e){next(e);}});
function validarPromocao(body){const titulo=String(body.titulo||'').trim(),descricao=String(body.descricao||'').trim(),cupom=String(body.cupom||'').trim().toUpperCase(),desconto=Number(body.desconto_pct),minimo=Number(body.minimo_unidades),validade=String(body.valido_ate||'').trim();if(titulo.length<2||titulo.length>160||descricao.length>1000||cupom.length<3||cupom.length>60||!Number.isInteger(desconto)||desconto<0||desconto>80||!Number.isInteger(minimo)||minimo<1||minimo>100000)return {erro:'Confira título, cupom, desconto (0–80%) e quantidade mínima.'};if(validade&&!/^\d{4}-\d{2}-\d{2}$/.test(validade))return {erro:'A validade deve estar no formato AAAA-MM-DD.'};return {titulo,descricao,cupom,desconto,minimo,validade:validade||null,ativo:body.ativo===false||body.ativo===0||body.ativo==='0'?0:1};}
app.post('/api/admin/promocoes',admin,async(req,res,next)=>{try{const p=validarPromocao(req.body);if(p.erro)return res.status(400).json({sucesso:false,mensagem:p.erro});const r=await run('INSERT INTO promocoes_comerciantes(titulo,descricao,cupom,desconto_pct,minimo_unidades,valido_ate,ativo) VALUES(?,?,?,?,?,?,?)',[p.titulo,p.descricao,p.cupom,p.desconto,p.minimo,p.validade,p.ativo]);res.status(201).json({sucesso:true,id:r.lastID,mensagem:'Promoção cadastrada.'});}catch(e){if(e.code==='SQLITE_CONSTRAINT')return res.status(409).json({sucesso:false,mensagem:'Já existe uma promoção com esse cupom.'});next(e);}});
app.patch('/api/admin/promocoes/:id',admin,async(req,res,next)=>{try{const p=validarPromocao(req.body);if(p.erro)return res.status(400).json({sucesso:false,mensagem:p.erro});const r=await run('UPDATE promocoes_comerciantes SET titulo=?,descricao=?,cupom=?,desconto_pct=?,minimo_unidades=?,valido_ate=?,ativo=? WHERE id=?',[p.titulo,p.descricao,p.cupom,p.desconto,p.minimo,p.validade,p.ativo,Number(req.params.id)]);if(!r.changes)return res.status(404).json({sucesso:false,mensagem:'Promoção não encontrada.'});res.json({sucesso:true,mensagem:'Promoção atualizada.'});}catch(e){if(e.code==='SQLITE_CONSTRAINT')return res.status(409).json({sucesso:false,mensagem:'Já existe uma promoção com esse cupom.'});next(e);}});
app.get('/api/admin/configuracoes',admin,async(req,res,next)=>{try{res.json({sucesso:true,configuracoes:await lerConfiguracoes()});}catch(e){next(e);}});
app.put('/api/admin/configuracoes',admin,async(req,res,next)=>{try{const input=req.body||{};const allowed=['nome_loja','email_contato','whatsapp','frete_gratis_acima','frete_valor','desconto_cupom','aviso_topo'];const c={};for(const k of allowed)if(input[k]!==undefined)c[k]=String(input[k]).trim();if(c.nome_loja!==undefined&&(c.nome_loja.length<2||c.nome_loja.length>80))return res.status(400).json({sucesso:false,mensagem:'Nome da loja deve ter de 2 a 80 caracteres.'});if(c.email_contato!==undefined&&!emailOk(c.email_contato))return res.status(400).json({sucesso:false,mensagem:'E-mail de contato inválido.'});if(c.whatsapp!==undefined&&!/^\d{10,15}$/.test(c.whatsapp))return res.status(400).json({sucesso:false,mensagem:'WhatsApp deve conter DDI + DDD + número, só dígitos.'});for(const k of ['frete_gratis_acima','frete_valor','desconto_cupom'])if(c[k]!==undefined&&(!Number.isFinite(Number(c[k]))||Number(c[k])<0||Number(c[k])>(k==='desconto_cupom'?80:100000)))return res.status(400).json({sucesso:false,mensagem:`Valor inválido para ${k}.`});if(c.aviso_topo!==undefined&&c.aviso_topo.length>200)return res.status(400).json({sucesso:false,mensagem:'Aviso do topo pode ter até 200 caracteres.'});for(const [k,v] of Object.entries(c))await run('INSERT INTO configuracoes(chave,valor,atualizado_em) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor,atualizado_em=CURRENT_TIMESTAMP',[k,v]);res.json({sucesso:true,mensagem:'Configurações salvas.',configuracoes:await lerConfiguracoes()});}catch(e){next(e);}});
app.get('/api/admin/avaliacoes',admin,async(req,res,next)=>{try{const avaliacoes=await all('SELECT a.id,a.produto_id,a.usuario_id,a.nota_produto,a.nota_produtor,a.comentario,a.criado_em,u.nome AS autor,p.nome AS produto_nome FROM avaliacoes_produtos a JOIN usuarios u ON u.id=a.usuario_id JOIN produtos p ON p.id=a.produto_id ORDER BY a.criado_em DESC,a.id DESC LIMIT 500');res.json({sucesso:true,avaliacoes});}catch(e){next(e);}});
app.delete('/api/admin/avaliacoes/:id',admin,async(req,res,next)=>{try{const r=await run('DELETE FROM avaliacoes_produtos WHERE id=?',[Number(req.params.id)]);if(!r.changes)return res.status(404).json({sucesso:false,mensagem:'Avaliação não encontrada.'});res.json({sucesso:true,mensagem:'Avaliação excluída.'});}catch(e){next(e);}});
app.get('/api/admin/pedidos',admin,async(req,res,next)=>{try{const rows=await all('SELECT id,codigo,cliente_nome,cliente_email,cliente_telefone,endereco,bairro,cidade,uf,cep,itens_json,subtotal_centavos,desconto_centavos,frete_centavos,total_centavos,metodo_pagamento,data_entrega,mensagem_cartao,status,criado_em FROM pedidos ORDER BY id DESC LIMIT 200');res.json({sucesso:true,pedidos:rows.map(p=>({...p,itens:JSON.parse(p.itens_json),subtotal:p.subtotal_centavos/100,desconto:p.desconto_centavos/100,frete:p.frete_centavos/100,total:p.total_centavos/100}))});}catch(e){next(e);}});
app.patch('/api/admin/pedidos/:codigo/status',admin,async(req,res,next)=>{try{const codigo=String(req.params.codigo).toUpperCase(),status=String(req.body.status||'');if(!['recebido','confirmado','em_preparacao','enviado','concluido','cancelado'].includes(status))return res.status(400).json({sucesso:false,mensagem:'Status inválido.'});await run('BEGIN IMMEDIATE');try{const pedido=await get('SELECT id,status FROM pedidos WHERE codigo=?',[codigo]);if(!pedido){await run('ROLLBACK');return res.status(404).json({sucesso:false,mensagem:'Pedido não encontrado.'});}if(pedido.status==='cancelado'&&status!=='cancelado'){await run('ROLLBACK');return res.status(409).json({sucesso:false,mensagem:'Pedido cancelado não pode ser reaberto automaticamente.'});}if(pedido.status!=='cancelado'&&status==='cancelado'){const linhas=await all('SELECT produto_id,quantidade FROM pedido_itens WHERE pedido_id=?',[pedido.id]);for(const item of linhas)await run('UPDATE produtos SET estoque=estoque+? WHERE id=?',[item.quantidade,item.produto_id]);}await run('UPDATE pedidos SET status=? WHERE id=?',[status,pedido.id]);await run('COMMIT');res.json({sucesso:true,mensagem:'Status atualizado.'});}catch(e){await run('ROLLBACK').catch(()=>{});throw e;}}catch(e){next(e);}});
// Nunca disponibilize código de servidor, arquivos de configuração ou banco via HTTP.
app.use((req, res, next) => {
  const bloqueados = new Set(['/server.js', '/catalog.js', '/package.json', '/package-lock.json', '/README.md', '/iniciar_servidor.bat', '/.env.example', '/.gitignore', '/novas-plantas.json']);
  if (bloqueados.has(req.path) || /^\/database(?:\/|$)/i.test(req.path) || /^\/\.data(?:\/|$)/i.test(req.path)) {
    return res.sendStatus(404);
  }
  next();
});
// A aplicação e a API são servidas na mesma origem para evitar CORS desnecessário.
app.use(express.static(__dirname,{extensions:['html'], dotfiles:'ignore'}));
app.get(/.*/, (req,res,next)=>{if(req.path.startsWith('/api/'))return res.status(404).json({sucesso:false,mensagem:'Rota não encontrada.'});res.sendFile(path.join(__dirname,'index.html'),e=>e&&next(e));});
app.use((err,req,res,next)=>{console.error('[API]',err.message);if(res.headersSent)return next(err);const status=Number(err.status)===502?502:500;const mensagem=status===502?'Serviço de e-mail indisponível. Tente novamente em alguns minutos.':'Erro interno. Tente novamente mais tarde.';res.status(status).json({sucesso:false,mensagem});});
initDb().then(()=>app.listen(PORT,HOST,()=>console.log(`🌿 Loja Verde disponível em http://${HOST}:${PORT}`))).catch(e=>{console.error('Falha ao inicializar banco:',e);process.exit(1);});
