/**
 ==========================================================================
 LOJA VERDE — CATÁLOGO, CARRINHO E INTERFACE (login em auth.js, pedidos em checkout.js)
 ==========================================================================
 */

const WHATSAPP_NUMERO = "5511999999999"; 

// Utilitários de Persistência e Sanitização
function lerJSON(chave, padrao) {
  try {
    const v = JSON.parse(localStorage.getItem(chave));
    return v ?? padrao;
  } catch {
    return padrao;
  }
}

function salvarJSON(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error("Erro ao salvar localStorage:", e);
  }
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

// ==========================================================================
// CATÁLOGO COMPLETO DE PRODUTOS
// ==========================================================================
let produtos = [
  {
    id: 1,
    nome: "Alface Crespa Orgânica",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 6.90,
    precoOriginal: 8.50,
    imagem: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80",
    galeria: [
      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
    ],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Alface crespa colhida no dia da entrega. Raízes preservadas no saquinho para durar até 10 dias fresca e crocante na sua geladeira.",
    selo: "colhido-hoje",
    textoSelo: "Colhido Hoje 🌿",
    estoque: 45,
    entrega: "Entrega no mesmo dia",
    cuidados: { luz: "Sol pleno", agua: "Diariamente", dificuldade: "Fácil", tamanho: "25-30 cm", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 320
  },
  {
    id: 2,
    nome: "Rúcula Selvagem Orgânica",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 7.50,
    precoOriginal: 9.00,
    imagem: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Sabor marcante e levemente picante, rica em ferro e vitaminas. Folhas selecionadas e colhidas na madrugada.",
    selo: "colhido-hoje",
    textoSelo: "Colhido Hoje 🌿",
    estoque: 30,
    cuidados: { luz: "Sol pleno", agua: "Diariamente", dificuldade: "Fácil", tamanho: "20-25 cm", petFriendly: true },
    avaliacoes: 4.8,
    vendidos: 190
  },
  {
    id: 3,
    nome: "Couve Manteiga em Maço Vivo",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 8.00,
    precoOriginal: 10.00,
    imagem: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Folhas grandes, macias e sem agrotóxicos. Excelente para sucos verdes matinais e refogados rápidos.",
    selo: "colhido-hoje",
    textoSelo: "Colhido Hoje 🌿",
    estoque: 25,
    cuidados: { luz: "Sol pleno", agua: "Diariamente", dificuldade: "Fácil", tamanho: "40 cm", petFriendly: true },
    avaliacoes: 5.0,
    vendidos: 140
  },
  {
    id: 4,
    nome: "Manjericão Italiano em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 14.90,
    precoOriginal: 18.00,
    imagem: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Vaso já enraizado e pronto para colher na hora do preparo de massas, pizzas e molho pesto caseiro.",
    selo: "destaque",
    textoSelo: "Mais Vendido ⭐",
    estoque: 40,
    cuidados: { luz: "Sol pleno (4h+)", agua: "2x por semana", dificuldade: "Fácil", tamanho: "25 cm", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 410
  },
  {
    id: 5,
    nome: "Alecrim Aromático em Vaso de Barro",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 18.00,
    precoOriginal: 22.00,
    imagem: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Super resistente à falta de água. Excelente para carnes, batatas e pães artesanais.",
    selo: "destaque",
    textoSelo: "Resistente 🌿",
    estoque: 35,
    cuidados: { luz: "Sol pleno", agua: "1x por semana", dificuldade: "Fácil", tamanho: "30-40 cm", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 280
  },
  {
    id: 6,
    nome: "Hortelã Doce em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 12.90,
    precoOriginal: 15.00,
    imagem: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Perfeita para chás digestivos, sucos refrescantes e drinks. Crescimento vigoroso.",
    selo: "pet-friendly",
    textoSelo: "Aromática 🌱",
    estoque: 50,
    cuidados: { luz: "Meia-sombra", agua: "Diariamente", dificuldade: "Fácil", tamanho: "20 cm", petFriendly: true },
    avaliacoes: 4.8,
    vendidos: 220
  },
  {
    id: 7,
    nome: "Costela-de-Adão (Monstera Deliciosa)",
    categoria: "ornamentais",
    subcategoria: "casamento",
    preco: 58.00,
    precoOriginal: 72.00,
    imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "A queridinha da decoração moderna. Folhas fenestradas exuberantes que purificam o ar.",
    selo: "destaque",
    textoSelo: "Destaque 🪴",
    estoque: 14,
    cuidados: { luz: "Luz indireta", agua: "1x por semana", dificuldade: "Fácil", tamanho: "50-70 cm", petFriendly: false },
    avaliacoes: 5.0,
    vendidos: 165
  },
  {
    id: 8,
    nome: "Zamioculca (ZZ Plant) Resistente",
    categoria: "ornamentais",
    subcategoria: "condolencias",
    preco: 42.00,
    precoOriginal: 49.00,
    imagem: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Planta quase indestrutível! Sobrevive perfeitamente em locais de pouca luz (escritórios e quartos).",
    selo: "destaque",
    textoSelo: "Indestrutível 🌟",
    estoque: 18,
    cuidados: { luz: "Sombra / Pouca luz", agua: "A cada 15 dias", dificuldade: "Fácil", tamanho: "45 cm", petFriendly: false },
    avaliacoes: 4.9,
    vendidos: 240
  },
  {
    id: 9,
    nome: "Lírio-da-Paz Purificador",
    categoria: "ornamentais",
    subcategoria: "aniversario",
    preco: 36.00,
    precoOriginal: 44.00,
    imagem: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Jardim da Paz",
    descricao: "Flores brancas elegantes que simbolizam serenidade. Reconhecido pela NASA por filtrar toxinas do ar.",
    selo: "destaque",
    textoSelo: "Purificador 🍃",
    estoque: 22,
    cuidados: { luz: "Sombra / Meia-sombra", agua: "2x por semana", dificuldade: "Fácil", tamanho: "40 cm", petFriendly: false },
    avaliacoes: 4.9,
    vendidos: 195
  },
  {
    id: 10,
    nome: "Coleção 4 Mini Suculentas Nobres",
    categoria: "suculentas",
    subcategoria: "jardim",
    preco: 24.90,
    precoOriginal: 32.00,
    imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Quatro espécies variadas de mini suculentas coloridas. Excelente presente para mesas de trabalho.",
    selo: "destaque",
    textoSelo: "Coleção 🌵",
    estoque: 55,
    cuidados: { luz: "Sol pleno", agua: "A cada 10 dias", dificuldade: "Fácil", tamanho: "8-12 cm", petFriendly: false },
    avaliacoes: 4.8,
    vendidos: 380
  },
  {
    id: 11,
    nome: "Echeveria Rosa do Deserto em Vaso",
    categoria: "suculentas",
    subcategoria: "aniversario",
    preco: 19.90,
    precoOriginal: 25.00,
    imagem: "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Formato simétrico de rosa perfeita com folhas aveludadas em tons verde-azulados e bordas rosadas.",
    selo: "pet-friendly",
    textoSelo: "Pet Friendly 🐾",
    estoque: 20,
    cuidados: { luz: "Sol pleno", agua: "A cada 12 dias", dificuldade: "Fácil", tamanho: "15 cm", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 150
  },
  {
    id: 12,
    nome: "Kit Horta na Varanda Completa",
    categoria: "kits",
    subcategoria: "aniversario",
    preco: 69.90,
    precoOriginal: 89.00,
    imagem: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Loja Verde Cultivo",
    descricao: "Contém: 1 Jardineira auto-irrigável, 3 mudas selecionadas, substrato orgânico e manual de cultivo.",
    selo: "destaque",
    textoSelo: "Kit Completo 🎁",
    estoque: 15,
    cuidados: { luz: "Sol direto (3h+)", agua: "2x por semana", dificuldade: "Fácil", tamanho: "Kit", petFriendly: true },
    avaliacoes: 5.0,
    vendidos: 210
  },
  {
    id: 13,
    nome: "Kit Cantinho do Chá Fresco",
    categoria: "kits",
    subcategoria: "aniversario",
    preco: 49.90,
    precoOriginal: 62.00,
    imagem: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Loja Verde Cultivo",
    descricao: "3 vasos aromáticos: Camomila, Capim-Santo e Hortelã Doce. Presente terapêutico para desacelerar.",
    selo: "pet-friendly",
    textoSelo: "Relax 🍵",
    estoque: 18,
    cuidados: { luz: "Meia-sombra", agua: "3x por semana", dificuldade: "Fácil", tamanho: "Kit", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 130
  },
  {
    id: 14,
    nome: "Vaso de Crisântemo Nobre Branco (Anti-Dengue)",
    categoria: "finados",
    subcategoria: "condolencias",
    preco: 32.00,
    precoOriginal: 39.00,
    imagem: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flores da Paz & Homenagem",
    descricao: "O símbolo clássico de respeito. Em vaso seguro com substrato drenado (permitido em cemitérios contra a dengue).",
    selo: "finados",
    textoSelo: "Especial Finados 🕊️",
    estoque: 60,
    cuidados: { luz: "Sol pleno ou Meia-sombra", agua: "2x por semana", dificuldade: "Fácil", tamanho: "35 cm", petFriendly: false },
    avaliacoes: 5.0,
    vendidos: 280
  },
  {
    id: 15,
    nome: "Kalanchoe Dobrado Branco em Cerâmica",
    categoria: "finados",
    subcategoria: "condolencias",
    preco: 28.00,
    precoOriginal: 35.00,
    imagem: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flores da Paz & Homenagem",
    descricao: "Conhecida como 'Flor da Fortuna e da Memória'. Alta resistência a sol direto e ventos.",
    selo: "finados",
    textoSelo: "Especial Finados 🕊️",
    estoque: 45,
    cuidados: { luz: "Sol pleno", agua: "1x por semana", dificuldade: "Fácil", tamanho: "25 cm", petFriendly: false },
    avaliacoes: 4.9,
    vendidos: 190
  },
  {
    id: 16,
    nome: "Orquídea Phalaenopsis Branca Memorial",
    categoria: "finados",
    subcategoria: "casamento",
    preco: 65.00,
    precoOriginal: 78.00,
    imagem: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Orquidário da Paz",
    descricao: "Beleza pura e serenidade. Flores brancas duradouras que transmitem carinho e reverência.",
    selo: "finados",
    textoSelo: "Especial Finados 🕊️",
    estoque: 20,
    cuidados: { luz: "Luz indireta", agua: "1x por semana", dificuldade: "Médio", tamanho: "50 cm", petFriendly: true },
    avaliacoes: 5.0,
    vendidos: 140
  },
  {
    id: 17,
    nome: "Muda de Jabuticabeira Híbrida em Vaso",
    categoria: "mudas",
    subcategoria: "jardim",
    preco: 75.00,
    precoOriginal: 95.00,
    imagem: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Frutos da Terra",
    descricao: "Produz jabuticabas várias vezes ao ano mesmo em vasos de apartamento com varanda ensolarada.",
    selo: "destaque",
    textoSelo: "Frutífera 🌳",
    estoque: 8,
    cuidados: { luz: "Sol pleno", agua: "Diariamente", dificuldade: "Médio", tamanho: "80-100 cm", petFriendly: true },
    avaliacoes: 4.9,
    vendidos: 85
  }
];

// ==========================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================================================
let carrinho = lerJSON("carrinho_lv", []);
let favoritos = lerJSON("favoritos_lv", []);
let usuario = lerJSON("usuario_lv", null);

let categoriaAtiva = "todos";
let filtroTagAtivo = "todos";
let termoBuscaAtivo = "";
let cupomAplicado = localStorage.getItem("cupom_lv") || null;
let cupomPercentual = Number(localStorage.getItem("cupom_pct_lv")) || 0;
let metodoPagamentoAtivo = "pix";
let rascunhoCheckout = lerJSON("checkout_rascunho_lv", { endereco: "", whatsapp: "", msg: "", data: "" });

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const fmtBRL = n => "R$ " + Number(n).toFixed(2).replace(".", ",");

const API_BASE = location.protocol.startsWith("http") ? location.origin : "http://127.0.0.1:5000";

// Rastreamento automático de visitantes no banco SQLite
function rastrearVisitaNoServidor(pagina) {
  try {
    fetch(`${API_BASE}/api/visitante/rastrear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagina: pagina })
    }).catch(() => {});
  } catch (e) {}
}

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener("DOMContentLoaded", () => {
  atualizarHeaderUsuario();
  atualizarContadorCarrinho();
  renderizarHome();
  rastrearVisitaNoServidor("home");
  sincronizarCatalogo();
  revalidarCupomSalvo();

  window.addEventListener("click", e => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.add("hidden");
      document.body.classList.remove("no-scroll");
    }
  });

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
      document.body.classList.remove("no-scroll");
    }
  });
});

// ==========================================================================
// NAVEGAÇÃO & UI
// ==========================================================================
function showPage(page) {
  const content = document.getElementById("content");
  window.scrollTo({ top: 0, behavior: "smooth" });
  rastrearVisitaNoServidor(page);

  if (page === "home") {
    renderizarHome();
  } else if (page === "carrinho") {
    if (!estaLogado()) {
      abrirModalLogin("login", () => showPage("carrinho"));
      renderizarHome();
      return;
    }
    renderizarCarrinho();
  } else if (page === "perfil") {
    if (!estaLogado()) {
      abrirModalLogin("login", () => showPage("perfil"));
      renderizarHome();
      return;
    }
    renderizarPerfil();
  } else if (page === "favoritos") {
    renderizarFavoritos();
  } else if (page === "comerciantes") {
    renderizarComerciantes();
  } else if (page === "atendimento") {
    renderizarAtendimento();
  } else {
    renderizarHome();
  }
}

function navegarCategoria(cat) {
  categoriaAtiva = cat;
  filtroTagAtivo = "todos";
  termoBuscaAtivo = "";

  const campoBusca = document.getElementById("campoBuscaGlobal");
  if (campoBusca) campoBusca.value = "";
  const btnClear = document.getElementById("btnClearBusca");
  if (btnClear) btnClear.classList.add("hidden");

  document.querySelectorAll(".nav-cat-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cat === cat);
  });

  const nomes = {
    todos: "Todas as plantas", hortalicas: "Hortaliças", temperos: "Temperos e ervas",
    ornamentais: "Plantas ornamentais", mudas: "Mudas", suculentas: "Suculentas",
    kits: "Kits", finados: "Especial Finados"
  };
  const atual = document.getElementById("deptAtual");
  if (atual) atual.textContent = nomes[cat] || "Catálogo";
  fecharDepartamentos();

  renderizarHome();
  rolarParaProdutos();
}

function alternarDepartamentos() {
  const painel = document.getElementById("painelDept");
  const btn = document.getElementById("btnDept");
  if (!painel || !btn) return;
  const aberto = painel.classList.toggle("hidden") === false;
  btn.setAttribute("aria-expanded", aberto ? "true" : "false");
  btn.classList.toggle("aberto", aberto);
}

function fecharDepartamentos() {
  const painel = document.getElementById("painelDept");
  const btn = document.getElementById("btnDept");
  if (painel) painel.classList.add("hidden");
  if (btn) {
    btn.setAttribute("aria-expanded", "false");
    btn.classList.remove("aberto");
  }
}

function estaLogado() {
  return !!(window.AUTH_LV && typeof window.AUTH_LV.sessaoAtiva === "function" && window.AUTH_LV.sessaoAtiva());
}

function filtrarPorTag(tag) {
  filtroTagAtivo = tag;
  renderizarHome();
  rolarParaProdutos();
}

function filtrarProdutosBusca(termo) {
  termoBuscaAtivo = termo;
  const btnClear = document.getElementById("btnClearBusca");
  if (btnClear) {
    btnClear.classList.toggle("hidden", !termo.trim());
  }
  renderizarHome();
}

function limparBusca() {
  termoBuscaAtivo = "";
  const campo = document.getElementById("campoBuscaGlobal");
  if (campo) campo.value = "";
  const btnClear = document.getElementById("btnClearBusca");
  if (btnClear) btnClear.classList.add("hidden");
  renderizarHome();
}

function rolarParaProdutos() {
  const el = document.getElementById("secao-produtos-grade");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function cabecalhosApi() {
  const h = { "Content-Type": "application/json" };
  const t = localStorage.getItem("token_lv");
  if (t) h["Authorization"] = "Bearer " + t;
  return h;
}

async function validarCupomNoServidor(codigo) {
  const r = await fetch(`${API_BASE}/api/cupons/validar`, {
    method: "POST",
    headers: cabecalhosApi(),
    body: JSON.stringify({ codigo, itens: carrinho.map(i => ({ id: i.id, qtd: i.qtd || 1 })) })
  });
  return r.json();
}

function definirCupom(codigo, percentual) {
  cupomAplicado = codigo;
  cupomPercentual = percentual;
  if (codigo) {
    localStorage.setItem("cupom_lv", codigo);
    localStorage.setItem("cupom_pct_lv", String(percentual));
  } else {
    localStorage.removeItem("cupom_lv");
    localStorage.removeItem("cupom_pct_lv");
  }
}

async function copiarCupom(codigo) {
  if (navigator.clipboard) navigator.clipboard.writeText(codigo).catch(() => {});
  try {
    const r = await validarCupomNoServidor(codigo);
    if (!r.sucesso) {
      showToast("toastFavorito", r.mensagem || "Cupom inválido ou expirado.");
      return false;
    }
    definirCupom(r.codigo, r.percentual);
    showToast("toastCarrinho", `Cupom ${r.codigo} ativado! ${r.percentual}% de desconto 🎟️`);
    if (document.querySelector(".carrinho-page-wrap")) renderizarCarrinho();
    return true;
  } catch (e) {
    showToast("toastFavorito", "Não foi possível validar o cupom agora. Tente de novo.");
    return false;
  }
}

function removerCupom() {
  definirCupom(null, 0);
  if (document.querySelector(".carrinho-page-wrap")) renderizarCarrinho();
}

async function revalidarCupomSalvo() {
  if (!cupomAplicado) return;
  try {
    const r = await validarCupomNoServidor(cupomAplicado);
    if (r.sucesso) definirCupom(r.codigo, r.percentual);
    else definirCupom(null, 0);
  } catch (e) { /* servidor fora do ar: mantém o que estava */ }
}

// Preços, estoque e produtos ativos vêm do banco (o admin pode alterar a qualquer momento).
function produtoPadrao(d) {
  return {
    id: d.id, nome: d.nome, categoria: d.categoria, subcategoria: d.categoria,
    preco: d.preco, precoOriginal: d.preco_original || null,
    imagem: d.imagem, galeria: [d.imagem], vendedor: "Loja Verde",
    descricao: d.descricao || "", selo: "destaque", textoSelo: "Novidade 🌱",
    estoque: d.estoque, entrega: "",
    cuidados: { luz: "Consulte a descrição", agua: "Consulte a descrição", dificuldade: "Médio", tamanho: "—", petFriendly: true },
    avaliacoes: 5.0, vendidos: 0
  };
}

async function sincronizarCatalogo() {
  try {
    const r = await fetch(`${API_BASE}/api/produtos`);
    const d = await r.json();
    if (!d.sucesso || !Array.isArray(d.produtos) || d.produtos.length === 0) return;
    const doBanco = new Map(d.produtos.map(p => [p.id, p]));

    produtos = produtos.filter(p => doBanco.has(p.id));
    for (const b of d.produtos) {
      const local = produtos.find(p => p.id === b.id);
      if (local) {
        local.preco = b.preco;
        local.precoOriginal = b.preco_original || null;
        local.estoque = b.estoque;
      } else {
        produtos.push(produtoPadrao(b));
      }
    }

    carrinho = carrinho
      .filter(i => doBanco.has(i.id))
      .map(i => ({ ...i, preco: doBanco.get(i.id).preco, estoque: doBanco.get(i.id).estoque }));
    salvarJSON("carrinho_lv", carrinho);
    atualizarContadorCarrinho();

    if (!document.querySelector(".carrinho-page-wrap")) renderizarHome();
    else renderizarCarrinho();
  } catch (e) {
    console.warn("Catálogo local mantido (API indisponível).");
  }
}

function showToast(id, msg) {
  const t = document.getElementById(id);
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

function atualizarContadorCarrinho() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const total = carrinho.reduce((sum, item) => sum + (item.qtd || 1), 0);
  if (total > 0) {
    badge.textContent = total;
    badge.style.display = "inline-flex";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }
}

function atualizarHeaderUsuario() {
  const label = document.getElementById("labelUsuarioHeader");
  if (!label) return;
  usuario = lerJSON("usuario_lv", null);
  const logado = !!(usuario && usuario.nome && localStorage.getItem("token_lv"));
  label.textContent = logado ? usuario.nome.split(" ")[0] : "Entrar";
  const cartBtn = document.getElementById("btnCarrinhoHeader");
  if (cartBtn) cartBtn.classList.toggle("hidden", !logado);
  const icone = document.getElementById("iconePerfilHeader");
  const foto = document.getElementById("avatarHeader");
  const avatar = logado ? localStorage.getItem("avatar_lv_" + (usuario.email || "")) : "";
  if (foto && icone) {
    if (avatar) {
      foto.src = avatar;
      foto.classList.remove("hidden");
      icone.classList.add("hidden");
    } else {
      foto.removeAttribute("src");
      foto.classList.add("hidden");
      icone.classList.remove("hidden");
    }
  }
}

// ==========================================================================
// RENDERIZAÇÃO DE CARDS DE PRODUTOS
// ==========================================================================
function gerarCardProduto(p) {
  const isFav = favoritos.includes(p.id);
  const precoFormatado = p.preco.toFixed(2).replace('.', ',');
  const originalFormatado = p.precoOriginal ? `R$ ${p.precoOriginal.toFixed(2).replace('.', ',')}` : '';
  const parcelas = (p.preco / 3).toFixed(2).replace('.', ',');

  return `
    <div class="product" onclick="abrirModalProduto(${p.id})">
      <div class="product-img-wrap">
        <span class="produto-selo ${p.selo}">${p.textoSelo}</span>
        <button type="button" class="btn-fav-card ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); alternarFavorito(${p.id})" title="Favoritar">
          <i class="fa${isFav ? 's' : 'r'} fa-heart"></i>
        </button>
        <img src="${esc(p.imagem)}" alt="${esc(p.nome)}" loading="lazy">
      </div>
      <strong>${esc(p.nome)}</strong>
      <div class="mini-cuidados-tags">
        <span class="badge-mini-tag">☀️ ${esc(p.cuidados.luz)}</span>
        <span class="badge-mini-tag">💧 ${esc(p.cuidados.agua)}</span>
      </div>
      <div class="product-card-pricing">
        ${originalFormatado ? `<span class="preco-original-riscado">${originalFormatado}</span>` : ''}
        <span class="product-price">R$ ${precoFormatado}</span>
        <span class="parcelamento-texto">ou 3x de R$ ${parcelas} sem juros</span>
      </div>
      <div class="product-card-buttons">
        <button type="button" class="btn-card-adicionar" onclick="event.stopPropagation(); comprarProduto(${p.id})">
          <i class="fa fa-shopping-cart"></i> ${p.estoque > 0 ? "Adicionar" : "Esgotado"}
        </button>
        <button type="button" class="btn-card-detalhes" onclick="event.stopPropagation(); abrirModalProduto(${p.id})" title="Ver Detalhes">
          <i class="fa fa-eye"></i>
        </button>
      </div>
    </div>
  `;
}

// ==========================================================================
// RENDERIZAÇÃO DA PÁGINA INICIAL (HOME)
// ==========================================================================
function renderizarHome() {
  const content = document.getElementById("content");
  if (!content) return;

  // Hero Banner
  const heroHTML = `
    <section class="hero-plant-container">
      <div class="hero-left-content">
        <span class="hero-pill-badge">
          <i class="fa fa-leaf"></i> Do nosso campo para a sua mesa
        </span>
        <h2 class="hero-title-main">Verde fresquinho, colhido para você.</h2>
        <p class="hero-subtitle-desc">
          Hortaliças, ervas e plantas cultivadas com cuidado artesanal e entregues com frescor garantido na sua porta.
        </p>
        <div class="hero-actions-row">
          <button type="button" class="btn-hero-primary" onclick="rolarParaProdutos()">
            Ver produtos <i class="fa fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-hero-secondary" onclick="abrirModalQuiz()">
            ✨ Qual planta combina comigo?
          </button>
        </div>
      </div>
      <div class="hero-right-visual">
        <div class="hero-image-card">
          <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1000&q=80" alt="Viveiro e Horta Loja Verde">
        </div>
      </div>
    </section>
  `;

  // Pilares
  const pilaresHTML = `
    <section class="trust-pillars-grid">
      <div class="pillar-item">
        <div class="pillar-icon-box"><i class="fa fa-leaf"></i></div>
        <div class="pillar-info">
          <h4>Colhido hoje</h4>
          <p>Frescor garantido do nosso viveiro</p>
        </div>
      </div>
      <div class="pillar-item">
        <div class="pillar-icon-box"><i class="fa fa-truck-fast"></i></div>
        <div class="pillar-info">
          <h4>Entrega rápida</h4>
          <p>Embalagem ventilada e segura</p>
        </div>
      </div>
      <div class="pillar-item">
        <div class="pillar-icon-box"><i class="fa fa-credit-card"></i></div>
        <div class="pillar-info">
          <h4>Pix e cartão</h4>
          <p>Pix com 5% OFF ou até 3x sem juros</p>
        </div>
      </div>
      <div class="pillar-item" style="cursor: pointer;" onclick="abrirModalGarantia()">
        <div class="pillar-icon-box"><i class="fa fa-shield-heart"></i></div>
        <div class="pillar-info">
          <h4>Troca garantida</h4>
          <p>Planta danificada? Trocamos em 30d</p>
        </div>
      </div>
    </section>
  `;

  // Categorias Pastel
  const categoriasPastelHTML = `
    <section style="margin-bottom: 40px;">
      <div class="section-title-wrap">
        <div>
          <h3 class="section-title">Compre por categoria</h3>
          <p class="section-subtitle">Plantas selecionadas para cada cantinho da sua casa</p>
        </div>
      </div>
      <div class="categories-pastel-grid">
        <div class="category-pastel-card" onclick="navegarCategoria('hortalicas')">
          <div class="cat-pastel-box" style="background: var(--cat-horta);">
            <img src="https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=400&q=80" alt="Hortaliças">
            <span class="cat-icon-badge">🥬</span>
          </div>
          <span>Hortaliças</span>
        </div>
        <div class="category-pastel-card" onclick="navegarCategoria('temperos')">
          <div class="cat-pastel-box" style="background: var(--cat-temperos);">
            <img src="https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=400&q=80" alt="Temperos">
            <span class="cat-icon-badge">🌱</span>
          </div>
          <span>Temperos e ervas</span>
        </div>
        <div class="category-pastel-card" onclick="navegarCategoria('ornamentais')">
          <div class="cat-pastel-box" style="background: var(--cat-ornamentais);">
            <img src="https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80" alt="Ornamentais">
            <span class="cat-icon-badge">🪴</span>
          </div>
          <span>Plantas ornamentais</span>
        </div>
        <div class="category-pastel-card" onclick="navegarCategoria('mudas')">
          <div class="cat-pastel-box" style="background: var(--cat-mudas);">
            <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=80" alt="Mudas">
            <span class="cat-icon-badge">🌳</span>
          </div>
          <span>Mudas</span>
        </div>
        <div class="category-pastel-card" onclick="navegarCategoria('suculentas')">
          <div class="cat-pastel-box" style="background: var(--cat-suculentas);">
            <img src="https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=400&q=80" alt="Suculentas">
            <span class="cat-icon-badge">🌵</span>
          </div>
          <span>Suculentas</span>
        </div>
        <div class="category-pastel-card" onclick="navegarCategoria('kits')">
          <div class="cat-pastel-box" style="background: var(--cat-kits);">
            <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80" alt="Kits">
            <span class="cat-icon-badge">🎁</span>
          </div>
          <span>Kits de cultivo</span>
        </div>
      </div>
    </section>
  `;

  // Banner Finados
  const finadosHTML = `
    <section class="finados-banner-section">
      <div class="finados-banner-left">
        <span class="finados-tag">🕊️ Especial Finados • 2 de Novembro</span>
        <h3 class="finados-title">Homenagem com carinho, respeito e vida.</h3>
        <p class="finados-desc">
          Vasos de crisântemos, kalanchoes e orquídeas com substrato drenado — <strong>permitidos em cemitérios contra a dengue</strong> ou perfeitos para deixar em casa.
        </p>
        <button type="button" class="btn-finados-cta" onclick="navegarCategoria('finados')">
          Ver Coleção Finados com Data Garantida
        </button>
      </div>
      <div class="finados-banner-right">
        <div class="finados-clock-box">
          <p class="finados-clock-title">Data limite para agendamento:</p>
          <p class="finados-date-highlight">Até 31 de Outubro</p>
        </div>
      </div>
    </section>
  `;

  // Filtro dos Produtos
  let listaFiltrada = produtos;
  if (categoriaAtiva !== "todos") {
    listaFiltrada = listaFiltrada.filter(p => p.categoria === categoriaAtiva || p.subcategoria === categoriaAtiva);
  }
  if (filtroTagAtivo === "sol") {
    listaFiltrada = listaFiltrada.filter(p => p.cuidados.luz.toLowerCase().includes("sol"));
  } else if (filtroTagAtivo === "sombra") {
    listaFiltrada = listaFiltrada.filter(p => p.cuidados.luz.toLowerCase().includes("sombra") || p.cuidados.luz.toLowerCase().includes("indireta"));
  } else if (filtroTagAtivo === "pet") {
    listaFiltrada = listaFiltrada.filter(p => p.cuidados.petFriendly === true);
  } else if (filtroTagAtivo === "facil") {
    listaFiltrada = listaFiltrada.filter(p => p.cuidados.dificuldade.toLowerCase().includes("fácil"));
  }

  if (termoBuscaAtivo.trim() !== "") {
    const t = termoBuscaAtivo.toLowerCase();
    listaFiltrada = listaFiltrada.filter(p => p.nome.toLowerCase().includes(t) || p.descricao.toLowerCase().includes(t));
  }

  const gradeHTML = listaFiltrada.length > 0 ? listaFiltrada.map(p => gerarCardProduto(p)).join("") : `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 20px;">
      <h3>Nenhum produto encontrado 🌿</h3>
      <p style="color: var(--texto-secundario); margin: 8px 0;">Tente buscar por outro termo ou categoria.</p>
      <button type="button" class="btn-hero-primary" onclick="navegarCategoria('todos'); limparBusca();">Ver Todos os Produtos</button>
    </div>
  `;

  const gradeCompletaHTML = `
    <section id="secao-produtos-grade" style="margin-bottom: 48px;">
      <div class="section-title-wrap">
        <div>
          <h3 class="section-title">${categoriaAtiva === 'todos' ? 'Catálogo completo' : 'Categoria: ' + categoriaAtiva.toUpperCase()}</h3>
          <p class="section-subtitle">${listaFiltrada.length} espécie(s) disponível(is)</p>
        </div>
      </div>

      <div class="quick-filter-chips">
        <button type="button" class="filter-chip ${filtroTagAtivo==='todos'?'active':''}" onclick="filtrarPorTag('todos')">🌱 Todos</button>
        <button type="button" class="filter-chip ${filtroTagAtivo==='sol'?'active':''}" onclick="filtrarPorTag('sol')">☀️ Sol Pleno</button>
        <button type="button" class="filter-chip ${filtroTagAtivo==='sombra'?'active':''}" onclick="filtrarPorTag('sombra')">🌥️ Sombra / Indireta</button>
        <button type="button" class="filter-chip ${filtroTagAtivo==='pet'?'active':''}" onclick="filtrarPorTag('pet')">🐾 Pet Friendly</button>
        <button type="button" class="filter-chip ${filtroTagAtivo==='facil'?'active':''}" onclick="filtrarPorTag('facil')">💧 Fácil Cultivo</button>
      </div>

      <div class="grid">${gradeHTML}</div>
    </section>
  `;

  const bannerAssinaturaHTML = `
    <section class="subscription-callout-banner">
      <div class="sub-banner-content">
        <h3>🥬 Cesta de hortaliças toda semana</h3>
        <p>Assine e receba folhas e temperos frescos colhidos no dia direto na sua porta com frete grátis.</p>
      </div>
      <button type="button" class="btn-sub-cta" onclick="abrirModalAssinatura()">Quero assinar</button>
    </section>
  `;

  const avisoConta = estaLogado() ? "" : `
    <section class="conta-necessaria-banner">
      <div>
        <strong>Para comprar, entre ou crie sua conta.</strong>
        <p>O carrinho só aparece depois do cadastro. Leva menos de um minuto.</p>
      </div>
      <button type="button" class="btn-hero-primary" onclick="abrirModalLogin('registro')">Criar conta</button>
    </section>`;

  content.innerHTML = avisoConta + heroHTML + pilaresHTML + categoriasPastelHTML + finadosHTML + gradeCompletaHTML + bannerAssinaturaHTML;
}

// ==========================================================================
// CARRINHO & CHECKOUT WHATSAPP
// ==========================================================================
function limiteDoItem(p) {
  return Math.max(0, Math.min(99, Number.isFinite(p.estoque) ? p.estoque : 99));
}

function comprarProduto(id) {
  if (!estaLogado()) {
    abrirModalLogin("login", () => comprarProduto(id));
    return;
  }
  adicionarAoCarrinho(id);
}

function comprarEIr(id) {
  if (!estaLogado()) {
    if (typeof fecharModal === "function") fecharModal();
    abrirModalLogin("login", () => comprarEIr(id));
    return;
  }
  adicionarAoCarrinho(id);
  if (typeof fecharModal === "function") fecharModal();
  showPage("carrinho");
}

function adicionarAoCarrinho(id) {
  const p = produtos.find(item => item.id === id);
  if (!p) return;

  const limite = limiteDoItem(p);
  if (limite <= 0) {
    showToast("toastFavorito", `"${p.nome}" está esgotado no momento.`);
    return;
  }

  const existente = carrinho.find(item => item.id === id);
  if (existente) {
    if ((existente.qtd || 1) >= limite) {
      showToast("toastFavorito", `Só temos ${limite} unidade(s) de "${p.nome}".`);
      return;
    }
    existente.qtd = (existente.qtd || 1) + 1;
  } else {
    carrinho.push({ ...p, qtd: 1 });
  }

  salvarJSON("carrinho_lv", carrinho);
  atualizarContadorCarrinho();
  showToast("toastCarrinho", `"${p.nome}" adicionado ao carrinho! 🛒`);
}

function alterarQtdCarrinho(id, delta) {
  const item = carrinho.find(i => i.id === id);
  if (!item) return;
  const p = produtos.find(x => x.id === id);
  const limite = p ? limiteDoItem(p) : 99;
  const nova = (item.qtd || 1) + delta;
  if (nova > limite) {
    showToast("toastFavorito", `Só temos ${limite} unidade(s) disponíveis.`);
    return;
  }
  item.qtd = nova;
  if (item.qtd <= 0) {
    carrinho = carrinho.filter(i => i.id !== id);
  }
  salvarJSON("carrinho_lv", carrinho);
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

function removerItemCarrinho(id) {
  carrinho = carrinho.filter(i => i.id !== id);
  salvarJSON("carrinho_lv", carrinho);
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

function capturarRascunhoCheckout() {
  const ler = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
  const campos = { endereco: "inputEndereco", whatsapp: "inputWhatsapp", msg: "inputMsgCartao", data: "inputDataEntrega" };
  for (const [chave, id] of Object.entries(campos)) {
    const v = ler(id);
    if (v !== undefined) rascunhoCheckout[chave] = v;
  }
  salvarJSON("checkout_rascunho_lv", rascunhoCheckout);
}

// Mesmas regras do servidor (lib/precos.js). O servidor recalcula tudo no pedido e é quem manda.
function calcularTotaisCarrinho() {
  const subtotal = round2(carrinho.reduce((s, i) => s + round2(i.preco * (i.qtd || 1)), 0));
  const descontoCupom = cupomAplicado ? round2(subtotal * cupomPercentual / 100) : 0;
  const descontoPix = metodoPagamentoAtivo === "pix" ? round2((subtotal - descontoCupom) * 5 / 100) : 0;
  const frete = subtotal >= 99 ? 0 : 15;
  return { subtotal, descontoCupom, descontoPix, frete, total: round2(subtotal - descontoCupom - descontoPix + frete) };
}

function renderizarCarrinho() {
  const content = document.getElementById("content");
  if (!content) return;
  capturarRascunhoCheckout();

  if (carrinho.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 24px; max-width: 600px; margin: 40px auto;">
        <span style="font-size: 3rem;">🛒</span>
        <h3 style="font-size: 1.8rem; color: var(--verde-escuro); margin: 12px 0;">Seu carrinho está vazio</h3>
        <p style="color: var(--texto-secundario); margin-bottom: 24px;">Adicione mudas e hortaliças para começar seu pedido.</p>
        <button type="button" class="btn-hero-primary" onclick="showPage('home')">Ver produtos</button>
      </div>
    `;
    return;
  }

  const t = calcularTotaisCarrinho();
  const logado = !!localStorage.getItem("token_lv");
  const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const itensHTML = carrinho.map(item => `
    <div class="carrinho-item">
      <img src="${esc(item.imagem)}" alt="${esc(item.nome)}" class="carrinho-img">
      <div class="carrinho-detalhes">
        <strong>${esc(item.nome)}</strong>
        <p>${fmtBRL(item.preco)} un.</p>
      </div>
      <div class="carrinho-acoes">
        <div class="carrinho-qtd-ctrl">
          <button type="button" onclick="alterarQtdCarrinho(${item.id}, -1)">-</button>
          <span>${item.qtd || 1}</span>
          <button type="button" onclick="alterarQtdCarrinho(${item.id}, 1)">+</button>
        </div>
        <span class="carrinho-subtotal">${fmtBRL(item.preco * (item.qtd || 1))}</span>
        <button type="button" class="remove-btn" onclick="removerItemCarrinho(${item.id})" title="Remover"><i class="fa fa-trash"></i></button>
      </div>
    </div>
  `).join("");

  content.innerHTML = `
    <h2 style="font-family: var(--fonte-titulo); font-size: 2rem; color: var(--verde-escuro); margin-bottom: 24px;">Carrinho de Compras 🛒</h2>
    <div class="carrinho-page-wrap">
      <div class="carrinho-items-col">
        <div class="barra-frete-gratis">
          <p style="font-size: 0.9rem; font-weight: 700; color: var(--verde-escuro);">
            ${t.subtotal >= 99 ? "🎉 Parabéns! Você garantiu FRETE GRÁTIS!" : `Faltam ${fmtBRL(99 - t.subtotal)} para FRETE GRÁTIS!`}
          </p>
          <div class="frete-progresso-fundo">
            <div class="frete-progresso-preenchimento" style="width: ${Math.min((t.subtotal / 99) * 100, 100)}%;"></div>
          </div>
        </div>
        ${itensHTML}
      </div>

      <div class="carrinho-summary-col">
        <h3 style="font-size: 1.25rem; color: var(--verde-escuro); margin-bottom: 14px;">Resumo do Pedido</h3>

        <div class="carrinho-cupom-box" style="margin-bottom: 8px;">
          <input type="text" id="inputCupomCarrinho" placeholder="Cupom de desconto" value="${esc(cupomAplicado || "")}" maxlength="30">
          <button type="button" class="btn-aplicar-cupom" onclick="aplicarCupomInput()">Aplicar</button>
        </div>
        ${cupomAplicado ? `<p style="font-size:.82rem;color:var(--sucesso);margin-bottom:12px;">Cupom <strong>${esc(cupomAplicado)}</strong> ativo (${cupomPercentual}%). <a href="#" onclick="removerCupom(); return false;" style="text-decoration:underline;">Remover</a></p>` : `<div style="margin-bottom:6px;"></div>`}

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.92rem; margin-bottom: 16px; color: var(--texto-secundario);">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span> <span>${fmtBRL(t.subtotal)}</span></div>
          ${t.descontoCupom > 0 ? `<div style="display: flex; justify-content: space-between; color: var(--sucesso);"><span>Desconto Cupom (${cupomPercentual}%):</span> <span>- ${fmtBRL(t.descontoCupom)}</span></div>` : ""}
          ${t.descontoPix > 0 ? `<div style="display: flex; justify-content: space-between; color: var(--sucesso);"><span>Desconto Pix (5%):</span> <span>- ${fmtBRL(t.descontoPix)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between;"><span>Frete:</span> <span>${t.frete === 0 ? "Grátis" : fmtBRL(t.frete)}</span></div>
          <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; color: var(--verde-escuro); border-top: 1px solid var(--borda-suave); padding-top: 10px; margin-top: 4px;">
            <span>Total:</span> <span>${fmtBRL(t.total)}</span>
          </div>
        </div>

        <div class="checkout-extra-fields" style="margin-bottom: 16px;">
          <label><i class="fa fa-credit-card"></i> Forma de Pagamento:</label>
          <div class="payment-method-selector">
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo === "pix" ? "active" : ""}" onclick="setMetodoPagamento('pix')">Pix (5% OFF)</button>
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo === "cartao" ? "active" : ""}" onclick="setMetodoPagamento('cartao')">Cartão (3x)</button>
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo === "boleto" ? "active" : ""}" onclick="setMetodoPagamento('boleto')">Boleto</button>
          </div>

          <label style="margin-top: 8px;"><i class="fa fa-location-dot"></i> Endereço de entrega (rua, nº, bairro, cidade e CEP):</label>
          <textarea id="inputEndereco" rows="3" maxlength="300" placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP - 01000-000">${esc(rascunhoCheckout.endereco)}</textarea>

          <label><i class="fa-brands fa-whatsapp"></i> WhatsApp para contato (opcional):</label>
          <input type="tel" id="inputWhatsapp" maxlength="20" placeholder="(11) 90000-0000" value="${esc(rascunhoCheckout.whatsapp)}">

          <label><i class="fa fa-gift"></i> Mensagem para o Cartão Presente:</label>
          <textarea id="inputMsgCartao" rows="2" maxlength="200" placeholder="Ex: Com carinho, para a sua horta!">${esc(rascunhoCheckout.msg)}</textarea>

          <label><i class="fa fa-calendar"></i> Data Preferida de Entrega:</label>
          <input type="date" id="inputDataEntrega" min="${hoje}" value="${esc(rascunhoCheckout.data)}">
        </div>

        ${logado ? "" : `<p style="font-size:.85rem;color:var(--texto-secundario);margin-bottom:10px;">🔒 Para pagar online você precisa entrar na sua conta (leva 1 minuto).</p>`}
        <button type="button" class="btn-buy-now" style="width: 100%; margin-bottom: 10px;" onclick="finalizarPedido()">
          <i class="fa fa-lock"></i> Finalizar compra • ${fmtBRL(t.total)}
        </button>
        <button type="button" class="btn-confirm-whatsapp-order" style="width: 100%;" onclick="finalizarPedidoWhatsApp()">
          <i class="fa-brands fa-whatsapp"></i> Prefiro pedir pelo WhatsApp
        </button>
      </div>
    </div>
  `;
}

async function aplicarCupomInput() {
  const input = document.getElementById("inputCupomCarrinho");
  if (!input) return;
  capturarRascunhoCheckout();
  const codigo = input.value.trim().toUpperCase();
  if (!codigo) { removerCupom(); return; }
  await copiarCupom(codigo);
}

function setMetodoPagamento(metodo) {
  capturarRascunhoCheckout();
  metodoPagamentoAtivo = metodo;
  renderizarCarrinho();
}

function finalizarPedidoWhatsApp() {
  if (carrinho.length === 0) return;
  capturarRascunhoCheckout();
  const t = calcularTotaisCarrinho();

  let texto = `🌿 *NOVO PEDIDO — LOJA VERDE*\n\n`;
  carrinho.forEach(item => {
    texto += `• ${item.qtd || 1}x ${item.nome} (${fmtBRL(item.preco * (item.qtd || 1))})\n`;
  });

  if (rascunhoCheckout.endereco.trim()) texto += `\n📍 *Endereço:* ${rascunhoCheckout.endereco.trim()}`;
  if (rascunhoCheckout.msg.trim()) texto += `\n🎁 *Mensagem do Cartão:* ${rascunhoCheckout.msg.trim()}`;
  texto += `\n📅 *Entrega Desejada:* ${rascunhoCheckout.data || "O mais rápido possível"}`;
  texto += `\n💳 *Pagamento:* ${metodoPagamentoAtivo.toUpperCase()}`;
  if (t.descontoCupom > 0) texto += `\n🎟️ *Cupom ${cupomAplicado}:* - ${fmtBRL(t.descontoCupom)}`;
  if (t.descontoPix > 0) texto += `\n⚡ *Desconto Pix:* - ${fmtBRL(t.descontoPix)}`;
  texto += `\n🚚 *Frete:* ${t.frete === 0 ? "Grátis" : fmtBRL(t.frete)}`;
  texto += `\n\n💰 *Total Estimado:* ${fmtBRL(t.total)}`;

  window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
}

// ==========================================================================
// MODAL DE DETALHES DO PRODUTO
// ==========================================================================
function abrirModalProduto(id) {
  const p = produtos.find(item => item.id === id);
  if (!p) return;

  const modal = document.getElementById("modalProduto");
  const container = document.getElementById("detalhesProduto");
  if (!modal || !container) return;

  const precoF = p.preco.toFixed(2).replace('.', ',');
  const pixF = (p.preco * 0.95).toFixed(2).replace('.', ',');

  container.innerHTML = `
    <div class="modal-breadcrumb-bar">
      <div class="breadcrumb-trail">
        <a href="#" onclick="fecharModal(); navegarCategoria('todos'); return false;">Início</a> / 
        <span>${esc(p.nome)}</span>
      </div>
    </div>

    <div class="modal-product-layout">
      <div class="product-gallery-side">
        <div class="gallery-main-frame">
          <img src="${esc(p.imagem)}" alt="${esc(p.nome)}">
        </div>
      </div>

      <div class="product-info-side">
        <span class="produto-selo ${p.selo} product-info-badge">${esc(p.textoSelo)}</span>
        <h2 class="product-detail-name">${esc(p.nome)}</h2>
        
        <div class="product-social-proof">
          <span>⭐ ${p.avaliacoes} (${p.vendidos} vendidos)</span> • 
          <span style="color: var(--sucesso); font-weight: 700;">Garantia Planta Viva</span>
        </div>

        <div class="product-detail-pricing">
          <span class="product-detail-price">R$ ${precoF}</span>
          <p class="product-detail-installment">ou no Pix com 5% OFF por <strong class="pix-off-tag">R$ ${pixF}</strong></p>
        </div>

        <div class="product-specs-quad">
          <div class="spec-box"><span class="spec-label">Luz</span><span class="spec-value">${esc(p.cuidados.luz)}</span></div>
          <div class="spec-box"><span class="spec-label">Rega</span><span class="spec-value">${esc(p.cuidados.agua)}</span></div>
          <div class="spec-box"><span class="spec-label">Porte</span><span class="spec-value">${esc(p.cuidados.tamanho)}</span></div>
          <div class="spec-box"><span class="spec-label">Pet Friendly</span><span class="spec-value">${p.cuidados.petFriendly ? 'Sim 🐾' : 'Não ⚠️'}</span></div>
        </div>

        <p style="color: var(--texto-secundario); margin-bottom: 20px; line-height: 1.5;">${esc(p.descricao)}</p>

        <div class="product-ctas-stack">
          <button type="button" class="btn-buy-now" onclick="comprarEIr(${p.id})">
            Comprar Agora
          </button>
          <button type="button" class="btn-add-cart-outline" onclick="comprarProduto(${p.id})">
            <i class="fa fa-cart-plus"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function fecharModal() {
  const modal = document.getElementById("modalProduto");
  if (modal) modal.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

// ==========================================================================
// FAVORITOS
// ==========================================================================
function alternarFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(fId => fId !== id);
    showToast("toastFavorito", "Removido dos favoritos.");
  } else {
    favoritos.push(id);
    showToast("toastFavorito", "Adicionado aos favoritos ❤️");
  }
  salvarJSON("favoritos_lv", favoritos);
  renderizarHome();
}

function renderizarFavoritos() {
  const content = document.getElementById("content");
  if (!content) return;

  const prodsFav = produtos.filter(p => favoritos.includes(p.id));
  if (prodsFav.length === 0) {
    content.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: #fff; border-radius: 24px; max-width: 600px; margin: 40px auto;">
        <span style="font-size: 3rem;">❤️</span>
        <h3 style="font-size: 1.8rem; color: var(--verde-escuro); margin: 12px 0;">Sua lista de favoritos está vazia</h3>
        <p style="color: var(--texto-secundario); margin-bottom: 24px;">Clique no coração dos produtos que você mais gosta.</p>
        <button type="button" class="btn-hero-primary" onclick="showPage('home')">Explorar catálogo</button>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <h2 style="font-family: var(--fonte-titulo); font-size: 2rem; color: var(--verde-escuro); margin-bottom: 24px;">Meus Favoritos ❤️</h2>
    <div class="grid">${prodsFav.map(p => gerarCardProduto(p)).join("")}</div>
  `;
}

// ==========================================================================
// MODAIS AUXILIARES & QUIZ
// ==========================================================================
function abrirModalQuiz() {
  const m = document.getElementById("modalQuiz");
  const box = document.getElementById("quizContainer");
  if (!m || !box) return;

  box.innerHTML = `
    <div style="text-align: center; padding: 10px 0;">
      <span style="font-size: 2.5rem;">✨</span>
      <h3 style="font-size: 1.6rem; color: var(--verde-escuro); margin: 10px 0;">Qual planta combina com você?</h3>
      <p style="color: var(--texto-secundario); margin-bottom: 20px;">Indique onde você vai colocar sua planta:</p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button type="button" class="quiz-opt-btn" onclick="resultadoQuiz('sol')">☀️ Varanda ou janela com sol direto</button>
        <button type="button" class="quiz-opt-btn" onclick="resultadoQuiz('sombra')">🌥️ Sala ou quarto com luz indireta</button>
        <button type="button" class="quiz-opt-btn" onclick="resultadoQuiz('facil')">💧 Quero uma planta super fácil (pouca água)</button>
      </div>
    </div>
  `;
  m.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function resultadoQuiz(tipo) {
  fecharModalQuiz();
  if (tipo === 'sol') filtrarPorTag('sol');
  else if (tipo === 'sombra') filtrarPorTag('sombra');
  else filtrarPorTag('facil');
}

function fecharModalQuiz() {
  const m = document.getElementById("modalQuiz");
  if (m) m.classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function abrirModalGarantia() {
  const m = document.getElementById("modalGarantia");
  if (m) {
    m.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }
}

function fecharModalGarantia() {
  const m = document.getElementById("modalGarantia");
  if (m) {
    m.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

function abrirModalAssinatura() {
  const m = document.getElementById("modalAssinatura");
  if (m) {
    m.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }
}

function fecharModalAssinatura() {
  const m = document.getElementById("modalAssinatura");
  if (m) {
    m.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}

function abrirModalEmpresas() {
  const m = document.getElementById("modalEmpresas");
  if (m) {
    m.classList.remove("hidden");
    document.body.classList.add("no-scroll");
  }
}

function fecharModalEmpresas() {
  const m = document.getElementById("modalEmpresas");
  if (m) {
    m.classList.add("hidden");
    document.body.classList.remove("no-scroll");
  }
}