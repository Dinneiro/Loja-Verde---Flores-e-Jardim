/**
 * LOJA VERDE — Checkout (pedido real + pagamento)
 * Depende de script.js (carrinho, cupomAplicado, metodoPagamentoAtivo, rascunhoCheckout,
 * esc, fmtBRL, showToast, capturarRascunhoCheckout, definirCupom) e de auth.js.
 */
(function () {
  "use strict";

  let pollingPix = null;

  function sobreposicao(ativo, texto) {
    let ov = document.getElementById("checkoutOverlay");
    if (!ativo) { if (ov) ov.style.display = "none"; return; }
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "checkoutOverlay";
      ov.style.cssText = "position:fixed;inset:0;background:rgba(15,33,24,.55);backdrop-filter:blur(3px);z-index:99999;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fonte-titulo);font-size:1.1rem;font-weight:700;";
      document.body.appendChild(ov);
    }
    ov.textContent = "🌱 " + (texto || "Processando…");
    ov.style.display = "flex";
  }

  function erro(texto) { showToast("toastFavorito", texto); }

  function esvaziarCarrinho() {
    carrinho = [];
    salvarJSON("carrinho_lv", carrinho);
    atualizarContadorCarrinho();
    definirCupom(null, 0);
    rascunhoCheckout.msg = "";
    rascunhoCheckout.data = "";
    salvarJSON("checkout_rascunho_lv", rascunhoCheckout);
    if (document.querySelector(".carrinho-page-wrap")) renderizarCarrinho();
  }

  function painel(html) {
    const modal = document.getElementById("modalProduto");
    const container = document.getElementById("detalhesProduto");
    if (!modal || !container) return false;
    container.innerHTML = `<div style="text-align:center;padding:16px;max-width:520px;margin:0 auto;">${html}</div>`;
    modal.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    return true;
  }

  async function finalizarPedido() {
    if (carrinho.length === 0) return erro("Seu carrinho está vazio.");

    if (!AUTH_LV.sessaoAtiva()) {
      capturarRascunhoCheckout();
      showToast("toastCarrinho", "Entre na sua conta para finalizar o pedido.");
      abrirModalLogin("login", finalizarPedido);
      return;
    }

    capturarRascunhoCheckout();
    const endereco = (rascunhoCheckout.endereco || "").trim();
    if (endereco.length < 10) {
      erro("Informe o endereço completo de entrega.");
      document.getElementById("inputEndereco")?.focus();
      return;
    }

    sobreposicao(true, "Criando seu pedido…");
    try {
      const resp = await fetch(`${API_BASE}/api/pedidos`, {
        method: "POST",
        headers: cabecalhosApi(),
        body: JSON.stringify({
          itens: carrinho.map(i => ({ id: i.id, qtd: i.qtd || 1 })),
          metodo_pagamento: metodoPagamentoAtivo,
          cupom: cupomAplicado || undefined,
          endereco_entrega: endereco,
          cliente_whatsapp: rascunhoCheckout.whatsapp || "",
          data_entrega_desejada: rascunhoCheckout.data || "",
          mensagem_cartao: rascunhoCheckout.msg || ""
        })
      });
      const d = await resp.json().catch(() => ({}));

      if (resp.status === 401) {
        AUTH_LV.limparSessao();
        abrirModalLogin("login", finalizarPedido);
        return erro("Sua sessão expirou. Entre novamente.");
      }
      if (!resp.ok || !d.sucesso) {
        if (resp.status === 409 || resp.status === 400) sincronizarCatalogo();
        return erro(d.mensagem || "Não foi possível criar o pedido.");
      }

      const pag = d.pagamento || {};
      esvaziarCarrinho();

      if (pag.qr_code) return mostrarPix(d.pedido_id, d.total, pag);

      if (pag.checkout_url && /^https:\/\//.test(pag.checkout_url)) {
        showToast("toastCarrinho", "Redirecionando para o pagamento seguro…");
        window.location.href = pag.checkout_url;
        return;
      }

      mostrarPedidoManual(d.pedido_id, d.total, d.aviso);
    } catch (e) {
      console.error("[checkout]", e);
      erro("Sem conexão com o servidor. Tente novamente.");
    } finally {
      sobreposicao(false);
    }
  }

  function mostrarPix(pedidoId, total, pag) {
    const base64 = /^[A-Za-z0-9+/=]+$/.test(pag.qr_code_base64 || "") ? pag.qr_code_base64 : "";
    const ticket = /^https:\/\//.test(pag.ticket_url || "") ? pag.ticket_url : "";

    painel(`
      <span style="font-size:2.4rem;">💠</span>
      <h2 style="font-family:var(--fonte-titulo);color:var(--verde-escuro);margin:8px 0;">Pedido #${pedidoId} — pague com Pix</h2>
      <p style="color:var(--texto-secundario);margin-bottom:6px;">Total: <strong>${fmtBRL(total)}</strong></p>
      <p style="color:var(--texto-secundario);margin-bottom:16px;">Escaneie o QR Code ou copie o código abaixo no app do seu banco.</p>
      ${base64 ? `<img src="data:image/png;base64,${base64}" alt="QR Code Pix" style="width:240px;height:240px;border-radius:16px;border:1px solid #E2DFD6;">` : ""}
      <textarea id="pixCopiaCola" readonly style="width:100%;height:84px;margin:16px 0 8px;border-radius:12px;border:1px solid var(--borda-suave);padding:10px;font-family:monospace;font-size:.78rem;resize:none;">${esc(pag.qr_code)}</textarea>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        <button type="button" class="btn-buy-now" id="btnCopiarPix" style="padding:12px 22px;">📋 Copiar código Pix</button>
        ${ticket ? `<a href="${esc(ticket)}" target="_blank" rel="noopener" class="btn-add-cart-outline" style="padding:12px 22px;">Abrir comprovante</a>` : ""}
      </div>
      <p id="pixStatus" style="margin-top:18px;font-weight:700;color:var(--aviso);">⏳ Aguardando o pagamento…</p>
      <p style="font-size:.8rem;color:var(--texto-claro);margin-top:6px;">Esta tela atualiza sozinha quando o pagamento for confirmado. Você também pode acompanhar em "Minha conta".</p>
    `);

    document.getElementById("btnCopiarPix").onclick = async () => {
      try { await navigator.clipboard.writeText(pag.qr_code); }
      catch { const ta = document.getElementById("pixCopiaCola"); ta.select(); document.execCommand("copy"); }
      showToast("toastCarrinho", "Código Pix copiado!");
    };

    acompanharPedido(pedidoId);
  }

  // Consulta o status a cada 5 s por até 30 min, enquanto a tela do Pix estiver aberta.
  function acompanharPedido(pedidoId) {
    clearInterval(pollingPix);
    const limite = Date.now() + 30 * 60 * 1000;
    pollingPix = setInterval(async () => {
      const el = document.getElementById("pixStatus");
      if (!el || Date.now() > limite) return clearInterval(pollingPix);
      try {
        const r = await fetch(`${API_BASE}/api/pedidos/${pedidoId}`, { headers: cabecalhosApi() });
        if (!r.ok) return;
        const { pedido } = await r.json();
        if (pedido.status !== "aguardando_pagamento") {
          clearInterval(pollingPix);
          if (pedido.status === "cancelado") {
            el.style.color = "#C62828";
            el.textContent = "Este pedido foi cancelado. Faça um novo pedido se ainda quiser as plantas.";
          } else {
            el.style.color = "var(--sucesso)";
            el.textContent = "✅ Pagamento confirmado! Já estamos separando seu pedido. 🌱";
          }
        }
      } catch { /* tenta de novo no próximo ciclo */ }
    }, 5000);
  }

  function mostrarPedidoManual(pedidoId, total, aviso) {
    const texto = `Olá! Fiz o pedido #${pedidoId} no site da Loja Verde (${fmtBRL(total)}) e gostaria de combinar o pagamento. 🌿`;
    painel(`
      <span style="font-size:2.4rem;">🌿</span>
      <h2 style="font-family:var(--fonte-titulo);color:var(--verde-escuro);margin:8px 0;">Pedido #${pedidoId} registrado!</h2>
      <p style="color:var(--texto-secundario);margin-bottom:6px;">Total: <strong>${fmtBRL(total)}</strong></p>
      <p style="color:var(--texto-secundario);margin-bottom:18px;">${esc(aviso || "Enviamos a confirmação para o seu e-mail.")}</p>
      <a href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}" target="_blank" rel="noopener"
         class="btn-confirm-whatsapp-order"><i class="fa-brands fa-whatsapp"></i> Combinar pagamento no WhatsApp</a>
    `);
  }

  // Volta do Mercado Pago: /?pagamento=sucesso|falha|pendente&pedido=123
  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const pag = params.get("pagamento");
    const pedido = params.get("pedido");
    if (!pag || !pedido) return;

    const textos = {
      sucesso: "✅ Pagamento recebido! Você receberá a confirmação por e-mail.",
      pendente: "⏳ Pagamento em análise. Avisaremos por e-mail quando for aprovado.",
      falha: "❌ O pagamento não foi concluído. Você pode tentar novamente pelo carrinho."
    };
    if (textos[pag]) showToast(pag === "falha" ? "toastFavorito" : "toastCarrinho", textos[pag]);

    const url = new URL(window.location.href);
    ["pagamento", "pedido", "payment_id", "status", "collection_id", "collection_status",
      "external_reference", "payment_type", "merchant_order_id", "preference_id", "site_id", "processing_mode", "merchant_account_id"]
      .forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  });

  window.finalizarPedido = finalizarPedido;
})();
