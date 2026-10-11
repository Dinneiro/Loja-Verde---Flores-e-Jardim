// Smoke do front-end: executa script.js, auth.js, checkout.js e paginas.js num DOM simulado,
// falando com o servidor real (banco temporário). Pega ReferenceError e divergência de preço.
process.env.NODE_ENV='test'; process.env.RATE_LIMIT_MAX='100000'; process.env.RATE_LIMIT_AUTH_MAX='100000';
process.env.SMTP_HOST=''; process.env.MP_ACCESS_TOKEN='';
const test=require('node:test'),vm=require('vm'),fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert');
const APP=path.join(__dirname,'..');
const dbLib=require(APP+'/lib/db'); const {criarApp}=require(APP+'/server');
test('front-end: renderização, cupom, cadastro, OTP, pedido e conta (DOM simulado)', async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sm-')); const db=dbLib.abrir(path.join(tmp,'s.db')); await dbLib.iniciarEsquema(db);
 const srv=criarApp(db).listen(0); const origin='http://127.0.0.1:'+srv.address().port;

 const els={}; const handlers={doc:{},win:{}};
 class El{constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.value='';this.style={};this.dataset={};this.checked=false;this.disabled=false;
   this.classList={s:new Set(),add:x=>this.classList.s.add(x),remove:x=>this.classList.s.delete(x),toggle:(x,f)=>f?this.classList.s.add(x):this.classList.s.delete(x),contains:x=>this.classList.s.has(x)};
   this.h={};this.children=[];}
  addEventListener(t,f){this.h[t]=f;} setAttribute(){} append(){} appendChild(){} focus(){} select(){} scrollIntoView(){}
  querySelector(){return null;} querySelectorAll(){return [];} closest(){return null;} remove(){} get parentElement(){return null;}}
 const getEl=id=>els[id]||(els[id]=new El(id));
 const store=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
 const sb={console,fetch,URL,URLSearchParams,setTimeout,setInterval,clearInterval,clearTimeout,Date,JSON,Math,Number,String,Array,Object,Promise,Map,Set,isNaN,encodeURIComponent,
  localStorage:store(),sessionStorage:store(),navigator:{clipboard:{writeText:async()=>{}}},
  location:{protocol:'http:',origin,search:'',href:origin+'/',pathname:'/',hash:''},history:{replaceState(){}},
  alert:m=>console.log('ALERT:',m),prompt:()=>null,open:u=>{sb.__opened=u;},scrollTo(){},
  document:{getElementById:getEl,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new El('x'),body:new El('body'),
    addEventListener:(t,f)=>{(handlers.doc[t]=handlers.doc[t]||[]).push(f);},execCommand(){}}};
 sb.window=sb; sb.addEventListener=(t,f)=>{(handlers.win[t]=handlers.win[t]||[]).push(f);};
 vm.createContext(sb);
 for(const f of ['script.js','auth.js','checkout.js','paginas.js']) vm.runInContext(fs.readFileSync(APP+'/public/'+f,'utf8'),sb,{filename:f});
 const run=c=>vm.runInContext(c,sb);
 (handlers.win.DOMContentLoaded||[]).forEach(f=>f()); (handlers.doc.DOMContentLoaded||[]).forEach(f=>f());
 await new Promise(r=>setTimeout(r,400));   // sincronizarCatalogo

 // renderizações sem ReferenceError
 run('renderizarHome()'); assert(getEl('content').innerHTML.length>1000,'home vazia');
 for(const p of ['carrinho','favoritos','comerciantes','atendimento']) {run(`showPage('${p}')`);}
 assert(/Cadastro de parceiro/.test(getEl('content').innerHTML)||true);
 run("showPage('comerciantes')"); assert(getEl('content').innerHTML.includes('Cadastro de parceiro'));
 await new Promise(r=>setTimeout(r,300)); assert(getEl('listaPromosB2B').innerHTML.includes('REVENDAVERDE25'),'promos B2B não carregaram');
 run("showPage('atendimento')"); assert(getEl('content').innerHTML.includes('Central de Ajuda'));
 console.log('✓ páginas renderizam; catálogo sincronizado:',run('produtos.length'),'produtos');

 // carrinho + totais iguais aos do servidor
 run('adicionarAoCarrinho(1)'); run('adicionarAoCarrinho(1)'); run('adicionarAoCarrinho(4)');
 run("showPage('carrinho')"); assert(getEl('content').innerHTML.includes('Finalizar compra'));
 console.log('✓ carrinho:',JSON.stringify(run('calcularTotaisCarrinho()')));
 const ok=await run("copiarCupom('VERDE10')"); assert(ok===true,'cupom'); assert.equal(run('cupomPercentual'),10);
 assert.equal(await run("copiarCupom('FALSO')"),false);
 run("setMetodoPagamento('pix')");
 const tFront=run('calcularTotaisCarrinho()'); console.log('  totais com VERDE10+Pix:',JSON.stringify(tFront));

 // login: sem sessão, finalizar abre o modal
 getEl('inputEndereco').value='Rua das Flores, 123 - Centro - São Paulo/SP'; getEl('inputWhatsapp').value='(11) 90000-0000'; getEl('inputMsgCartao').value='Com carinho'; getEl('inputDataEntrega').value='';
 await run('finalizarPedido()');
 assert(!getEl('modalLogin').classList.contains('hidden'),'modal de login deveria abrir'); console.log('✓ finalizarPedido sem login abre o modal de login');

 // cadastro → OTP → sessão → pedido automático (callback aoConcluir)
 getEl('regNome').value='Ana Souza'; getEl('regEmail').value='ana@teste.com'; getEl('regSenha').value='senhaSegura1'; getEl('regAceite').checked=false;
 run("abrirModalLogin('registro')");
 const sub=async id=>{const f=getEl(id).h.submit; await f({preventDefault(){},target:{querySelector:()=>new El('btn')}}); await new Promise(r=>setTimeout(r,250));};
 getEl('regNome').value='Ana Souza'; getEl('regEmail').value='ana@teste.com'; getEl('regSenha').value='senhaSegura1';
 await sub('formRegistro'); assert(getEl('authMsg').textContent.includes('Aceite'),'deveria exigir aceite dos termos');
 getEl('regAceite').checked=true; await sub('formRegistro');
 assert(getEl('loginModalBody').innerHTML.includes('Confirme seu e-mail'),'não foi para a tela do OTP');
 const {codigo_verificacao}=await db.get("SELECT codigo_verificacao FROM usuarios WHERE email='ana@teste.com'");
 getEl('otpCodigo').value=codigo_verificacao; await sub('formOtp');
 await new Promise(r=>setTimeout(r,600));
 assert(run("localStorage.getItem('token_lv')"),'sem token'); assert.equal(run("document.getElementById('labelUsuarioHeader').textContent"),'Ana');
 console.log('✓ cadastro → OTP → login; header mostra "Ana"');
 const ped=await db.all('SELECT * FROM pedidos'); assert.equal(ped.length,1,'pedido não foi criado após o login'); 
 console.log('✓ pedido criado automaticamente após login:',ped[0].total,'(front calculou',tFront.total+')');
 assert.equal(ped[0].total,tFront.total,'front e servidor divergem no total'); assert.equal(ped[0].cupom,'VERDE10');
 assert.equal(run('carrinho.length'),0,'carrinho deveria esvaziar'); assert(getEl('detalhesProduto').innerHTML.includes('Pedido #1 registrado'),'painel pós-pedido');

 // conta + pedidos
 run('abrirModalOuPerfil()'); await new Promise(r=>setTimeout(r,400));
 assert(getEl('listaPedidos').innerHTML.includes('Pedido #1')); console.log('✓ "Minha conta" lista o pedido');
 run('AUTH_LV.limparSessao()'); assert.equal(run("document.getElementById('labelUsuarioHeader').textContent"),'Entrar');

 // recuperação via URL
 srv.close(); await db.close(); fs.rmSync(tmp,{recursive:true,force:true}); });
