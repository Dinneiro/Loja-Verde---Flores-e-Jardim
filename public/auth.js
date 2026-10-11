/**
 * LOJA VERDE — Autenticação no navegador
 * Depende de script.js (esc, API_BASE, cabecalhosApi, showToast, atualizarHeaderUsuario).
 * Sessão: localStorage "token_lv" (JWT) e "usuario_lv" ({id, nome, email}).
 */
(function () {
  "use strict";

  const ROTULOS_STATUS = {
    aguardando_pagamento: "Aguardando pagamento",
    pago: "Pago",
    separando: "Em separação",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
    reembolsado: "Reembolsado"
  };

  let emailPendente = sessionStorage.getItem("email_pendente_lv") || "";
  let aoConcluirLogin = null;
  let tokenRedefinicao = "";
  let timerReenvio = null;

  const corpo = () => document.getElementById("loginModalBody");
  const msg = (texto, ok) => {
    const el = document.getElementById("authMsg");
    if (!el) return;
    el.textContent = texto || "";
    el.style.color = ok ? "var(--sucesso)" : "#C62828";
  };

  function sessaoAtiva() {
    return !!localStorage.getItem("token_lv") && !!lerJSON("usuario_lv", null);
  }

  function salvarSessao(token, u) {
    localStorage.setItem("token_lv", token);
    localStorage.setItem("usuario_lv", JSON.stringify({ id: u.id, nome: u.nome, email: u.email }));
    atualizarHeaderUsuario();
  }

  function limparSessao() {
    localStorage.removeItem("token_lv");
    localStorage.removeItem("usuario_lv");
    localStorage.removeItem("checkout_rascunho_lv");
    rascunhoCheckout = { endereco: "", whatsapp: "", msg: "", data: "" };
    atualizarHeaderUsuario();
  }

  async function post(caminho, dados) {
    try {
      const r = await fetch(`${API_BASE}/api/${caminho}`, {
        method: "POST", headers: cabecalhosApi(), body: JSON.stringify(dados)
      });
      const d = await r.json().catch(() => ({}));
      return Object.assign({ mensagem: "" }, d, { http: r.status, sucesso: d.sucesso === true });
    } catch {
      return { sucesso: false, http: 0, mensagem: "Sem conexão com o servidor. Tente novamente." };
    }
  }

  function ocupado(botao, texto, on) {
    if (!botao) return;
    if (on) { botao.dataset.rotulo = botao.textContent; botao.textContent = texto; botao.disabled = true; }
    else { botao.textContent = botao.dataset.rotulo || botao.textContent; botao.disabled = false; }
  }

  function desenhar(html) {
    clearInterval(timerReenvio);
    corpo().innerHTML = html;
    const primeiro = corpo().querySelector("input:not([type=checkbox]), button.btn-buy-now");
    if (primeiro) setTimeout(() => primeiro.focus(), 30);
  }

  function cabecalho(icone, titulo, texto) {
    return `
      <div class="otp-verification-box">
        <div class="otp-icon-wrap"><i class="fa ${icone}"></i></div>
        <h3 style="font-family: var(--fonte-titulo); font-size: 1.5rem; color: var(--verde-escuro); margin-bottom: 6px;">${titulo}</h3>
        <p style="color: var(--texto-secundario); font-size: .92rem;">${texto}</p>
      </div>`;
  }

  const campo = (id, rotulo, tipo, extra) => `
    <div class="form-group-b2b" style="margin-bottom:12px;">
      <label for="${id}">${rotulo}</label>
      <input id="${id}" name="${id}" type="${tipo}" ${extra || ""}>
    </div>`;

  // ---------------------------------------------------------------- telas
  function telaLogin(emailInicial) {
    desenhar(`
      ${cabecalho("fa-user", "Entrar na Loja Verde", "Acesse sua conta para finalizar o pedido e acompanhar entregas.")}
      <form id="formLogin" class="auth-form" novalidate>
        ${campo("loginEmail", "E-mail", "email", `autocomplete="username" required value="${esc(emailInicial || "")}"`)}
        ${campo("loginSenha", "Senha", "password", `autocomplete="current-password" required`)}
        <p id="authMsg" class="auth-msg" role="alert"></p>
        <button type="submit" class="btn-buy-now" style="width:100%;">Entrar</button>
      </form>
      <div class="auth-links">
        <button type="button" data-ir="recuperar">Esqueci minha senha</button>
        <button type="button" data-ir="registro">Criar conta</button>
      </div>`);

    document.getElementById("formLogin").addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const senha = document.getElementById("loginSenha").value;
      if (!email || !senha) return msg("Informe e-mail e senha.");
      const btn = e.target.querySelector("button[type=submit]");
      ocupado(btn, "Entrando…", true);
      const r = await post("auth/login", { email, senha });
      ocupado(btn, "", false);
      if (r.sucesso) return concluirLogin(r);
      if (r.precisa_verificar) {
        emailPendente = r.email || email;
        sessionStorage.setItem("email_pendente_lv", emailPendente);
        return telaOtp("Seu e-mail ainda não foi confirmado. Peça um novo código abaixo.");
      }
      msg(r.mensagem || "Não foi possível entrar.");
    });
  }

  function telaRegistro() {
    desenhar(`
      ${cabecalho("fa-seedling", "Criar conta", `Ganhe <strong>${esc("10%")}</strong> na primeira compra com o cupom <strong>VERDE10</strong>.`)}
      <form id="formRegistro" class="auth-form" novalidate>
        ${campo("regNome", "Nome completo", "text", `autocomplete="name" maxlength="80" required`)}
        ${campo("regEmail", "E-mail", "email", `autocomplete="email" required`)}
        ${campo("regSenha", "Senha (mínimo 8 caracteres)", "password", `autocomplete="new-password" minlength="8" required`)}
        <label class="auth-check">
          <input type="checkbox" id="regAceite">
          <span>Li e aceito os <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a> e a
          <a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a>.</span>
        </label>
        <p id="authMsg" class="auth-msg" role="alert"></p>
        <button type="submit" class="btn-buy-now" style="width:100%;">Criar conta</button>
      </form>
      <div class="auth-links"><button type="button" data-ir="login">Já tenho conta</button></div>`);

    document.getElementById("formRegistro").addEventListener("submit", async e => {
      e.preventDefault();
      const nome = document.getElementById("regNome").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const senha = document.getElementById("regSenha").value;
      if (nome.length < 2) return msg("Informe seu nome.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg("E-mail inválido.");
      if (senha.length < 8) return msg("A senha precisa ter pelo menos 8 caracteres.");
      if (!document.getElementById("regAceite").checked) return msg("Aceite os Termos e a Política de Privacidade para continuar.");
      const btn = e.target.querySelector("button[type=submit]");
      ocupado(btn, "Criando…", true);
      const r = await post("auth/registrar", { nome, email, senha });
      ocupado(btn, "", false);
      if (!r.sucesso) return msg(r.mensagem || "Não foi possível criar a conta.");
      emailPendente = r.email || email;
      sessionStorage.setItem("email_pendente_lv", emailPendente);
      telaOtp(r.mensagem, true);
    });
  }

  function telaOtp(aviso, okAviso) {
    desenhar(`
      ${cabecalho("fa-envelope-circle-check", "Confirme seu e-mail", `Digite o código de 6 dígitos enviado para <strong>${esc(emailPendente)}</strong>. Confira também o spam.`)}
      <form id="formOtp" class="auth-form" novalidate>
        <input id="otpCodigo" class="otp-digit-input" type="text" inputmode="numeric" autocomplete="one-time-code"
               maxlength="6" pattern="[0-9]*" placeholder="000000" aria-label="Código de verificação">
        <p id="authMsg" class="auth-msg" role="alert"></p>
        <button type="submit" class="btn-buy-now" style="width:100%;">Confirmar e-mail</button>
      </form>
      <div class="auth-links">
        <button type="button" id="btnReenviar" disabled>Reenviar código</button>
        <button type="button" data-ir="login">Voltar</button>
      </div>`);
    if (aviso) msg(aviso, okAviso);

    const btnReenviar = document.getElementById("btnReenviar");
    let restante = 60;
    const tique = () => {
      btnReenviar.textContent = restante > 0 ? `Reenviar código (${restante}s)` : "Reenviar código";
      btnReenviar.disabled = restante > 0;
      if (restante-- <= 0) clearInterval(timerReenvio);
    };
    tique();
    timerReenvio = setInterval(tique, 1000);

    btnReenviar.addEventListener("click", async () => {
      btnReenviar.disabled = true;
      const r = await post("auth/reenviar-codigo", { email: emailPendente });
      msg(r.mensagem || (r.sucesso ? "Novo código enviado." : "Falha ao reenviar."), r.sucesso);
      restante = 60;
      clearInterval(timerReenvio);
      timerReenvio = setInterval(tique, 1000);
      tique();
    });

    document.getElementById("otpCodigo").addEventListener("input", ev => {
      ev.target.value = ev.target.value.replace(/\D/g, "").slice(0, 6);
    });

    document.getElementById("formOtp").addEventListener("submit", async e => {
      e.preventDefault();
      const codigo = document.getElementById("otpCodigo").value.trim();
      if (codigo.length !== 6) return msg("Digite os 6 dígitos.");
      const btn = e.target.querySelector("button[type=submit]");
      ocupado(btn, "Verificando…", true);
      const r = await post("auth/verificar-email", { email: emailPendente, codigo });
      ocupado(btn, "", false);
      if (r.sucesso) {
        sessionStorage.removeItem("email_pendente_lv");
        return concluirLogin(r, "E-mail confirmado! Bem-vindo(a) 🌿");
      }
      msg(r.mensagem || "Código inválido.");
    });
  }

  function telaRecuperar() {
    desenhar(`
      ${cabecalho("fa-key", "Recuperar senha", "Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.")}
      <form id="formRecuperar" class="auth-form" novalidate>
        ${campo("recEmail", "E-mail", "email", `autocomplete="email" required`)}
        <p id="authMsg" class="auth-msg" role="alert"></p>
        <button type="submit" class="btn-buy-now" style="width:100%;">Enviar link</button>
      </form>
      <div class="auth-links"><button type="button" data-ir="login">Voltar para o login</button></div>`);

    document.getElementById("formRecuperar").addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("recEmail").value.trim();
      if (!email) return msg("Informe o e-mail.");
      const btn = e.target.querySelector("button[type=submit]");
      ocupado(btn, "Enviando…", true);
      const r = await post("auth/recuperar-senha", { email });
      ocupado(btn, "", false);
      msg(r.mensagem || "Tente novamente.", r.sucesso);
    });
  }

  function telaRedefinir() {
    desenhar(`
      ${cabecalho("fa-lock", "Nova senha", "Crie uma nova senha para a sua conta (mínimo 8 caracteres).")}
      <form id="formRedefinir" class="auth-form" novalidate>
        ${campo("novaSenha", "Nova senha", "password", `autocomplete="new-password" minlength="8" required`)}
        ${campo("novaSenha2", "Repita a nova senha", "password", `autocomplete="new-password" minlength="8" required`)}
        <p id="authMsg" class="auth-msg" role="alert"></p>
        <button type="submit" class="btn-buy-now" style="width:100%;">Salvar nova senha</button>
      </form>`);

    document.getElementById("formRedefinir").addEventListener("submit", async e => {
      e.preventDefault();
      const a = document.getElementById("novaSenha").value;
      const b = document.getElementById("novaSenha2").value;
      if (a.length < 8) return msg("A senha precisa ter pelo menos 8 caracteres.");
      if (a !== b) return msg("As senhas não conferem.");
      const btn = e.target.querySelector("button[type=submit]");
      ocupado(btn, "Salvando…", true);
      const r = await post("auth/redefinir-senha", { token: tokenRedefinicao, novaSenha: a });
      ocupado(btn, "", false);
      if (r.sucesso) {
        tokenRedefinicao = "";
        telaLogin();
        msg("Senha alterada! Entre com a nova senha.", true);
      } else {
        msg(r.mensagem || "Não foi possível redefinir.");
      }
    });
  }

  function dataBR(s) {
    const d = new Date(String(s).replace(" ", "T") + "Z");
    return isNaN(d) ? "" : d.toLocaleDateString("pt-BR");
  }

  async function telaConta() {
    const u = lerJSON("usuario_lv", {});
    desenhar(`
      ${cabecalho("fa-user-check", `Olá, ${esc((u.nome || "").split(" ")[0])}!`, esc(u.email || ""))}
      <h4 style="margin:16px 0 8px;color:var(--verde-escuro);">Meus pedidos</h4>
      <div id="listaPedidos" style="display:flex;flex-direction:column;gap:10px;"><p style="color:var(--texto-claro);">Carregando…</p></div>
      <div class="auth-links"><button type="button" id="btnSair">Sair da conta</button></div>`);

    document.getElementById("btnSair").addEventListener("click", () => {
      limparSessao();
      fecharModalLogin();
      showToast("toastCarrinho", "Você saiu da conta.");
    });

    const r = await fetch(`${API_BASE}/api/pedidos/meus`, { headers: cabecalhosApi() })
      .then(x => x.json().then(d => ({ http: x.status, ...d }))).catch(() => null);
    const alvo = document.getElementById("listaPedidos");
    if (!alvo) return;
    if (!r) { alvo.innerHTML = `<p style="color:#C62828;">Não foi possível carregar seus pedidos.</p>`; return; }
    if (r.http === 401) { limparSessao(); return telaLogin(); }
    if (!r.pedidos || r.pedidos.length === 0) {
      alvo.innerHTML = `<p style="color:var(--texto-secundario);">Você ainda não fez nenhum pedido. 🌱</p>`;
      return;
    }
    alvo.innerHTML = r.pedidos.map(p => `
      <div class="pedido-linha">
        <div>
          <strong>Pedido #${p.id}</strong> <span style="color:var(--texto-claro);font-size:.82rem;">• ${dataBR(p.criado_em)}</span><br>
          <span style="font-size:.85rem;color:var(--texto-secundario);">${p.itens.reduce((s, i) => s + i.qtd, 0)} item(ns) • ${esc(ROTULOS_STATUS[p.status] || p.status)}</span>
          ${p.codigo_rastreio ? `<br><span style="font-size:.82rem;">Rastreio: <strong>${esc(p.codigo_rastreio)}</strong></span>` : ""}
        </div>
        <strong style="color:var(--verde-escuro);">${fmtBRL(p.total)}</strong>
      </div>`).join("");
  }

  // ---------------------------------------------------------------- fluxo
  function concluirLogin(r, aviso) {
    salvarSessao(r.token, r.usuario);
    fecharModalLogin();
    showToast("toastCarrinho", aviso || `Bem-vindo(a), ${r.usuario.nome.split(" ")[0]}! 🌿`);
    const cb = aoConcluirLogin;
    aoConcluirLogin = null;
    if (typeof cb === "function") cb();
  }

  function abrirModalLogin(modo, aoConcluir) {
    if (typeof aoConcluir === "function") aoConcluirLogin = aoConcluir;
    const m = document.getElementById("modalLogin");
    if (!m) return;
    m.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    ir(modo || (sessaoAtiva() ? "conta" : "login"));
  }

  function fecharModalLogin() {
    clearInterval(timerReenvio);
    const m = document.getElementById("modalLogin");
    if (m) m.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }

  function ir(modo) {
    if (modo === "registro") telaRegistro();
    else if (modo === "recuperar") telaRecuperar();
    else if (modo === "redefinir") telaRedefinir();
    else if (modo === "otp") telaOtp();
    else if (modo === "conta") telaConta();
    else telaLogin(emailPendente);
  }

  function abrirModalOuPerfil() {
    if (sessaoAtiva() && typeof showPage === "function") showPage("perfil");
    else abrirModalLogin(sessaoAtiva() ? "conta" : "login");
  }

  // Botões "data-ir" dentro do modal (delegação: funciona após cada redesenho)
  document.addEventListener("click", e => {
    const b = e.target.closest("#loginModalBody [data-ir]");
    if (b) ir(b.dataset.ir);
  });

  // Link de recuperação de senha enviado por e-mail: /?recuperar=TOKEN
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("recuperar");
    if (!t) return;
    tokenRedefinicao = t;
    const url = new URL(window.location.href);
    url.searchParams.delete("recuperar"); // tira o token da barra de endereço
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    abrirModalLogin("redefinir");
  });

  window.abrirModalLogin = abrirModalLogin;
  window.fecharModalLogin = fecharModalLogin;
  window.abrirModalOuPerfil = abrirModalOuPerfil;
  window.AUTH_LV = { sessaoAtiva, limparSessao, abrirModalLogin };
})();
