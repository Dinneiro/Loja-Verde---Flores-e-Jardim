(function () {
  "use strict";
  const API = location.origin + "/api";
  let token = sessionStorage.getItem("adminToken") || "";

  const $ = s => document.querySelector(s);
  const headers = () => ({ "Content-Type": "application/json", Authorization: "Bearer " + token });

  // Constrói elementos com textContent: dados de clientes NUNCA entram como HTML.
  function el(tag, props, ...filhos) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e[k] = v;
      else e.setAttribute(k, v);
    });
    filhos.flat().forEach(f => f != null && e.append(f));
    return e;
  }
  const brl = n => "R$ " + Number(n).toFixed(2).replace(".", ",");

  async function api(caminho, opcoes) {
    const r = await fetch(API + caminho, Object.assign({ headers: headers() }, opcoes));
    if (r.status === 401) { sair(); throw new Error("Sessão expirada."); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.sucesso === false) throw new Error(d.mensagem || "Erro " + r.status);
    return d;
  }

  function sair() {
    sessionStorage.removeItem("adminToken");
    location.reload();
  }

  $("#btnLogin").onclick = async () => {
    $("#msgLogin").textContent = "";
    try {
      const r = await fetch(API + "/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: $("#email").value.trim(), senha: $("#senha").value })
      });
      const d = await r.json();
      if (!d.sucesso) { $("#msgLogin").textContent = d.mensagem || "Erro."; return; }
      token = d.token;
      sessionStorage.setItem("adminToken", token);
      entrar();
    } catch { $("#msgLogin").textContent = "Sem conexão com o servidor."; }
  };
  $("#senha").addEventListener("keydown", e => { if (e.key === "Enter") $("#btnLogin").click(); });
  $("#logout").onclick = sair;
  $("#btnRefresh").onclick = () => { carregarPedidos(); carregarProdutos(); };

  const FLUXO = ["aguardando_pagamento", "pago", "separando", "enviado", "entregue", "cancelado", "reembolsado"];

  function barras(alvo, pares) {
    const box = document.getElementById(alvo);
    if (!box) return;
    box.replaceChildren();
    const max = Math.max(1, ...pares.map(p => p.valor));
    if (!pares.length) { box.append(el("p", { text: "Sem dados ainda." })); return; }
    pares.forEach(p => {
      const fill = el("span", { class: "barra-fill" });
      fill.style.width = Math.round((p.valor / max) * 100) + "%";
      box.append(el("div", { class: "barra-linha" },
        el("span", { text: p.rotulo }),
        el("div", { class: "barra-trilho" }, fill),
        el("strong", { text: String(p.valor) })
      ));
    });
  }

  function desenharGraficos(pedidos) {
    const porStatus = {};
    const porPag = {};
    let receita = 0;
    let abertos = 0;
    pedidos.forEach(p => {
      porStatus[p.status] = (porStatus[p.status] || 0) + 1;
      const m = (p.metodo_pagamento || "outro").toLowerCase();
      porPag[m] = (porPag[m] || 0) + Number(p.total || 0);
      if (["pago", "separando", "enviado", "entregue"].includes(p.status)) receita += Number(p.total || 0);
      if (["aguardando_pagamento", "pago", "separando", "enviado"].includes(p.status)) abertos += 1;
    });
    const kpis = document.getElementById("kpis");
    if (kpis) {
      kpis.replaceChildren(
        el("div", { class: "kpi" }, el("span", { text: "Pedidos" }), el("strong", { text: String(pedidos.length) })),
        el("div", { class: "kpi" }, el("span", { text: "Em andamento" }), el("strong", { text: String(abertos) })),
        el("div", { class: "kpi" }, el("span", { text: "Receita confirmada" }), el("strong", { text: brl(receita) }))
      );
    }
    barras("graficoFluxo", FLUXO.filter(s => porStatus[s]).map(s => ({ rotulo: s.replace(/_/g, " "), valor: porStatus[s] })));
    barras("graficoPag", Object.entries(porPag).map(([k, v]) => ({ rotulo: k, valor: Math.round(v) })));
  }

  function entrar() {
    $("#loginBox").style.display = "none";
    $("#painel").style.display = "block";
    $("#logout").style.display = "inline-block";
    carregarPedidos();
    carregarProdutos();
  }

  const STATUS = ["aguardando_pagamento", "pago", "separando", "enviado", "entregue", "cancelado", "reembolsado"];

  async function carregarPedidos() {
    const tb = $("#tabelaPedidos tbody");
    try {
      const d = await api("/admin/pedidos");
      tb.replaceChildren();
      d.pedidos.forEach(p => {
        let itens = [];
        try { itens = JSON.parse(p.itens_json); } catch { /* ignora */ }
        const sel = el("select", {}, STATUS.map(s => el("option", { value: s, text: s.replace(/_/g, " ") })));
        sel.value = p.status;
        const rast = el("input", { placeholder: "Rastreio", value: p.codigo_rastreio || "", style: "width:120px;margin-top:4px;", maxlength: "60" });
        const salvar = el("button", {
          text: "Salvar", style: "margin-top:4px;",
          onclick: async () => {
            try {
              await api("/admin/pedidos/" + p.id, { method: "PATCH", body: JSON.stringify({ status: sel.value, codigo_rastreio: rast.value }) });
              carregarPedidos(); carregarProdutos();
            } catch (e) { alert(e.message); }
          }
        });
        tb.append(el("tr", {},
          el("td", { text: "#" + p.id }),
          el("td", {}, el("strong", { text: p.cliente_nome }), el("br"), el("small", { text: p.cliente_email }),
            p.cliente_whatsapp ? el("br") : null, p.cliente_whatsapp ? el("small", { text: p.cliente_whatsapp }) : null),
          el("td", {}, itens.map(i => el("div", { text: `${i.qtd}× ${i.nome}` })),
            el("small", { text: "📍 " + (p.endereco_entrega || "-") }),
            p.data_entrega_desejada ? el("div", {}, el("small", { text: "📅 " + p.data_entrega_desejada })) : null,
            p.mensagem_cartao ? el("div", {}, el("small", { text: "🎁 " + p.mensagem_cartao })) : null),
          el("td", { text: brl(p.total) + (p.cupom ? "  (" + p.cupom + ")" : "") }),
          el("td", {}, el("div", { text: p.metodo_pagamento || "-" }), el("span", { class: "badge", text: p.payment_status || "pending" })),
          el("td", {}, el("span", { class: "badge " + p.status, text: p.status.replace(/_/g, " ") })),
          el("td", {}, sel, el("br"), rast, el("br"), salvar)
        ));
      });
      if (!d.pedidos.length) tb.append(el("tr", {}, el("td", { colspan: "7", text: "Nenhum pedido ainda." })));
      desenharGraficos(d.pedidos);
    } catch (e) { tb.replaceChildren(el("tr", {}, el("td", { colspan: "7", class: "erro", text: e.message }))); }
  }

  async function carregarProdutos() {
    const tb = $("#tabelaProdutos tbody");
    try {
      const d = await api("/admin/produtos");
      tb.replaceChildren();
      d.produtos.forEach(p => {
        const preco = el("input", { value: p.preco, style: "width:80px;", inputmode: "decimal" });
        const est = el("input", { value: p.estoque, style: "width:70px;", inputmode: "numeric" });
        const ativo = el("input", { type: "checkbox" });
        ativo.checked = !!p.ativo;
        const salvar = el("button", {
          text: "Salvar",
          onclick: async () => {
            try {
              await api("/admin/produtos/" + p.id, {
                method: "PATCH",
                body: JSON.stringify({ preco: Number(preco.value.replace(",", ".")), estoque: Number(est.value), ativo: ativo.checked ? 1 : 0 })
              });
              salvar.textContent = "✔ Salvo";
              setTimeout(() => (salvar.textContent = "Salvar"), 1500);
            } catch (e) { alert(e.message); }
          }
        });
        tb.append(el("tr", {}, el("td", { text: p.id }), el("td", { text: p.nome }), el("td", { text: p.categoria }),
          el("td", {}, preco), el("td", {}, est), el("td", {}, ativo), el("td", {}, salvar)));
      });
    } catch (e) { tb.replaceChildren(el("tr", {}, el("td", { colspan: "7", class: "erro", text: e.message }))); }
  }

  $("#btnProduto").onclick = async () => {
    const msg = $("#msgProduto");
    try {
      const d = await api("/admin/produtos", {
        method: "POST",
        body: JSON.stringify({
          nome: $("#pNome").value.trim(),
          categoria: $("#pCat").value,
          preco: Number($("#pPreco").value.replace(",", ".")),
          estoque: parseInt($("#pEstoque").value, 10) || 0,
          imagem: $("#pImg").value.trim()
        })
      });
      msg.className = "ok"; msg.textContent = "✅ Produto #" + d.produto_id + " cadastrado.";
      carregarProdutos();
    } catch (e) { msg.className = "erro"; msg.textContent = "❌ " + e.message; }
  };

  if (token) entrar();
})();
