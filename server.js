const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');

const config = require('./config');
const dbLib = require('./lib/db');
const { calcularTotais, round2 } = require('./lib/precos');
const { resolverCupom } = require('./lib/cupons');
const emailSvc = require('./email-service');
const pagSvc = require('./payment-service');

const CATEGORIAS = ['hortalicas', 'temperos', 'ornamentais', 'mudas', 'suculentas', 'kits', 'finados'];
const METODOS = ['pix', 'cartao', 'boleto'];
const STATUS_PEDIDO = ['aguardando_pagamento', 'pago', 'separando', 'enviado', 'entregue', 'cancelado', 'reembolsado'];

// Hash descartável: login de e-mail inexistente gasta o mesmo tempo de um login real.
const HASH_FALSO = bcrypt.hashSync('senha-falsa-para-igualar-tempo', 12);

const validarEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const codigoOtp = () => String(crypto.randomInt(100000, 1000000));
const texto = (v, max) => String(v ?? '').trim().slice(0, max);
const falha = (res, status, mensagem) => res.status(status).json({ sucesso: false, mensagem });

function criarApp(db) {
  const app = express();
  app.set('trust proxy', 1);

  // ---------- middlewares globais ----------
  const helmetOpts = { crossOriginEmbedderPolicy: false };
  if (config.cspAtiva) {
    helmetOpts.contentSecurityPolicy = {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"], // o site usa onclick="..." nos botões
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"]
      }
    };
  } else {
    helmetOpts.contentSecurityPolicy = false;
  }
  app.use(helmet(helmetOpts));
  app.use(cors({ origin: config.isProd ? [config.baseUrl] : true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

  app.use('/api', rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { sucesso: false, mensagem: 'Muitas requisições. Aguarde alguns minutos.' }
  }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { sucesso: false, mensagem: 'Muitas tentativas. Aguarde 15 minutos.' }
  });

  // ---------- utilitários ----------
  function auditar(ator, acao, detalhes, ip) {
    db.run('INSERT INTO auditoria (ator, acao, detalhes, ip) VALUES (?, ?, ?, ?)',
      [ator || 'sistema', acao, JSON.stringify(detalhes || {}), ip || ''])
      .catch(e => console.error('Falha ao gravar auditoria:', e.message));
  }

  const gerarToken = u => jwt.sign(
    { id: u.id, email: u.email, role: u.role || 'cliente' },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  function lerToken(req) {
    const h = req.headers.authorization || '';
    return h.startsWith('Bearer ') ? h.slice(7) : null;
  }
  function autenticar(req, res, next) {
    const token = lerToken(req);
    if (!token) return falha(res, 401, 'Faça login para continuar.');
    try {
      req.usuario = jwt.verify(token, config.jwtSecret);
      next();
    } catch {
      return falha(res, 401, 'Sessão expirada. Entre novamente.');
    }
  }
  function autenticarOpcional(req, res, next) {
    const token = lerToken(req);
    if (token) {
      try { req.usuario = jwt.verify(token, config.jwtSecret); } catch { /* segue anônimo */ }
    }
    next();
  }
  function apenasAdmin(req, res, next) {
    if (req.usuario?.role !== 'admin') return falha(res, 403, 'Acesso restrito.');
    next();
  }

  // ---------- estoque ----------
  async function devolverItens(itens) {
    for (const it of itens) {
      await db.run('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [it.qtd, it.id]);
    }
  }

  // Reserva atômica item a item: só baixa se ainda houver saldo. Sem BEGIN/COMMIT, então
  // requisições simultâneas não se atrapalham na mesma conexão do SQLite.
  async function reservarEstoque(itens) {
    const feitos = [];
    for (const it of itens) {
      const r = await db.run(
        'UPDATE produtos SET estoque = estoque - ? WHERE id = ? AND ativo = 1 AND estoque >= ?',
        [it.qtd, it.id, it.qtd]
      );
      if (r.changes !== 1) {
        await devolverItens(feitos);
        return { ok: false, item: it };
      }
      feitos.push(it);
    }
    return { ok: true };
  }

  // Idempotente: o flag estoque_devolvido garante que o saldo volta uma única vez.
  async function devolverEstoquePedido(pedido) {
    const r = await db.run('UPDATE pedidos SET estoque_devolvido = 1 WHERE id = ? AND estoque_devolvido = 0', [pedido.id]);
    if (r.changes === 1) await devolverItens(JSON.parse(pedido.itens_json));
  }

  // Pagamento aprovado depois de o pedido ter sido cancelado/expirado: baixa o estoque de novo.
  async function reservarNovamente(pedido) {
    const r = await db.run('UPDATE pedidos SET estoque_devolvido = 0 WHERE id = ? AND estoque_devolvido = 1', [pedido.id]);
    if (r.changes === 1) {
      for (const it of JSON.parse(pedido.itens_json)) {
        await db.run('UPDATE produtos SET estoque = MAX(0, estoque - ?) WHERE id = ?', [it.qtd, it.id]);
      }
    }
  }

  async function cancelarPedido(pedidoId, motivo, ator, ip) {
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
    if (!pedido || pedido.status === 'cancelado') return false;
    await db.run("UPDATE pedidos SET status = 'cancelado', atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", [pedidoId]);
    await devolverEstoquePedido(pedido);
    auditar(ator || 'sistema', 'pedido_cancelado', { pedido_id: pedidoId, motivo }, ip);
    return true;
  }

  // ======================================================================
  // AUTENTICAÇÃO
  // ======================================================================
  app.post('/api/auth/registrar', authLimiter, async (req, res) => {
    const nome = texto(req.body?.nome, 80);
    const email = texto(req.body?.email, 254).toLowerCase();
    const senha = String(req.body?.senha ?? '');
    if (nome.length < 2) return falha(res, 400, 'Informe seu nome.');
    if (!validarEmail(email)) return falha(res, 400, 'E-mail inválido.');
    if (senha.length < 8 || senha.length > 128) return falha(res, 400, 'A senha deve ter de 8 a 128 caracteres.');

    const existente = await db.get('SELECT id, email_verificado FROM usuarios WHERE email = ?', [email]);
    if (existente && existente.email_verificado) return falha(res, 409, 'Este e-mail já está cadastrado. Faça login.');

    const hash = await bcrypt.hash(senha, 12);
    const codigo = codigoOtp();
    const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let usuarioId;
    if (existente) {
      // Cadastro anterior nunca confirmado: refaz com os novos dados em vez de travar o e-mail.
      await db.run(
        'UPDATE usuarios SET nome = ?, senha_hash = ?, codigo_verificacao = ?, codigo_expira_em = ?, codigo_tentativas = 0 WHERE id = ?',
        [nome, hash, codigo, expira, existente.id]
      );
      usuarioId = existente.id;
    } else {
      const r = await db.run(
        'INSERT INTO usuarios (nome, email, senha_hash, codigo_verificacao, codigo_expira_em) VALUES (?, ?, ?, ?, ?)',
        [nome, email, hash, codigo, expira]
      );
      usuarioId = r.lastID;
    }

    const envio = await emailSvc.enviarCodigoVerificacao(nome, email, codigo);
    auditar(email, 'registro', { usuario_id: usuarioId, email_enviado: envio.ok }, req.ip);
    res.json({
      sucesso: true,
      email,
      email_enviado: envio.ok,
      mensagem: envio.ok
        ? 'Enviamos um código de 6 dígitos para o seu e-mail.'
        : 'Cadastro criado, mas não conseguimos enviar o e-mail. Toque em "Reenviar código".'
    });
  });

  app.post('/api/auth/verificar-email', authLimiter, async (req, res) => {
    const email = texto(req.body?.email, 254).toLowerCase();
    const codigo = texto(req.body?.codigo, 12);
    if (!email || !codigo) return falha(res, 400, 'Informe e-mail e código.');

    const u = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (!u) return falha(res, 404, 'Usuário não encontrado.');
    if (u.email_verificado) return falha(res, 400, 'E-mail já verificado. Faça login.');
    if (!u.codigo_verificacao) return falha(res, 400, 'Solicite um novo código.');
    if ((u.codigo_tentativas || 0) >= 5) return falha(res, 429, 'Muitas tentativas. Solicite um novo código.');
    if (new Date(u.codigo_expira_em) < new Date()) return falha(res, 400, 'Código expirado. Solicite um novo.');

    const a = Buffer.from(u.codigo_verificacao);
    const b = Buffer.from(codigo);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      await db.run('UPDATE usuarios SET codigo_tentativas = codigo_tentativas + 1 WHERE id = ?', [u.id]);
      return falha(res, 400, 'Código incorreto.');
    }

    await db.run(
      'UPDATE usuarios SET email_verificado = 1, codigo_verificacao = NULL, codigo_expira_em = NULL, codigo_tentativas = 0 WHERE id = ?',
      [u.id]
    );
    emailSvc.enviarBoasVindas(u.nome, u.email);
    auditar(u.email, 'email_verificado', { usuario_id: u.id }, req.ip);
    res.json({
      sucesso: true,
      token: gerarToken(u),
      usuario: { id: u.id, nome: u.nome, email: u.email }
    });
  });

  app.post('/api/auth/reenviar-codigo', authLimiter, async (req, res) => {
    const email = texto(req.body?.email, 254).toLowerCase();
    if (!email) return falha(res, 400, 'E-mail obrigatório.');
    const u = await db.get('SELECT id, nome, email, email_verificado, codigo_expira_em FROM usuarios WHERE email = ?', [email]);
    if (!u) return falha(res, 404, 'Usuário não encontrado.');
    if (u.email_verificado) return falha(res, 400, 'E-mail já verificado.');

    if (u.codigo_expira_em) {
      const enviadoHa = Date.now() - (new Date(u.codigo_expira_em).getTime() - 15 * 60 * 1000);
      if (enviadoHa < 60 * 1000) return falha(res, 429, 'Aguarde 1 minuto para pedir outro código.');
    }

    const codigo = codigoOtp();
    const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.run('UPDATE usuarios SET codigo_verificacao = ?, codigo_expira_em = ?, codigo_tentativas = 0 WHERE id = ?',
      [codigo, expira, u.id]);
    const envio = await emailSvc.enviarCodigoVerificacao(u.nome, u.email, codigo);
    if (!envio.ok) return falha(res, 502, 'Não foi possível enviar o e-mail agora. Tente novamente.');
    res.json({ sucesso: true, mensagem: 'Novo código enviado.' });
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const email = texto(req.body?.email, 254).toLowerCase();
    const senha = String(req.body?.senha ?? '');
    if (!email || !senha) return falha(res, 400, 'Informe e-mail e senha.');

    const u = await db.get('SELECT * FROM usuarios WHERE email = ?', [email]);
    const ok = await bcrypt.compare(senha, u ? u.senha_hash : HASH_FALSO);
    if (!u || !ok) return falha(res, 401, 'E-mail ou senha incorretos.');
    if (!u.email_verificado) {
      return res.status(403).json({
        sucesso: false, precisa_verificar: true, email: u.email,
        mensagem: 'Confirme seu e-mail antes de entrar.'
      });
    }
    auditar(u.email, 'login', {}, req.ip);
    res.json({ sucesso: true, token: gerarToken(u), usuario: { id: u.id, nome: u.nome, email: u.email } });
  });

  app.post('/api/auth/recuperar-senha', authLimiter, async (req, res) => {
    const email = texto(req.body?.email, 254).toLowerCase();
    if (!validarEmail(email)) return falha(res, 400, 'E-mail inválido.');
    const resposta = { sucesso: true, mensagem: 'Se o e-mail estiver cadastrado, enviaremos as instruções.' };

    const u = await db.get('SELECT id, nome, email FROM usuarios WHERE email = ? AND email_verificado = 1', [email]);
    if (!u) return res.json(resposta);

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    // Guardamos só o hash: vazamento do banco não revela links de redefinição válidos.
    await db.run('UPDATE usuarios SET token_recuperacao_hash = ?, token_recuperacao_expira = ? WHERE id = ?',
      [sha256(token), expira, u.id]);
    emailSvc.enviarRecuperacaoSenha(u.nome, u.email, token);
    auditar(u.email, 'recuperacao_senha_solicitada', {}, req.ip);
    res.json(resposta);
  });

  app.post('/api/auth/redefinir-senha', authLimiter, async (req, res) => {
    const token = texto(req.body?.token, 128);
    const novaSenha = String(req.body?.novaSenha ?? '');
    if (!token || novaSenha.length < 8 || novaSenha.length > 128) {
      return falha(res, 400, 'Informe o token e uma senha de 8 a 128 caracteres.');
    }
    const u = await db.get('SELECT id, email, token_recuperacao_expira FROM usuarios WHERE token_recuperacao_hash = ?', [sha256(token)]);
    if (!u) return falha(res, 400, 'Link inválido ou já utilizado.');
    if (new Date(u.token_recuperacao_expira) < new Date()) return falha(res, 400, 'Link expirado. Solicite outro.');

    const hash = await bcrypt.hash(novaSenha, 12);
    await db.run(
      'UPDATE usuarios SET senha_hash = ?, token_recuperacao_hash = NULL, token_recuperacao_expira = NULL WHERE id = ?',
      [hash, u.id]
    );
    auditar(u.email, 'senha_redefinida', {}, req.ip);
    res.json({ sucesso: true, mensagem: 'Senha redefinida. Faça login.' });
  });

  app.get('/api/auth/perfil', autenticar, async (req, res) => {
    const u = await db.get('SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!u) return falha(res, 404, 'Usuário não encontrado.');
    res.json({ sucesso: true, usuario: u });
  });

  // ======================================================================
  // CATÁLOGO, CUPONS E VISITAS
  // ======================================================================
  app.get('/api/produtos', async (req, res) => {
    const produtos = await db.all('SELECT * FROM produtos WHERE ativo = 1 ORDER BY id');
    res.json({ sucesso: true, produtos });
  });

  app.post('/api/cupons/validar', autenticarOpcional, async (req, res) => {
    let unidades = 0;
    if (Array.isArray(req.body?.itens)) {
      for (const it of req.body.itens.slice(0, 50)) {
        const q = Number(it?.qtd);
        if (Number.isInteger(q) && q > 0 && q <= 99) unidades += q;
      }
    }
    const r = await resolverCupom(db, req.body?.codigo, { unidades, usuarioId: req.usuario?.id || null });
    res.json({ sucesso: r.ok, percentual: r.percentual, codigo: r.codigo, mensagem: r.mensagem });
  });

  app.post('/api/visitante/rastrear', async (req, res) => {
    const pagina = texto(req.body?.pagina, 40).replace(/[^\w\- ]/g, '') || 'home';
    await db.run('INSERT INTO visitantes (pagina) VALUES (?)', [pagina]);
    res.json({ sucesso: true });
  });

  // ======================================================================
  // PEDIDOS
  // ======================================================================
  function normalizarItens(brutos) {
    if (!Array.isArray(brutos) || brutos.length === 0 || brutos.length > 50) return null;
    const mapa = new Map();
    for (const b of brutos) {
      const id = Number(b?.id);
      const qtd = Number(b?.qtd);
      if (!Number.isInteger(id) || id <= 0) return null;
      if (!Number.isInteger(qtd) || qtd < 1 || qtd > 99) return null;
      mapa.set(id, (mapa.get(id) || 0) + qtd);
    }
    const itens = [...mapa].map(([id, qtd]) => ({ id, qtd }));
    return itens.some(i => i.qtd > 99) ? null : itens;
  }

  app.post('/api/pedidos', autenticar, async (req, res) => {
    const b = req.body || {};
    const itensPedidos = normalizarItens(b.itens);
    if (!itensPedidos) return falha(res, 400, 'Carrinho inválido. Revise as quantidades (1 a 99 por item).');

    const metodo = String(b.metodo_pagamento || '');
    if (!METODOS.includes(metodo)) return falha(res, 400, 'Escolha Pix, cartão ou boleto.');

    const endereco = texto(b.endereco_entrega, 300);
    if (endereco.length < 10) return falha(res, 400, 'Informe o endereço completo de entrega.');

    const whatsapp = texto(b.cliente_whatsapp, 20).replace(/[^\d+() -]/g, '');
    const mensagemCartao = texto(b.mensagem_cartao, 200);
    let dataEntrega = texto(b.data_entrega_desejada, 10);
    if (dataEntrega) {
      const valida = /^\d{4}-\d{2}-\d{2}$/.test(dataEntrega) && !Number.isNaN(Date.parse(dataEntrega));
      if (!valida) return falha(res, 400, 'Data de entrega inválida.');
    }

    const usuario = await db.get('SELECT id, nome, email, email_verificado FROM usuarios WHERE id = ?', [req.usuario.id]);
    if (!usuario || !usuario.email_verificado) return falha(res, 403, 'Confirme seu e-mail para comprar.');

    // Preços SEMPRE vêm do banco — nunca do navegador.
    const detalhes = [];
    let subtotal = 0;
    let unidades = 0;
    for (const it of itensPedidos) {
      const p = await db.get('SELECT id, nome, preco, estoque FROM produtos WHERE id = ? AND ativo = 1', [it.id]);
      if (!p) return falha(res, 400, `O produto ${it.id} não está mais disponível.`);
      if (p.estoque < it.qtd) {
        return falha(res, 409, `Estoque insuficiente para "${p.nome}". Disponível: ${p.estoque}.`);
      }
      subtotal += round2(p.preco * it.qtd);
      unidades += it.qtd;
      detalhes.push({ id: p.id, nome: p.nome, preco: p.preco, qtd: it.qtd });
    }

    let percentualCupom = 0;
    let cupomAplicado = null;
    if (b.cupom) {
      const c = await resolverCupom(db, b.cupom, { unidades, usuarioId: usuario.id });
      if (!c.ok) return falha(res, 400, c.mensagem);
      percentualCupom = c.percentual;
      cupomAplicado = c.codigo;
    }

    const t = calcularTotais({ subtotal, percentualCupom, metodo });

    const reserva = await reservarEstoque(itensPedidos);
    if (!reserva.ok) return falha(res, 409, 'Um dos itens acabou de esgotar. Atualize o carrinho.');

    let pedidoId;
    try {
      const r = await db.run(
        `INSERT INTO pedidos (usuario_id, cliente_nome, cliente_email, cliente_whatsapp, itens_json, subtotal,
           cupom, desconto_cupom, desconto_pix, frete, total, metodo_pagamento, endereco_entrega,
           data_entrega_desejada, mensagem_cartao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [usuario.id, usuario.nome, usuario.email, whatsapp, JSON.stringify(detalhes), t.subtotal,
         cupomAplicado, t.descontoCupom, t.descontoPix, t.frete, t.total, metodo, endereco,
         dataEntrega, mensagemCartao]
      );
      pedidoId = r.lastID;
    } catch (e) {
      await devolverItens(itensPedidos);
      throw e;
    }

    const pedido = { id: pedidoId, total: t.total, metodo_pagamento: metodo, cliente_nome: usuario.nome };
    auditar(usuario.email, 'pedido_criado', { pedido_id: pedidoId, metodo, total: t.total, cupom: cupomAplicado }, req.ip);

    let pagamento = null;
    let aviso = null;
    if (pagSvc.habilitado) {
      try {
        pagamento = metodo === 'pix'
          ? await pagSvc.criarPagamentoPix(pedido, usuario)
          : await pagSvc.criarPreference(pedido, usuario);
        await db.run('UPDATE pedidos SET payment_id = ? WHERE id = ?',
          [String(pagamento.id ?? pagamento.preference_id), pedidoId]);
      } catch (e) {
        console.error('Erro no gateway de pagamento:', e.message);
        await cancelarPedido(pedidoId, 'falha_gateway', usuario.email, req.ip);
        return falha(res, 502, 'Não foi possível iniciar o pagamento agora. Tente novamente em instantes.');
      }
    } else {
      aviso = 'Pedido registrado! O pagamento online ainda não está ativo — combine o pagamento pelo WhatsApp informando o número do pedido.';
    }

    emailSvc.enviarPedidoCriado(pedido, usuario);
    emailSvc.notificarAdminNovoPedido(pedido);
    res.json({ sucesso: true, pedido_id: pedidoId, total: t.total, totais: t, pagamento, aviso });
  });

  function formatarPedido(p) {
    return {
      id: p.id, total: p.total, subtotal: p.subtotal, frete: p.frete,
      desconto_cupom: p.desconto_cupom, desconto_pix: p.desconto_pix, cupom: p.cupom,
      metodo_pagamento: p.metodo_pagamento, payment_status: p.payment_status,
      status: p.status, codigo_rastreio: p.codigo_rastreio, criado_em: p.criado_em,
      itens: JSON.parse(p.itens_json || '[]')
    };
  }

  app.get('/api/pedidos/meus', autenticar, async (req, res) => {
    const rows = await db.all('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC LIMIT 50', [req.usuario.id]);
    res.json({ sucesso: true, pedidos: rows.map(formatarPedido) });
  });

  app.get('/api/pedidos/:id', autenticar, async (req, res) => {
    const p = await db.get('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?', [Number(req.params.id), req.usuario.id]);
    if (!p) return falha(res, 404, 'Pedido não encontrado.');
    res.json({ sucesso: true, pedido: formatarPedido(p) });
  });

  // ======================================================================
  // WEBHOOK DO MERCADO PAGO
  // ======================================================================
  app.post('/api/pagamentos/webhook', async (req, res) => {
    if (!pagSvc.validarAssinaturaWebhook(req)) {
      auditar('mercadopago', 'webhook_assinatura_invalida', { query: req.query }, req.ip);
      return res.status(401).send('Assinatura inválida');
    }
    const tipo = req.body?.type || req.query.type || req.query.topic;
    if (tipo !== 'payment') return res.status(200).send('OK');

    const paymentId = req.body?.data?.id || req.query['data.id'] || req.query.id;
    if (!paymentId) return res.status(400).send('Sem ID');

    let pg;
    try {
      pg = await pagSvc.consultarPagamento(paymentId);
    } catch (e) {
      if (e.status === 404) return res.status(200).send('Pagamento não encontrado');
      throw e; // 500: o Mercado Pago tenta de novo
    }

    const pedidoId = Number(pg.external_reference);
    if (!Number.isInteger(pedidoId)) return res.status(200).send('Sem referência');
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
    if (!pedido) return res.status(200).send('Pedido não encontrado');

    const statusMP = pg.status;
    auditar('mercadopago', 'webhook_pagamento', { pedido_id: pedidoId, status: statusMP, payment_id: pg.id }, req.ip);

    if (statusMP === 'approved') {
      // Confere o valor: só aprova se o pago cobre o total do pedido.
      if (Number(pg.transaction_amount) + 0.01 < pedido.total) {
        auditar('mercadopago', 'webhook_valor_divergente',
          { pedido_id: pedidoId, pago: pg.transaction_amount, esperado: pedido.total }, req.ip);
        await db.run('UPDATE pedidos SET payment_status = ? WHERE id = ?', ['approved_valor_divergente', pedidoId]);
        return res.status(200).send('OK');
      }
      // UPDATE condicional = idempotente (webhooks repetidos não reenviam e-mail nem mexem em estoque).
      const r = await db.run(
        `UPDATE pedidos SET status = 'pago', payment_status = 'approved', payment_id = ?, atualizado_em = CURRENT_TIMESTAMP
         WHERE id = ? AND status IN ('aguardando_pagamento', 'cancelado')`,
        [String(pg.id), pedidoId]
      );
      if (r.changes === 1) {
        if (pedido.status === 'cancelado') {
          await reservarNovamente(pedido);
          auditar('mercadopago', 'pago_apos_cancelamento', { pedido_id: pedidoId }, req.ip);
        }
        const u = await db.get('SELECT id, nome, email FROM usuarios WHERE id = ?', [pedido.usuario_id]);
        if (u) emailSvc.enviarPagamentoAprovado({ id: pedidoId, total: pedido.total }, u);
      } else {
        await db.run('UPDATE pedidos SET payment_status = ? WHERE id = ?', ['approved', pedidoId]);
      }
    } else if (statusMP === 'cancelled') {
      await db.run('UPDATE pedidos SET payment_status = ? WHERE id = ?', [statusMP, pedidoId]);
      if (pedido.status === 'aguardando_pagamento') await cancelarPedido(pedidoId, 'pagamento_cancelado_ou_expirado', 'mercadopago', req.ip);
    } else if (statusMP === 'refunded' || statusMP === 'charged_back') {
      await db.run("UPDATE pedidos SET payment_status = ?, status = 'reembolsado', atualizado_em = CURRENT_TIMESTAMP WHERE id = ?", [statusMP, pedidoId]);
    } else {
      // pending, in_process, rejected...: um "rejected" não cancela o pedido, pois o cliente
      // pode tentar outro cartão no mesmo checkout. Pedidos parados expiram sozinhos.
      await db.run('UPDATE pedidos SET payment_status = ? WHERE id = ?', [statusMP, pedidoId]);
    }
    res.status(200).send('OK');
  });

  // ======================================================================
  // COMERCIANTES (B2B)
  // ======================================================================
  app.post('/api/comerciantes/cadastro', authLimiter, async (req, res) => {
    const b = req.body || {};
    const nomeNegocio = texto(b.nome_negocio, 120);
    const contato = texto(b.contato_nome, 80);
    const email = texto(b.email, 254).toLowerCase();
    const whatsapp = texto(b.whatsapp, 20).replace(/[^\d+() -]/g, '');
    if (!nomeNegocio || !contato || !email || whatsapp.replace(/\D/g, '').length < 10) {
      return falha(res, 400, 'Preencha nome do negócio, contato, e-mail e WhatsApp (com DDD).');
    }
    if (!validarEmail(email)) return falha(res, 400, 'E-mail inválido.');

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const cupom = 'PARCEIRO20-' + crypto.randomBytes(2).toString('hex').toUpperCase();
      try {
        const r = await db.run(
          `INSERT INTO comerciantes (nome_negocio, contato_nome, email, whatsapp, cnpj_cpf, tipo_negocio, cupom_gerado)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [nomeNegocio, contato, email, whatsapp, texto(b.cnpj_cpf, 20), texto(b.tipo_negocio, 40), cupom]
        );
        auditar(email, 'comerciante_cadastrado', { comerciante_id: r.lastID }, req.ip);
        return res.json({
          sucesso: true,
          comerciante_id: r.lastID,
          cupom_gerado: cupom,
          link_grupo_whatsapp: config.whatsapp.grupoVip || null,
          mensagem: 'Cadastro realizado! Seu cupom de parceiro já está ativo.'
        });
      } catch (e) {
        if (!/UNIQUE/i.test(e.message)) throw e; // colisão de cupom: tenta outro código
      }
    }
    falha(res, 500, 'Não foi possível gerar o cupom. Tente novamente.');
  });

  app.get('/api/comerciantes/promocoes', async (req, res) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const promocoes = await db.all(
      `SELECT id, titulo, descricao, cupom, desconto_pct, minimo_unidades, valido_ate
       FROM promocoes_comerciantes
       WHERE ativo = 1 AND (valido_ate IS NULL OR valido_ate >= ?) ORDER BY desconto_pct DESC`, [hoje]);
    res.json({ sucesso: true, promocoes });
  });

  // ======================================================================
  // ADMIN
  // ======================================================================
  app.post('/api/admin/login', authLimiter, async (req, res) => {
    if (!config.adminEmail || !config.adminPasswordHash) return falha(res, 503, 'Painel admin não configurado.');
    const email = texto(req.body?.email, 254).toLowerCase();
    const senha = String(req.body?.senha ?? '');
    const emailOk = email === config.adminEmail.toLowerCase();
    const senhaOk = await bcrypt.compare(senha, config.adminPasswordHash);
    if (!emailOk || !senhaOk) {
      auditar(email || 'desconhecido', 'admin_login_falhou', {}, req.ip);
      return falha(res, 401, 'Credenciais inválidas.');
    }
    const token = jwt.sign({ id: 0, email: config.adminEmail, role: 'admin' }, config.jwtSecret, { expiresIn: '8h' });
    auditar(config.adminEmail, 'admin_login', {}, req.ip);
    res.json({ sucesso: true, token });
  });

  app.get('/api/admin/pedidos', autenticar, apenasAdmin, async (req, res) => {
    const rows = await db.all('SELECT * FROM pedidos ORDER BY id DESC LIMIT 500');
    res.json({ sucesso: true, pedidos: rows });
  });

  app.patch('/api/admin/pedidos/:id', autenticar, apenasAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedido) return falha(res, 404, 'Pedido não encontrado.');

    const { status } = req.body || {};
    const rastreio = req.body?.codigo_rastreio === undefined ? undefined : texto(req.body.codigo_rastreio, 60);
    if (status !== undefined && !STATUS_PEDIDO.includes(status)) return falha(res, 400, 'Status inválido.');
    if (status === undefined && rastreio === undefined) return falha(res, 400, 'Nada a atualizar.');

    if (rastreio !== undefined) {
      await db.run('UPDATE pedidos SET codigo_rastreio = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?', [rastreio, id]);
    }
    if (status && status !== pedido.status) {
      if (status === 'cancelado') {
        await cancelarPedido(id, 'cancelado_pelo_admin', config.adminEmail, req.ip);
      } else {
        if (pedido.status === 'cancelado') await reservarNovamente(pedido);
        await db.run('UPDATE pedidos SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
      }
      auditar(config.adminEmail, 'admin_status_pedido', { pedido_id: id, de: pedido.status, para: status }, req.ip);

      const u = await db.get('SELECT id, nome, email FROM usuarios WHERE id = ?', [pedido.usuario_id]);
      if (u && status === 'pago') emailSvc.enviarPagamentoAprovado({ id, total: pedido.total }, u);
      if (u && status === 'enviado') {
        const atual = await db.get('SELECT codigo_rastreio FROM pedidos WHERE id = ?', [id]);
        emailSvc.enviarPedidoEnviado({ id }, u, atual?.codigo_rastreio);
      }
    }
    res.json({ sucesso: true });
  });

  function validarProduto(b, parcial) {
    const falta = c => !parcial && (b[c] === undefined || b[c] === '');
    if (falta('nome') || (b.nome !== undefined && texto(b.nome, 120).length < 2)) return 'Nome inválido.';
    if (falta('categoria') || (b.categoria !== undefined && !CATEGORIAS.includes(b.categoria))) {
      return `Categoria inválida. Use: ${CATEGORIAS.join(', ')}.`;
    }
    if (falta('preco') || (b.preco !== undefined && !(Number(b.preco) > 0 && Number(b.preco) <= 100000))) return 'Preço inválido.';
    if (b.preco_original != null && b.preco_original !== '' && !(Number(b.preco_original) > 0)) return 'Preço original inválido.';
    if (b.estoque !== undefined && !(Number.isInteger(Number(b.estoque)) && Number(b.estoque) >= 0)) return 'Estoque inválido.';
    if (b.imagem && !/^(https:\/\/|\/)[^\s"'<>]+$/.test(b.imagem)) return 'Imagem deve ser uma URL https:// ou um caminho iniciado por /.';
    if (b.ativo !== undefined && ![0, 1, true, false].includes(b.ativo)) return 'Campo "ativo" inválido.';
    return null;
  }

  app.get('/api/admin/produtos', autenticar, apenasAdmin, async (req, res) => {
    res.json({ sucesso: true, produtos: await db.all('SELECT * FROM produtos ORDER BY id') });
  });

  app.post('/api/admin/produtos', autenticar, apenasAdmin, async (req, res) => {
    const b = req.body || {};
    const erro = validarProduto(b, false);
    if (erro) return falha(res, 400, erro);
    const r = await db.run(
      'INSERT INTO produtos (nome, categoria, descricao, preco, preco_original, imagem, estoque) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [texto(b.nome, 120), b.categoria, texto(b.descricao, 1000), Number(b.preco),
       b.preco_original ? Number(b.preco_original) : null, texto(b.imagem, 500), Number(b.estoque) || 0]
    );
    auditar(config.adminEmail, 'admin_produto_criado', { produto_id: r.lastID }, req.ip);
    res.json({ sucesso: true, produto_id: r.lastID });
  });

  app.patch('/api/admin/produtos/:id', autenticar, apenasAdmin, async (req, res) => {
    const b = req.body || {};
    const erro = validarProduto(b, true);
    if (erro) return falha(res, 400, erro);
    const campos = ['nome', 'categoria', 'descricao', 'preco', 'preco_original', 'imagem', 'estoque', 'ativo'];
    const sets = [];
    const vals = [];
    for (const c of campos) {
      if (b[c] === undefined) continue;
      let v = b[c];
      if (['preco', 'preco_original'].includes(c)) v = v === null || v === '' ? null : Number(v);
      if (c === 'estoque') v = Number(v);
      if (c === 'ativo') v = v ? 1 : 0;
      sets.push(`${c} = ?`);
      vals.push(v);
    }
    if (!sets.length) return falha(res, 400, 'Nada a atualizar.');
    vals.push(Number(req.params.id));
    const r = await db.run(`UPDATE produtos SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (r.changes === 0) return falha(res, 404, 'Produto não encontrado.');
    auditar(config.adminEmail, 'admin_produto_editado', { produto_id: Number(req.params.id), campos: Object.keys(b) }, req.ip);
    res.json({ sucesso: true });
  });

  app.get('/api/admin/auditoria', autenticar, apenasAdmin, async (req, res) => {
    res.json({ sucesso: true, auditoria: await db.all('SELECT * FROM auditoria ORDER BY id DESC LIMIT 200') });
  });

  // ======================================================================
  // SAÚDE, 404 DE API E FALLBACK DO SITE
  // ======================================================================
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, env: config.env, email: config.smtp.host ? 'smtp' : 'console', gateway: pagSvc.habilitado });
  });

  app.use('/api', (req, res) => falha(res, 404, 'Rota não encontrada.'));

  // Express 5: curinga precisa de nome ("/{*splat}"); "*" sozinho derruba o servidor.
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return falha(res, 400, 'JSON inválido.');
    if (err.type === 'entity.too.large') return falha(res, 413, 'Requisição grande demais.');
    console.error('Erro não tratado:', err);
    if (res.headersSent) return next(err);
    falha(res, 500, 'Erro interno. Tente novamente.');
  });

  // ---------- expiração de pedidos não pagos ----------
  async function expirarPedidosPendentes() {
    const horas = config.comercial.pedidoExpiraHoras;
    if (!horas) return;
    const limite = new Date(Date.now() - horas * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
    const vencidos = await db.all(
      "SELECT id FROM pedidos WHERE status = 'aguardando_pagamento' AND criado_em < ?", [limite]);
    for (const p of vencidos) await cancelarPedido(p.id, `expirado_${horas}h`, 'sistema', '');
    if (vencidos.length) console.log(`⌛ ${vencidos.length} pedido(s) não pago(s) cancelado(s); estoque devolvido.`);
  }

  app.locals.expirarPedidosPendentes = expirarPedidosPendentes;
  return app;
}

async function main() {
  const db = dbLib.abrir(config.dbPath);
  await dbLib.iniciarEsquema(db);
  const app = criarApp(db);

  const servidor = app.listen(config.port, () => {
    console.log(`🌿 Loja Verde [${config.env}] — ${config.baseUrl}`);
    console.log(`   E-mail: ${config.smtp.host || 'console (dev)'} | Pagamento: ${pagSvc.habilitado ? 'Mercado Pago ativo' : 'desligado'}`);
    if (!config.adminEmail || !config.adminPasswordHash) console.log('   Admin: não configurado (veja o README).');
  });

  const rotina = () => app.locals.expirarPedidosPendentes().catch(e => console.error('Falha ao expirar pedidos:', e.message));
  rotina();
  setInterval(rotina, 30 * 60 * 1000).unref();

  const encerrar = () => {
    console.log('Encerrando…');
    servidor.close(async () => { await db.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on('SIGTERM', encerrar);
  process.on('SIGINT', encerrar);
}

if (require.main === module) {
  main().catch(e => { console.error('❌ Falha ao iniciar:', e); process.exit(1); });
}

module.exports = { criarApp };
