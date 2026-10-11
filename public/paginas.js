/**
 * LOJA VERDE — Páginas auxiliares: Comerciantes & Grupo VIP, Central de Ajuda e Clube de Assinatura.
 * Depende de script.js (esc, API_BASE, WHATSAPP_NUMERO, copiarCupom, showToast, showPage).
 */

function renderizarPerfil() {
  const content = document.getElementById("content");
  if (!content) return;
  const u = lerJSON("usuario_lv", {}) || {};
  const email = u.email || "";
  const avatar = localStorage.getItem("avatar_lv_" + email) || "";
  const prefs = lerJSON("prefs_lv", { email: true, whatsapp: true });
  const inicial = esc((u.nome || "?").trim().charAt(0).toUpperCase());

  content.innerHTML = `
    <div class="perfil-layout">
      <aside class="perfil-menu">
        <div class="perfil-identidade">
          <label class="perfil-foto-wrap" title="Trocar foto">
            ${avatar
              ? `<img id="perfilFoto" src="${avatar}" alt="Foto de ${esc(u.nome || "perfil")}">`
              : `<span class="perfil-iniciais" id="perfilIniciais">${inicial}</span><img id="perfilFoto" class="hidden" alt="">`}
            <input type="file" id="inputFotoPerfil" accept="image/jpeg,image/png,image/webp" hidden>
            <span class="perfil-foto-acao"><i class="fa fa-camera"></i></span>
          </label>
          <strong>${esc(u.nome || "Minha conta")}</strong>
          <span>${esc(email)}</span>
        </div>
        <button type="button" class="perfil-tab ativo" data-aba="pedidos"><i class="fa fa-box"></i> Pedidos</button>
        <button type="button" class="perfil-tab" data-aba="avaliacoes"><i class="fa fa-star"></i> Avaliações</button>
        <button type="button" class="perfil-tab" data-aba="devolucoes"><i class="fa fa-rotate-left"></i> Devoluções</button>
        <button type="button" class="perfil-tab" data-aba="config"><i class="fa fa-gear"></i> Configurações</button>
        <button type="button" class="perfil-tab sair" id="btnSairPerfil"><i class="fa fa-right-from-bracket"></i> Sair</button>
      </aside>
      <section class="perfil-painel" id="perfilPainel"></section>
    </div>`;

  const input = document.getElementById("inputFotoPerfil");
  input.addEventListener("change", () => {
    const arq = input.files && input.files[0];
    if (!arq) return;
    if (arq.size > 900000) {
      showToast("toastFavorito", "Use uma imagem de até 900 KB.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      localStorage.setItem("avatar_lv_" + email, String(leitor.result));
      atualizarHeaderUsuario();
      renderizarPerfil();
      abrirAbaPerfil("config");
      showToast("toastCarrinho", "Foto de perfil salva.");
    };
    leitor.readAsDataURL(arq);
  });

  document.querySelectorAll(".perfil-tab[data-aba]").forEach(btn => {
    btn.addEventListener("click", () => abrirAbaPerfil(btn.dataset.aba));
  });
  document.getElementById("btnSairPerfil").addEventListener("click", () => {
    if (window.AUTH_LV) window.AUTH_LV.limparSessao();
    showPage("home");
    showToast("toastCarrinho", "Você saiu da conta.");
  });

  abrirAbaPerfil("pedidos", { usuario: u, prefs });
}

function abrirAbaPerfil(aba, ctx) {
  document.querySelectorAll(".perfil-tab[data-aba]").forEach(b => b.classList.toggle("ativo", b.dataset.aba === aba));
  const painel = document.getElementById("perfilPainel");
  if (!painel) return;
  if (aba === "avaliacoes") painelAvaliacoes(painel);
  else if (aba === "devolucoes") painelDevolucoes(painel);
  else if (aba === "config") painelConfig(painel);
  else painelPedidos(painel);
}

async function painelPedidos(painel) {
  painel.innerHTML = `<h2>Meus pedidos</h2><p class="perfil-sub">Acompanhe pagamento, separação e entrega.</p><div id="listaPedidosPerfil"><p>Carregando…</p></div>`;
  const r = await fetch(`${API_BASE}/api/pedidos/meus`, { headers: cabecalhosApi() })
    .then(x => x.json().then(d => ({ http: x.status, ...d }))).catch(() => null);
  const alvo = document.getElementById("listaPedidosPerfil");
  if (!alvo) return;
  if (!r || r.http === 401) {
    alvo.innerHTML = `<p>Entre novamente para ver seus pedidos.</p>`;
    return;
  }
  if (!r.pedidos || !r.pedidos.length) {
    alvo.innerHTML = `<p>Você ainda não fez nenhum pedido.</p><button type="button" class="btn-hero-primary" onclick="showPage('home')">Ver plantas</button>`;
    return;
  }
  const rotulo = {
    aguardando_pagamento: "Aguardando pagamento", pago: "Pago", separando: "Em separação",
    enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado", reembolsado: "Reembolsado"
  };
  alvo.innerHTML = r.pedidos.map(p => `
    <article class="pedido-card">
      <div>
        <strong>Pedido #${p.id}</strong>
        <span>${esc(rotulo[p.status] || p.status)}</span>
        ${p.codigo_rastreio ? `<small>Rastreio: ${esc(p.codigo_rastreio)}</small>` : ""}
      </div>
      <strong>${fmtBRL(p.total)}</strong>
    </article>`).join("");
}

function painelAvaliacoes(painel) {
  const lista = lerJSON("avaliacoes_lv", []);
  const opcoes = produtos.map(p => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
  painel.innerHTML = `
    <h2>Avaliações</h2>
    <p class="perfil-sub">Conte como a planta chegou. Fica salva na sua conta neste aparelho.</p>
    <form id="formAval" class="perfil-form">
      <label>Produto<select id="avProduto" required>${opcoes}</select></label>
      <label>Nota
        <select id="avNota"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
      </label>
      <label>Comentário<textarea id="avTexto" maxlength="400" required placeholder="Frescor, embalagem, tamanho…"></textarea></label>
      <button type="submit" class="btn-buy-now">Publicar avaliação</button>
    </form>
    <div class="perfil-lista">${lista.map(a => `
      <article class="pedido-card">
        <div><strong>${esc(a.nome)}</strong><span>${"★".repeat(a.nota)}${"☆".repeat(5 - a.nota)}</span><p>${esc(a.texto)}</p></div>
        <small>${esc(a.data)}</small>
      </article>`).join("") || "<p>Nenhuma avaliação ainda.</p>"}</div>`;
  document.getElementById("formAval").addEventListener("submit", e => {
    e.preventDefault();
    const id = Number(document.getElementById("avProduto").value);
    const p = produtos.find(x => x.id === id);
    const item = {
      id, nome: p ? p.nome : "Produto",
      nota: Number(document.getElementById("avNota").value),
      texto: document.getElementById("avTexto").value.trim(),
      data: new Date().toLocaleDateString("pt-BR")
    };
    if (item.texto.length < 4) return;
    const atual = lerJSON("avaliacoes_lv", []);
    atual.unshift(item);
    salvarJSON("avaliacoes_lv", atual.slice(0, 30));
    showToast("toastCarrinho", "Avaliação guardada.");
    painelAvaliacoes(painel);
  });
}

function painelDevolucoes(painel) {
  const lista = lerJSON("devolucoes_lv", []);
  painel.innerHTML = `
    <h2>Devoluções</h2>
    <p class="perfil-sub">Garantia Planta Viva de 30 dias. Envie o pedido e o motivo — a equipe analisa em até 2 dias úteis. <a href="/trocas.html">Ver regras</a>.</p>
    <form id="formDev" class="perfil-form">
      <label>Número do pedido<input id="devPedido" inputmode="numeric" required placeholder="Ex.: 12"></label>
      <label>Motivo
        <select id="devMotivo">
          <option>Planta chegou comprometida</option>
          <option>Item diferente do pedido</option>
          <option>Atraso na entrega</option>
          <option>Arrependimento (7 dias)</option>
        </select>
      </label>
      <label>Detalhes<textarea id="devTexto" maxlength="500" required placeholder="O que aconteceu e quando."></textarea></label>
      <button type="submit" class="btn-buy-now">Abrir solicitação</button>
    </form>
    <div class="perfil-lista">${lista.map(d => `
      <article class="pedido-card">
        <div><strong>Pedido #${esc(String(d.pedido))}</strong><span>${esc(d.motivo)}</span><p>${esc(d.texto)}</p></div>
        <small>${esc(d.status)} · ${esc(d.data)}</small>
      </article>`).join("") || "<p>Nenhuma devolução aberta.</p>"}</div>`;
  document.getElementById("formDev").addEventListener("submit", e => {
    e.preventDefault();
    const item = {
      pedido: document.getElementById("devPedido").value.trim(),
      motivo: document.getElementById("devMotivo").value,
      texto: document.getElementById("devTexto").value.trim(),
      status: "Em análise",
      data: new Date().toLocaleDateString("pt-BR")
    };
    const atual = lerJSON("devolucoes_lv", []);
    atual.unshift(item);
    salvarJSON("devolucoes_lv", atual.slice(0, 20));
    showToast("toastCarrinho", "Solicitação registrada.");
    painelDevolucoes(painel);
  });
}

function painelConfig(painel) {
  const prefs = lerJSON("prefs_lv", { email: true, whatsapp: true });
  const u = lerJSON("usuario_lv", {}) || {};
  painel.innerHTML = `
    <h2>Configurações</h2>
    <p class="perfil-sub">Avisos e acesso da conta ${esc(u.email || "")}.</p>
    <form id="formPrefs" class="perfil-form">
      <label class="check-linha"><input type="checkbox" id="prefEmail" ${prefs.email ? "checked" : ""}> Receber atualização de pedido por e-mail</label>
      <label class="check-linha"><input type="checkbox" id="prefZap" ${prefs.whatsapp ? "checked" : ""}> Receber aviso de entrega por WhatsApp</label>
      <button type="submit" class="btn-buy-now">Salvar preferências</button>
    </form>
    <p class="perfil-sub" style="margin-top:22px;">Para trocar a senha, saia e use “Esqueci minha senha” na tela de entrada.</p>
    <button type="button" class="btn-add-cart-outline" onclick="abrirModalLogin('recuperar')">Redefinir senha</button>`;
  document.getElementById("formPrefs").addEventListener("submit", e => {
    e.preventDefault();
    salvarJSON("prefs_lv", {
      email: document.getElementById("prefEmail").checked,
      whatsapp: document.getElementById("prefZap").checked
    });
    showToast("toastCarrinho", "Preferências salvas.");
  });
}

function renderizarComerciantes() {
  const content = document.getElementById("content");
  if (!content) return;

  content.innerHTML = `
    <div class="comerciantes-page-container">
      <section class="comerciantes-hero">
        <span class="comerciantes-hero-badge"><i class="fa fa-briefcase"></i> Para comerciantes</span>
        <h2>Compre no atacado e revenda plantas com margem</h2>
        <p>Restaurantes, floriculturas, paisagistas e condomínios recebem cupom exclusivo, lotes promocionais e acesso ao nosso Grupo VIP.</p>
        <button type="button" class="btn-hero-primary" onclick="document.getElementById('formComerciante').scrollIntoView({behavior:'smooth'})">Quero ser parceiro</button>
      </section>

      <div id="vipSlot"></div>

      <section class="fluxo-grupo">
        <h3>Fluxo de compras do grupo</h3>
        <p>Do pedido ao recebimento, o mesmo caminho da loja. A equipe acompanha os números reais no painel interno.</p>
        <ol class="fluxo-passos">
          <li><strong>1. Conta</strong><span>Cliente entra para ver o carrinho.</span></li>
          <li><strong>2. Pedido</strong><span>Itens, endereço e pagamento.</span></li>
          <li><strong>3. Pagamento</strong><span>Pix, cartão ou boleto.</span></li>
          <li><strong>4. Separação</strong><span>Embalagem ventilada no viveiro.</span></li>
          <li><strong>5. Entrega</strong><span>Rastreio na conta do cliente.</span></li>
        </ol>
        <a class="btn-add-cart-outline" href="/admin.html">Abrir painel da equipe</a>
      </section>

      <section class="comerciantes-vantagens-grid" aria-label="Vantagens">
        <div class="comerciante-vantagem-card"><span style="font-size:1.8rem;">🏷️</span><strong>Cupom de parceiro</strong><p>20% de desconto gerado na hora do cadastro.</p></div>
        <div class="comerciante-vantagem-card"><span style="font-size:1.8rem;">📦</span><strong>Lotes promocionais</strong><p>Caixas fechadas com desconto por volume.</p></div>
        <div class="comerciante-vantagem-card"><span style="font-size:1.8rem;">🌿</span><strong>Qualidade garantida</strong><p>Plantas selecionadas e Garantia Planta Viva.</p></div>
        <div class="comerciante-vantagem-card"><span style="font-size:1.8rem;">💬</span><strong>Atendimento direto</strong><p>Fale com a gente pelo WhatsApp.</p></div>
      </section>

      <section class="b2b-promos-section">
        <h3 style="font-family: var(--fonte-titulo); font-size: 1.7rem; color: var(--verde-escuro); margin-bottom: 18px;">Promoções de atacado</h3>
        <div id="listaPromosB2B" class="b2b-promos-grid"><p style="color:var(--texto-claro);">Carregando promoções…</p></div>
      </section>

      <section class="comerciante-form-section" id="formComerciante">
        <h3 style="font-family: var(--fonte-titulo); font-size: 1.6rem; color: var(--verde-escuro);">Cadastro de parceiro</h3>
        <p style="color: var(--texto-secundario); margin-top: 4px;">Preencha os dados e receba seu cupom <strong>PARCEIRO20</strong> imediatamente.</p>
        <form id="formCadastroComerciante" novalidate>
          <div class="comerciante-form-grid">
            <div class="form-group-b2b"><label for="cNegocio">Nome do negócio *</label><input id="cNegocio" maxlength="120" required></div>
            <div class="form-group-b2b"><label for="cContato">Seu nome *</label><input id="cContato" maxlength="80" autocomplete="name" required></div>
            <div class="form-group-b2b"><label for="cEmail">E-mail *</label><input id="cEmail" type="email" autocomplete="email" required></div>
            <div class="form-group-b2b"><label for="cWhats">WhatsApp com DDD *</label><input id="cWhats" type="tel" maxlength="20" autocomplete="tel" placeholder="(11) 90000-0000" required></div>
            <div class="form-group-b2b"><label for="cDoc">CNPJ ou CPF (opcional)</label><input id="cDoc" maxlength="20"></div>
            <div class="form-group-b2b"><label for="cTipo">Tipo de negócio</label>
              <select id="cTipo">
                <option>Restaurante</option><option>Floricultura</option><option>Paisagismo</option>
                <option>Condomínio / Escritório</option><option>Loja / Revenda</option><option>Outro</option>
              </select>
            </div>
          </div>
          <p style="font-size:.8rem;color:var(--texto-claro);margin-top:14px;">Ao enviar, você concorda com a <a href="/privacidade.html" target="_blank" rel="noopener" style="text-decoration:underline;">Política de Privacidade</a>.</p>
          <p id="cMsg" class="auth-msg" role="alert"></p>
          <button type="submit" class="btn-buy-now" style="margin-top:8px;padding:14px 34px;">Cadastrar e gerar cupom</button>
        </form>
      </section>
    </div>
  `;

  carregarPromocoesB2B();

  document.getElementById("formCadastroComerciante").addEventListener("submit", async e => {
    e.preventDefault();
    const msg = document.getElementById("cMsg");
    const btn = e.target.querySelector("button[type=submit]");
    const dados = {
      nome_negocio: document.getElementById("cNegocio").value.trim(),
      contato_nome: document.getElementById("cContato").value.trim(),
      email: document.getElementById("cEmail").value.trim(),
      whatsapp: document.getElementById("cWhats").value.trim(),
      cnpj_cpf: document.getElementById("cDoc").value.trim(),
      tipo_negocio: document.getElementById("cTipo").value
    };
    if (!dados.nome_negocio || !dados.contato_nome || !dados.email || !dados.whatsapp) {
      msg.style.color = "#C62828";
      msg.textContent = "Preencha os campos obrigatórios (*).";
      return;
    }
    btn.disabled = true;
    try {
      const r = await fetch(`${API_BASE}/api/comerciantes/cadastro`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados)
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.sucesso) {
        msg.style.color = "#C62828";
        msg.textContent = d.mensagem || "Não foi possível concluir o cadastro.";
        return;
      }
      msg.style.color = "var(--sucesso)";
      msg.innerHTML = `✅ ${esc(d.mensagem)} Seu cupom: <strong class="cupom-pill-tag">${esc(d.cupom_gerado)}</strong>`;
      document.getElementById("vipSlot").innerHTML = d.link_grupo_whatsapp && /^https:\/\//.test(d.link_grupo_whatsapp) ? `
        <section class="vip-whatsapp-card">
          <div class="vip-whatsapp-content"><h3>Bem-vindo ao Grupo VIP! 🎉</h3><p>Entre agora para receber ofertas de atacado em primeira mão.</p></div>
          <a class="btn-entrar-grupo-vip" href="${esc(d.link_grupo_whatsapp)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Entrar no grupo</a>
        </section>` : "";
      copiarCupom(d.cupom_gerado);
      e.target.reset();
    } catch {
      msg.style.color = "#C62828";
      msg.textContent = "Sem conexão com o servidor. Tente novamente.";
    } finally {
      btn.disabled = false;
    }
  });
}

async function carregarPromocoesB2B() {
  const alvo = document.getElementById("listaPromosB2B");
  if (!alvo) return;
  try {
    const r = await fetch(`${API_BASE}/api/comerciantes/promocoes`);
    const d = await r.json();
    if (!d.promocoes || d.promocoes.length === 0) {
      alvo.innerHTML = `<p style="color:var(--texto-secundario);">Nenhuma promoção ativa no momento. Fale conosco pelo WhatsApp!</p>`;
      return;
    }
    alvo.innerHTML = d.promocoes.map(p => `
      <article class="b2b-promo-card">
        <div>
          <span class="b2b-promo-badge">${Number(p.desconto_pct)}% OFF</span>
          <h4>${esc(p.titulo)}</h4>
          <p>${esc(p.descricao)}</p>
        </div>
        <div class="b2b-promo-footer">
          <div><span class="cupom-pill-tag">${esc(p.cupom)}</span>
            <div style="font-size:.78rem;color:var(--texto-claro);margin-top:4px;">mín. ${Number(p.minimo_unidades)} un.${p.valido_ate ? ` • até ${esc(String(p.valido_ate).split("-").reverse().join("/"))}` : ""}</div></div>
          <button type="button" class="btn-add-cart-outline" style="padding:8px 16px;" onclick="copiarCupom('${esc(p.cupom)}')">Usar cupom</button>
        </div>
      </article>`).join("");
  } catch {
    alvo.innerHTML = `<p style="color:#C62828;">Não foi possível carregar as promoções agora.</p>`;
  }
}

function renderizarAtendimento() {
  const content = document.getElementById("content");
  if (!content) return;
  const item = (p, r) => `<details class="auth-faq"><summary>${p}</summary><p>${r}</p></details>`;
  content.innerHTML = `
    <div style="max-width:820px;margin:0 auto;">
      <h2 style="font-family: var(--fonte-titulo); font-size: 2rem; color: var(--verde-escuro); margin-bottom: 8px;">Central de Ajuda 💚</h2>
      <p style="color:var(--texto-secundario);margin-bottom:22px;">Respostas rápidas. Se não achar o que precisa, chame a gente!</p>
      <div style="background:#fff;border-radius:20px;padding:12px 22px;margin-bottom:22px;">
        ${item("Quais as formas de pagamento?", "Pix (com 5% de desconto), cartão de crédito em até 3x e boleto bancário, processados pelo Mercado Pago.")}
        ${item("Qual o valor do frete?", "Frete grátis em compras a partir de R$ 99. Abaixo disso, o frete é de R$ 15,00. Veja os prazos em <a href='/entrega.html' style='text-decoration:underline;'>Entrega e Áreas</a>.")}
        ${item("E se a planta chegar com problema?", "Você conta com a Garantia Planta Viva de 30 dias. Veja as regras em <a href='/trocas.html' style='text-decoration:underline;'>Trocas e Devoluções</a>.")}
        ${item("Como uso o cupom VERDE10?", "Ele vale 10% de desconto na primeira compra. Cole o código no carrinho e toque em Aplicar.")}
        ${item("Esqueci minha senha.", "Clique em “Entrar” e depois em “Esqueci minha senha”. Enviaremos um link para o seu e-mail.")}
        ${item("Como acompanho meu pedido?", "Entre na sua conta e abra “Minha conta”: lá aparecem o status e o código de rastreio.")}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a class="btn-confirm-whatsapp-order" style="padding:13px 24px;" href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá! Preciso de ajuda com a Loja Verde 🌿")}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Falar no WhatsApp</a>
        <a class="btn-add-cart-outline" style="padding:13px 24px;" href="mailto:contato@lojaverde.com.br"><i class="fa fa-envelope"></i> contato@lojaverde.com.br</a>
      </div>
    </div>
  `;
}

function assinarPlano(plano) {
  const precos = { Semanal: "R$ 49,90 por semana", Quinzenal: "R$ 59,90 por quinzena" };
  const texto = `Olá! Quero assinar a Cesta ${plano} do Clube da Cesta Verde (${precos[plano] || ""}). Pode me passar os próximos passos? 🥬`;
  if (typeof fecharModalAssinatura === "function") fecharModalAssinatura();
  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}
