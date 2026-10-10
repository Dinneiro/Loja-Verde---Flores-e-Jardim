/**
 ==========================================================================
 LOJA VERDE — CATÁLOGO DE PRODUTOS, LÓGICA DE ALTA CONVERSÃO & API NODE.JS
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
  },
  {
    id: 18,
    nome: "Lavanda Francesa em Vaso",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 29.9,
    precoOriginal: 36.0,
    imagem: "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Flores aromáticas em tons violetas; ideal para varandas ensolaradas e jardins bem drenados.",
    selo: "destaque",
    textoSelo: "Aromática 💜",
    estoque: 22,
    cuidados: { luz: "Sol pleno", agua: "2x por semana", dificuldade: "Fácil", tamanho: "25–35 cm", petFriendly: false },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 19,
    nome: "Jiboia Verde Pendente",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 24.9,
    precoOriginal: 31.0,
    imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhagem pendente de crescimento vigoroso para prateleiras e vasos suspensos. Mantenha fora do alcance de pets.",
    selo: "destaque",
    textoSelo: "Pendente 🌿",
    estoque: 30,
    cuidados: { luz: "Luz indireta", agua: "1x por semana", dificuldade: "Fácil", tamanho: "30–60 cm", petFriendly: false },
    avaliacoes: 2,
    vendidos: 0
  },
  {
    id: 20,
    nome: "Espada-de-São-Jorge em Vaso",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 34.9,
    precoOriginal: 42.0,
    imagem: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Planta escultural e resistente, com folhas eretas e ótima adaptação a ambientes internos iluminados. Tóxica se ingerida por pets.",
    selo: "destaque",
    textoSelo: "Muito resistente 🪴",
    estoque: 24,
    cuidados: { luz: "Luz indireta ou meia-sombra", agua: "A cada 15 dias", dificuldade: "Fácil", tamanho: "35–50 cm", petFriendly: false },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 21,
    nome: "Antúrio Vermelho em Vaso",
    categoria: "ornamentais",
    subcategoria: "aniversario",
    preco: 49.9,
    precoOriginal: 59.9,
    imagem: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Jardim da Paz",
    descricao: "Flores vermelhas e folhas brilhantes para presentear ou decorar ambientes protegidos. Não indicada para casas com pets que mordiscam plantas.",
    selo: "novo",
    textoSelo: "Floração ❤️",
    estoque: 15,
    cuidados: { luz: "Luz indireta", agua: "2x por semana", dificuldade: "Médio", tamanho: "35–45 cm", petFriendly: false },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 22,
    nome: "Maranta Tricolor",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 39.9,
    precoOriginal: 48.0,
    imagem: "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhas decorativas com tons verdes, creme e rosados; prefere umidade e luz difusa, sem sol forte direto.",
    selo: "novo",
    textoSelo: "Folhagem colorida 🍃",
    estoque: 14,
    cuidados: { luz: "Meia-sombra", agua: "Manter substrato levemente úmido", dificuldade: "Médio", tamanho: "20–30 cm", petFriendly: true },
    avaliacoes: 7,
    vendidos: 0
  },
  {
    id: 23,
    nome: "Peperômia Melancia",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 27.9,
    precoOriginal: 34.0,
    imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhas arredondadas com desenho que lembra a casca de uma melancia. Compacta e fácil de acomodar em mesas.",
    selo: "novo",
    textoSelo: "Compacta 🌱",
    estoque: 18,
    cuidados: { luz: "Luz indireta", agua: "Quando o substrato secar", dificuldade: "Fácil", tamanho: "15–20 cm", petFriendly: true },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 24,
    nome: "Filodendro Brasil",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 32.9,
    precoOriginal: 39.9,
    imagem: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhagem pendente variegada em verde e amarelo, ótima para vasos altos. Mantenha fora do alcance de animais.",
    selo: "destaque",
    textoSelo: "Folhas bicolores 🌿",
    estoque: 20,
    cuidados: { luz: "Luz indireta", agua: "1x por semana", dificuldade: "Fácil", tamanho: "30–50 cm", petFriendly: false },
    avaliacoes: 6,
    vendidos: 0
  },
  {
    id: 25,
    nome: "Calatéia Orbifolia",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 59.9,
    precoOriginal: 72.0,
    imagem: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhas grandes com listras prateadas. Prefere ambiente protegido, umidade estável e luz filtrada.",
    selo: "novo",
    textoSelo: "Folhagem premium 🍃",
    estoque: 10,
    cuidados: { luz: "Luz indireta", agua: "2–3x por semana", dificuldade: "Médio", tamanho: "35–50 cm", petFriendly: true },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 26,
    nome: "Cacto Mandacaru Jovem",
    categoria: "suculentas",
    subcategoria: "jardim",
    preco: 22.9,
    precoOriginal: 29.0,
    imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Cacto de presença marcante para áreas bem iluminadas. Use substrato drenante e manuseie com cuidado devido aos espinhos.",
    selo: "novo",
    textoSelo: "Cacto 🌵",
    estoque: 28,
    cuidados: { luz: "Sol pleno", agua: "A cada 15–20 dias", dificuldade: "Fácil", tamanho: "15–25 cm", petFriendly: false },
    avaliacoes: 6,
    vendidos: 0
  },
  {
    id: 27,
    nome: "Haworthia Zebra",
    categoria: "suculentas",
    subcategoria: "jardim",
    preco: 18.9,
    precoOriginal: 24.0,
    imagem: "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Suculenta compacta com listras brancas, indicada para pequenos vasos e composições de mesa.",
    selo: "novo",
    textoSelo: "Mini suculenta 🌵",
    estoque: 36,
    cuidados: { luz: "Luz indireta intensa", agua: "A cada 12–15 dias", dificuldade: "Fácil", tamanho: "8–12 cm", petFriendly: false },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 28,
    nome: "Rabo-de-Burro Sedum",
    categoria: "suculentas",
    subcategoria: "jardim",
    preco: 26.9,
    precoOriginal: 33.0,
    imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Suculenta pendente com folhas carnudas, ótima para cestos suspensos. Evite tocar excessivamente nas folhas.",
    selo: "novo",
    textoSelo: "Pendente 🌱",
    estoque: 18,
    cuidados: { luz: "Sol da manhã", agua: "A cada 10–15 dias", dificuldade: "Fácil", tamanho: "20–35 cm pendente", petFriendly: false },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 29,
    nome: "Planta-Jade em Vaso Cerâmico",
    categoria: "suculentas",
    subcategoria: "aniversario",
    preco: 31.9,
    precoOriginal: 39.0,
    imagem: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Cactos & Pedras",
    descricao: "Suculenta de folhas arredondadas e crescimento lento, oferecida em vaso cerâmico decorativo.",
    selo: "destaque",
    textoSelo: "Presente verde 🎁",
    estoque: 21,
    cuidados: { luz: "Sol da manhã", agua: "A cada 12–15 dias", dificuldade: "Fácil", tamanho: "15–25 cm", petFriendly: false },
    avaliacoes: 6,
    vendidos: 0
  },
  {
    id: 30,
    nome: "Tomate-Cereja Muda para Horta",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 9.9,
    precoOriginal: 12.0,
    imagem: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Muda para cultivo em vaso grande ou canteiro. Precisa de sol, suporte e regas regulares sem encharcar.",
    selo: "novo",
    textoSelo: "Horta em casa 🍅",
    estoque: 40,
    cuidados: { luz: "Sol pleno", agua: "Diariamente, conforme clima", dificuldade: "Médio", tamanho: "15–25 cm na venda", petFriendly: true },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 31,
    nome: "Pimenta-Biquinho Muda",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 11.9,
    precoOriginal: 14.9,
    imagem: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Muda de pimenta-biquinho para vasos ou canteiros ensolarados. A produção depende da luminosidade e do manejo.",
    selo: "novo",
    textoSelo: "Horta 🌶️",
    estoque: 32,
    cuidados: { luz: "Sol pleno", agua: "Diariamente, sem encharcar", dificuldade: "Médio", tamanho: "15–25 cm na venda", petFriendly: true },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 32,
    nome: "Morango Muda Produtiva",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 8.9,
    precoOriginal: 11.0,
    imagem: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Muda para jardineiras e vasos com boa drenagem. Cultivo e frutificação dependem da variedade e do clima local.",
    selo: "novo",
    textoSelo: "Frutinha 🍓",
    estoque: 45,
    cuidados: { luz: "Sol pleno ou meia-sombra clara", agua: "Manter úmido", dificuldade: "Médio", tamanho: "10–15 cm", petFriendly: true },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 33,
    nome: "Muda de Limão-Tahiti",
    categoria: "mudas",
    subcategoria: "jardim",
    preco: 39.9,
    precoOriginal: 49.9,
    imagem: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Frutos da Terra",
    descricao: "Muda cítrica para quintais ou vasos grandes. Necessita de sol direto e cuidados contínuos para se desenvolver.",
    selo: "destaque",
    textoSelo: "Frutífera 🍋",
    estoque: 12,
    cuidados: { luz: "Sol pleno", agua: "2–3x por semana, conforme clima", dificuldade: "Médio", tamanho: "30–45 cm", petFriendly: true },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 34,
    nome: "Muda de Pitangueira",
    categoria: "mudas",
    subcategoria: "jardim",
    preco: 34.9,
    precoOriginal: 44.0,
    imagem: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Frutos da Terra",
    descricao: "Espécie brasileira para jardins e vasos espaçosos; aprecia boa luminosidade e substrato fértil e drenado.",
    selo: "novo",
    textoSelo: "Nativa brasileira 🌳",
    estoque: 14,
    cuidados: { luz: "Sol pleno", agua: "2–3x por semana", dificuldade: "Médio", tamanho: "25–40 cm", petFriendly: true },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 35,
    nome: "Muda de Aceroleira",
    categoria: "mudas",
    subcategoria: "jardim",
    preco: 32.9,
    precoOriginal: 41.0,
    imagem: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Frutos da Terra",
    descricao: "Frutífera de clima quente que pode ser cultivada em quintais e vasos grandes, com poda e sol adequados.",
    selo: "novo",
    textoSelo: "Frutífera 🍒",
    estoque: 16,
    cuidados: { luz: "Sol pleno", agua: "2–3x por semana", dificuldade: "Médio", tamanho: "25–40 cm", petFriendly: true },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 36,
    nome: "Muda de Goiabeira",
    categoria: "mudas",
    subcategoria: "jardim",
    preco: 36.9,
    precoOriginal: 46.0,
    imagem: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Frutos da Terra",
    descricao: "Muda frutífera para áreas externas ensolaradas. Reserve espaço para o crescimento e mantenha o solo drenado.",
    selo: "novo",
    textoSelo: "Frutífera 🌳",
    estoque: 11,
    cuidados: { luz: "Sol pleno", agua: "2–3x por semana", dificuldade: "Médio", tamanho: "30–45 cm", petFriendly: true },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 37,
    nome: "Capim-Limão em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 16.9,
    precoOriginal: 21.0,
    imagem: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Touceira aromática popular para infusões e jardins caseiros; cresce melhor com sol e espaço para se expandir.",
    selo: "novo",
    textoSelo: "Aromático 🍵",
    estoque: 26,
    cuidados: { luz: "Sol pleno", agua: "2–3x por semana", dificuldade: "Fácil", tamanho: "25–35 cm", petFriendly: true },
    avaliacoes: 6,
    vendidos: 0
  },
  {
    id: 38,
    nome: "Orégano Grego em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 15.9,
    precoOriginal: 19.9,
    imagem: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Erva culinária para massas e molhos, com aroma intenso e preferência por boa iluminação e drenagem.",
    selo: "novo",
    textoSelo: "Tempero 🍃",
    estoque: 31,
    cuidados: { luz: "Sol pleno", agua: "Quando o substrato secar", dificuldade: "Fácil", tamanho: "15–25 cm", petFriendly: true },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 39,
    nome: "Tomilho-Limão em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 17.9,
    precoOriginal: 22.0,
    imagem: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Erva aromática de folhas pequenas, indicada para vasos ensolarados e receitas com legumes e assados.",
    selo: "novo",
    textoSelo: "Aromático 🍋",
    estoque: 25,
    cuidados: { luz: "Sol pleno", agua: "1–2x por semana", dificuldade: "Fácil", tamanho: "15–20 cm", petFriendly: true },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 40,
    nome: "Sálvia Culinária em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 18.9,
    precoOriginal: 23.0,
    imagem: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Folhas aromáticas para uso culinário; prefere sol e solo bem drenado, sem excesso de água.",
    selo: "novo",
    textoSelo: "Tempero 🌿",
    estoque: 20,
    cuidados: { luz: "Sol pleno", agua: "1–2x por semana", dificuldade: "Fácil", tamanho: "20–30 cm", petFriendly: true },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 41,
    nome: "Coentro Português Muda Viva",
    categoria: "hortalicas",
    subcategoria: "hortalicas",
    preco: 6.9,
    precoOriginal: 8.5,
    imagem: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Horta Orgânica do Sítio",
    descricao: "Muda aromática para colheitas caseiras. Cultive em local iluminado e mantenha a umidade sem encharcar.",
    selo: "novo",
    textoSelo: "Colheita fresca 🌱",
    estoque: 50,
    cuidados: { luz: "Sol pleno ou meia-sombra clara", agua: "Diariamente, conforme clima", dificuldade: "Fácil", tamanho: "10–20 cm", petFriendly: true },
    avaliacoes: 5,
    vendidos: 0
  },
  {
    id: 42,
    nome: "Cebolinha Verde em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 12.9,
    precoOriginal: 16.0,
    imagem: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Vaso pronto para colheitas graduais, ideal para janelas, varandas e hortas domésticas.",
    selo: "novo",
    textoSelo: "Corte e renove ✂️",
    estoque: 38,
    cuidados: { luz: "Sol pleno", agua: "3x por semana", dificuldade: "Fácil", tamanho: "20–30 cm", petFriendly: true },
    avaliacoes: 6,
    vendidos: 0
  },
  {
    id: 43,
    nome: "Salsinha Crespa em Vaso",
    categoria: "temperos",
    subcategoria: "jardim",
    preco: 13.9,
    precoOriginal: 17.0,
    imagem: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Viveiro Aromas do Campo",
    descricao: "Erva fresca de folhas crespas para finalizar receitas. Prefere luminosidade abundante e substrato levemente úmido.",
    selo: "novo",
    textoSelo: "Tempero fresco 🌿",
    estoque: 30,
    cuidados: { luz: "Sol da manhã", agua: "3x por semana", dificuldade: "Fácil", tamanho: "15–25 cm", petFriendly: true },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 44,
    nome: "Begônia Maculata Poá",
    categoria: "ornamentais",
    subcategoria: "jardim",
    preco: 54.9,
    precoOriginal: 66.0,
    imagem: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Folhas alongadas com pintas claras e verso avermelhado. Aprecia luz filtrada e regas cuidadosas.",
    selo: "destaque",
    textoSelo: "Folhas poá ✨",
    estoque: 9,
    cuidados: { luz: "Luz indireta", agua: "Quando a superfície secar", dificuldade: "Médio", tamanho: "30–45 cm", petFriendly: false },
    avaliacoes: 3,
    vendidos: 0
  },
  {
    id: 45,
    nome: "Violeta-Africana em Vaso",
    categoria: "ornamentais",
    subcategoria: "aniversario",
    preco: 19.9,
    precoOriginal: 24.9,
    imagem: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Jardim da Paz",
    descricao: "Planta compacta com floração delicada para ambientes claros. Regue o substrato sem molhar diretamente as folhas.",
    selo: "novo",
    textoSelo: "Floração delicada 💜",
    estoque: 26,
    cuidados: { luz: "Luz indireta clara", agua: "Quando a superfície secar", dificuldade: "Médio", tamanho: "10–15 cm", petFriendly: true },
    avaliacoes: 7,
    vendidos: 0
  },
  {
    id: 46,
    nome: "Gerânio Colorido em Vaso",
    categoria: "ornamentais",
    subcategoria: "aniversario",
    preco: 29.9,
    precoOriginal: 36.0,
    imagem: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Jardim da Paz",
    descricao: "Planta florífera para varandas e áreas externas arejadas. Com boa luz, pode florir por períodos prolongados.",
    selo: "novo",
    textoSelo: "Florido 🌺",
    estoque: 18,
    cuidados: { luz: "Sol pleno ou meia-sombra", agua: "2x por semana", dificuldade: "Fácil", tamanho: "20–30 cm", petFriendly: false },
    avaliacoes: 4,
    vendidos: 0
  },
  {
    id: 47,
    nome: "Bromélia Guzmania Decorativa",
    categoria: "ornamentais",
    subcategoria: "aniversario",
    preco: 48.9,
    precoOriginal: 59.0,
    imagem: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
    galeria: ["https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80"],
    vendedor: "Flora Nobre Paisagismo",
    descricao: "Bromélia tropical com bráctea colorida para ambientes iluminados sem sol forte. Evite manter o substrato encharcado.",
    selo: "destaque",
    textoSelo: "Tropical 🌺",
    estoque: 12,
    cuidados: { luz: "Luz indireta intensa", agua: "Manter leve umidade, sem encharcar", dificuldade: "Médio", tamanho: "30–45 cm", petFriendly: true },
    avaliacoes: 3,
    vendidos: 0
  }
];

// ==========================================================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================================================
// O carrinho pode ter sido salvo por uma versão anterior do site.
// Reconstrua cada item com os dados atuais do catálogo para evitar erros como
// item.preco.toFixed is not a function e preços antigos/inválidos.
function gerarChaveLinhaCarrinho() {
  return `lv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizarCarrinho(itens) {
  if (!Array.isArray(itens)) return [];
  const normalizados = [];
  const condicoesValidas = new Set(["padrao", "agendada", "retirada"]);
  for (const item of itens) {
    if (!item || typeof item !== "object") continue;
    const id = Number(item.id ?? item.produto_id);
    if (!Number.isInteger(id)) continue;
    const produtoAtual = produtos.find(produto => Number(produto.id) === id);
    if (!produtoAtual) continue;
    const qInformada = Number(item.qtd ?? item.quantidade ?? 1);
    const quantidade = Number.isFinite(qInformada) ? Math.max(1, Math.min(99, Math.floor(qInformada))) : 1;
    const condicaoEntrega = condicoesValidas.has(item.condicaoEntrega) ? item.condicaoEntrega : "padrao";
    const observacao = String(item.observacao || "").trim().slice(0, 500);
    const existente = normalizados.find(p => p.id === id && p.condicaoEntrega === condicaoEntrega && p.observacao === observacao);
    if (existente) {
      existente.qtd = Math.min(99, existente.qtd + quantidade);
    } else {
      const chaveInformada = String(item.lineKey || "");
      const lineKey = /^[a-z0-9-]{1,60}$/i.test(chaveInformada) ? chaveInformada : gerarChaveLinhaCarrinho();
      normalizados.push({ ...produtoAtual, qtd: quantidade, condicaoEntrega, observacao, lineKey });
    }
  }
  return normalizados;
}

let produtoModalAtualId = null;
// O carrinho é isolado por conta. Carrinhos antigos de visitante não são mostrados
// a outro usuário do mesmo navegador.
let carrinho = [];
let favoritos = lerJSON("favoritos_lv", []);
let usuario = null;
let acaoProtegidaPendente = null;
// A conta nunca permanece conectada entre inicializações/recarregamentos.
localStorage.removeItem("usuario_lv");
localStorage.removeItem("carrinho_lv");
const AUTH_TOKEN_KEY = "lv_auth_token";

function chaveCarrinhoConta(conta = usuario) {
  return conta && Number.isInteger(Number(conta.id)) ? `carrinho_lv_usuario_${Number(conta.id)}` : null;
}

function carregarCarrinhoDaConta() {
  const chave = chaveCarrinhoConta();
  carrinho = chave ? normalizarCarrinho(lerJSON(chave, [])) : [];
  if (chave) salvarJSON(chave, carrinho);
  atualizarContadorCarrinho();
}

function salvarCarrinhoDaConta() {
  const chave = chaveCarrinhoConta();
  if (chave) salvarJSON(chave, normalizarCarrinho(carrinho));
}

function chaveCheckoutConta(conta = usuario) {
  return conta && Number.isInteger(Number(conta.id)) ? `checkout_lv_usuario_${Number(conta.id)}` : null;
}

function carregarCheckoutDaConta() {
  const chave = chaveCheckoutConta();
  checkoutDados = chave ? lerJSON(chave, {}) : {};
}

function salvarCheckoutDaConta() {
  const chave = chaveCheckoutConta();
  if (chave) salvarJSON(chave, checkoutDados);
}

function contaAutenticada() {
  return Boolean(usuario && usuario.id && sessionStorage.getItem(AUTH_TOKEN_KEY));
}

function exigirConta(motivo, continuar = null) {
  if (contaAutenticada()) return true;
  acaoProtegidaPendente = typeof continuar === "function" ? continuar : null;
  const modal = document.getElementById("modalLogin");
  renderizarModalAutenticacao("cadastro", `Para ${motivo}, crie sua conta e confirme seu e-mail ou entre em uma conta já verificada.`);
  if (modal) modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  return false;
}

function executarAcaoProtegidaPendente() {
  if (typeof acaoProtegidaPendente !== "function") return false;
  const acao = acaoProtegidaPendente;
  acaoProtegidaPendente = null;
  const modal = document.getElementById("modalLogin");
  if (modal) modal.classList.add("hidden");
  sincronizarTravaScrollModal();
  try { acao(); } catch (error) { console.error("Não foi possível retomar a ação após a autenticação:", error); }
  return true;
}

let categoriaAtiva = "todos";
let filtroTagAtivo = "todos";
let termoBuscaAtivo = "";
let cupomAplicado = (localStorage.getItem("cupom_lv") || "").toUpperCase() === "VERDE10" ? "VERDE10" : null;
if (!cupomAplicado) localStorage.removeItem("cupom_lv");
let metodoPagamentoAtivo = "pix";

const API_BASE = "";
let configLoja = {
  nome_loja: "Loja Verde", email_contato: "contato@lojaverde.com.br", whatsapp: WHATSAPP_NUMERO,
  frete_gratis_acima: 99, frete_valor: 15, desconto_cupom: 10,
  aviso_topo: "Frete grátis acima de R$ 99 • Pix com 5% de desconto • Cupom VERDE10 na primeira compra"
};
let checkoutDados = {};
// Remove dados antigos de checkout compartilhados entre visitantes deste navegador.
localStorage.removeItem("checkout_lv");

async function carregarConfiguracoesPublicas() {
  try {
    const resposta = await fetch(`${API_BASE}/api/configuracoes/publicas`, { cache: "no-store" });
    if (!resposta.ok) return;
    const dados = await resposta.json();
    if (dados.sucesso && dados.configuracoes) configLoja = { ...configLoja, ...dados.configuracoes };
    aplicarConfiguracoesNaPagina();
  } catch (erro) { console.warn("Configurações da loja indisponíveis; usando padrão local.", erro); }
}

async function carregarProdutosDoServidor() {
  try {
    const resposta = await fetch(`${API_BASE}/api/produtos`, { cache: "no-store" });
    if (!resposta.ok) return;
    const dados = await resposta.json();
    if (!dados.sucesso || !Array.isArray(dados.produtos) || !dados.produtos.length) return;
    const locais = new Map(produtos.map(p => [Number(p.id), p]));
    produtos = dados.produtos.map(p => {
      const local = locais.get(Number(p.id)) || {};
      const imagem = p.imagem || local.imagem || "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=800&q=80";
      return {
        ...local, ...p, id: Number(p.id), nome: String(p.nome || local.nome || "Produto"),
        categoria: String(p.categoria || local.categoria || "mudas"),
        subcategoria: local.subcategoria || p.categoria || "mudas",
        preco: Number(p.preco ?? local.preco ?? 0),
        precoOriginal: p.precoOriginal == null ? (local.precoOriginal ?? null) : Number(p.precoOriginal),
        estoque: Number(p.estoque ?? local.estoque ?? 0), imagem,
        galeria: local.imagem && local.imagem !== imagem ? [imagem] : (local.galeria || [imagem]),
        vendedor: String(p.vendedor || local.vendedor || configLoja.nome_loja || "Loja Verde"),
        descricao: p.descricao || local.descricao || "Planta selecionada para trazer mais verde ao seu espaço.",
        selo: local.selo || "novo", textoSelo: local.textoSelo || "Disponível 🌱",
        cuidados: local.cuidados || { luz: "Consultar", agua: "Consultar", dificuldade: "Fácil", tamanho: "Variável", petFriendly: false },
        avaliacoes: local.avaliacoes ?? 5, vendidos: local.vendidos ?? 0
      };
    });
    carrinho = normalizarCarrinho(carrinho);
    salvarCarrinhoDaConta();
    atualizarContadorCarrinho();
  } catch (erro) { console.warn("Catálogo da API indisponível; usando catálogo de demonstração.", erro); }
}

function aplicarConfiguracoesNaPagina() {
  const nome = document.querySelector(".logo-btn span:last-child");
  if (nome) nome.textContent = configLoja.nome_loja || "Loja Verde";
  document.title = `${configLoja.nome_loja || "Loja Verde"} — Flores e Jardim`;
  const aviso = document.querySelector(".announcement-content");
  if (aviso && configLoja.aviso_topo) aviso.textContent = configLoja.aviso_topo;
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(a => {
    const numero = String(configLoja.whatsapp || WHATSAPP_NUMERO).replace(/\D/g, "");
    const mensagem = a.href.includes("text=") ? decodeURIComponent((a.href.split("text=")[1] || "").replace(/\+/g, " ")) : "Olá! Vim pelo site e gostaria de falar com a loja.";
    a.href = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  });
  const emailFooter = document.querySelector(".footer-col p .fa-envelope");
  if (emailFooter && emailFooter.parentElement) emailFooter.parentElement.lastChild.textContent = ` ${configLoja.email_contato || "contato@lojaverde.com.br"}`;
  const telefoneFooter = document.querySelector(".footer-col p .fa-whatsapp");
  if (telefoneFooter && telefoneFooter.parentElement) {
    const digitos = String(configLoja.whatsapp || WHATSAPP_NUMERO).replace(/\D/g, "");
    let formatado = `+${digitos}`;
    if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
      const ddd = digitos.slice(2, 4), local = digitos.slice(4);
      formatado = `+55 (${ddd}) ${local.length === 9 ? local.slice(0, 5) + "-" + local.slice(5) : local.slice(0, 4) + "-" + local.slice(4)}`;
    }
    telefoneFooter.parentElement.lastChild.textContent = ` ${formatado}`;
  }
}

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
window.addEventListener("DOMContentLoaded", async () => {
  await encerrarSessaoAnterior();
  await carregarConfiguracoesPublicas();
  await carregarProdutosDoServidor();
  aplicarConfiguracoesNaPagina();
  // Registra a navegação do carrinho ANTES de renderizar a página inicial.
  // Assim, um erro secundário na home não impede o botão de funcionar.
  const btnAbrirCarrinho = document.getElementById("btnAbrirCarrinho");
  if (btnAbrirCarrinho) {
    btnAbrirCarrinho.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        showPage("carrinho");
      } catch (error) {
        console.error("Falha ao abrir o carrinho:", error);
        const content = document.getElementById("content");
        if (content) content.innerHTML = '<section style="padding:32px;background:#fff;border-radius:16px"><h2>Não foi possível abrir o carrinho</h2><p>Recarregue a página. Se o problema continuar, abra o Console do navegador (F12) e verifique os erros.</p><button type="button" onclick="window.location.reload()">Recarregar página</button></section>';
      }
    });
  }

  try { atualizarHeaderUsuario(); } catch (error) { console.error("Erro ao atualizar o cabeçalho:", error); }
  try { atualizarContadorCarrinho(); } catch (error) { console.error("Erro ao atualizar o contador do carrinho:", error); }
  try { renderizarHome(); } catch (error) { console.error("Erro ao renderizar a página inicial:", error); }
  rastrearVisitaNoServidor("home");

  window.addEventListener("click", e => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.add("hidden");
      if (e.target.id === "modalLogin") acaoProtegidaPendente = null;
      sincronizarTravaScrollModal();
    }
  });

  window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
      acaoProtegidaPendente = null;
      sincronizarTravaScrollModal();
    }
  });
});

// ==========================================================================
// PERFIL E AUTENTICAÇÃO — sessão exclusivamente temporária no navegador
// ==========================================================================
async function encerrarSessaoAnterior() {
  const tokenAnterior = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (tokenAnterior) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${tokenAnterior}`, "Content-Type": "application/json" }, body: "{}", keepalive: true });
    } catch (e) { console.warn("Não foi possível notificar o servidor sobre a sessão anterior.", e); }
  }
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem("loja_verde_admin_key");
  localStorage.removeItem("usuario_lv");
  usuario = null;
  atualizarHeaderUsuario();
}

function sincronizarTravaScrollModal() {
  if (document.querySelector(".modal:not(.hidden)")) document.body.classList.add("no-scroll");
  else document.body.classList.remove("no-scroll");
}

function abrirModalOuPerfil() {
  const modal = document.getElementById("modalLogin");
  if (!modal) return;
  if (usuario) renderizarPerfilConta(); else renderizarModalAutenticacao("login");
  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
}

function fecharModalLogin() {
  acaoProtegidaPendente = null;
  const modal = document.getElementById("modalLogin");
  if (modal) modal.classList.add("hidden");
  sincronizarTravaScrollModal();
}

function renderizarModalAutenticacao(modo = "login", aviso = "") {
  const body = document.getElementById("loginModalBody");
  if (!body) return;
  const cadastro = modo === "cadastro";
  body.dataset.pendingEmail = "";
  body.innerHTML = `
    <div class="account-modal-heading"><span class="account-leaf">🌿</span><h2>${cadastro ? "Crie sua conta" : "Bem-vindo à Loja Verde"}</h2><p>${cadastro ? "Cadastre seus dados para avaliar produtos, acompanhar pedidos e facilitar suas próximas compras." : "Entre para acessar seu perfil, acompanhar pedidos e avaliar produtos e produtores."}</p></div>
    <div class="account-tabs" role="tablist" aria-label="Acesso à conta">
      <button type="button" class="${!cadastro ? "active" : ""}" role="tab" aria-selected="${!cadastro}" onclick="renderizarModalAutenticacao('login')">Entrar</button>
      <button type="button" class="${cadastro ? "active" : ""}" role="tab" aria-selected="${cadastro}" onclick="renderizarModalAutenticacao('cadastro')">Criar conta</button>
    </div>
    <form id="formContaLoja" class="account-form" onsubmit="${cadastro ? "cadastrarConta(event)" : "entrarConta(event)"}">
      ${cadastro ? `
        <label>Nome completo<input name="nome" autocomplete="name" minlength="2" maxlength="120" required></label>
        <label>WhatsApp / telefone <small>(opcional)</small><input name="telefone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="(91) 99999-9999"></label>
      ` : ""}
      <label>E-mail<input type="email" name="email" autocomplete="email" required maxlength="180" placeholder="voce@exemplo.com"></label>
      <label>Senha<input type="password" name="senha" autocomplete="${cadastro ? "new-password" : "current-password"}" minlength="10" maxlength="200" required></label>
      ${cadastro ? `
        <label>Confirme sua senha<input type="password" name="confirmar_senha" autocomplete="new-password" minlength="10" maxlength="200" required></label>
        <small>Use 10 caracteres ou mais. Enviaremos um código de 6 dígitos para confirmar que você tem acesso ao e-mail.</small>
        <label class="account-check-label"><input type="checkbox" name="receber_novidades"> Quero receber novidades e promoções por e-mail (opcional).</label>
        <details class="account-terms-details"><summary>Como seus dados serão usados</summary><p>Nome e e-mail são usados para criar e proteger sua conta, verificar seu endereço, recuperar a senha e relacionar pedidos feitos enquanto você estiver conectado. O telefone é opcional e pode ajudar a loja a tratar entregas. O recebimento de novidades é opcional e pode ser desmarcado no perfil.</p><p>Não informe dados de pagamento neste cadastro. Para publicar a loja, substitua este resumo por termos e política de privacidade revisados, com contato e informações reais do responsável.</p></details>
        <label class="account-check-label"><input type="checkbox" name="aceita_termos" required> Entendi e aceito estes termos da demonstração e o uso dos dados para administrar minha conta.</label>
      ` : ""}
      <button type="submit" class="btn-account-primary">${cadastro ? "Criar conta e enviar código" : "Entrar"}</button>
      <p id="accountFeedback" role="status" class="account-feedback">${esc(aviso)}</p>
    </form>
    ${!cadastro ? '<button type="button" class="account-link-button" onclick="renderizarRecuperacaoSenha()">Esqueci minha senha</button>' : ""}
    <p class="account-privacy-note">Sua sessão é encerrada ao recarregar o site. Seu e-mail é usado para autenticação e comunicação necessária da conta.</p>`;
}

async function cadastrarConta(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("accountFeedback");
  const button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.senha !== data.confirmar_senha) { if (feedback) feedback.textContent = "As senhas não são iguais."; return; }
  if (data.senha.length < 10) { if (feedback) feedback.textContent = "A senha deve ter pelo menos 10 caracteres."; return; }
  data.aceita_termos = form.elements.aceita_termos?.checked === true;
  data.receber_novidades = form.elements.receber_novidades?.checked === true;
  delete data.confirmar_senha;
  if (button) { button.disabled = true; button.textContent = "Criando conta…"; }
  try {
    const r = await fetch(`${API_BASE}/api/auth/registrar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sucesso) { const err = new Error(j.mensagem || "Não foi possível criar a conta."); err.status = r.status; throw err; }
    renderizarTelaVerificacao(j.email || data.email, j, "verify");
  } catch (e) {
    if (feedback) feedback.textContent = e.message;
    if (button) { button.disabled = false; button.textContent = "Criar conta e enviar código"; }
    document.getElementById("accountExistingActions")?.remove();
    if (e.status === 409) {
      const actions = document.createElement("div");
      actions.id = "accountExistingActions";
      actions.className = "account-existing-actions";
      const email = String(data.email || "").trim().toLowerCase();
      const login = document.createElement("button");
      login.type = "button"; login.className = "account-link-button"; login.textContent = "Voltar ao login";
      login.addEventListener("click", () => renderizarModalAutenticacao("login", "Entre com sua conta ou recupere sua senha."));
      const verify = document.createElement("button");
      verify.type = "button"; verify.className = "account-link-button"; verify.textContent = "Reenviar código de verificação";
      verify.addEventListener("click", () => { renderizarTelaVerificacao(email, {}, "verify"); void reenviarCodigoEmail(); });
      const reset = document.createElement("button");
      reset.type = "button"; reset.className = "account-link-button"; reset.textContent = "Recuperar senha deste e-mail";
      reset.addEventListener("click", () => renderizarRecuperacaoSenha(email));
      actions.append(login, verify, reset);
      feedback?.after(actions);
    }
  }
}

function renderizarTelaVerificacao(email, resultado = {}, finalidade = "verify") {
  const body = document.getElementById("loginModalBody");
  if (!body) return;
  body.dataset.pendingEmail = String(email || "").toLowerCase();
  const demo = resultado.codigo_simulado ? `<div class="account-demo-code" id="accountDemoCode"><strong>Código local de demonstração:</strong> <code>${esc(resultado.codigo_simulado)}</code><p>Esse código só aparece quando não há um provedor de e-mail configurado no modo de desenvolvimento. Ele nunca é mostrado em produção.</p></div>` : `<div class="account-email-instructions"><strong>Confira sua caixa de entrada e a pasta de spam.</strong><p>O código de 6 dígitos expira em 10 minutos. Não compartilhe o código com ninguém.</p></div>`;
  body.innerHTML = `
    <div class="account-modal-heading"><span class="account-leaf">✉️</span><h2>Verifique seu e-mail</h2><p>Enviamos as instruções para <strong>${esc(email)}</strong>.</p></div>
    ${demo}
    <form id="formVerificarConta" class="account-form" onsubmit="verificarContaEmail(event)">
      <input type="hidden" name="email" value="${esc(email)}">
      <label>Código de verificação<input name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required autofocus></label>
      <button type="submit" class="btn-account-primary">Verificar e entrar</button>
      <p id="accountFeedback" role="status" class="account-feedback"></p>
    </form>
    <button type="button" class="account-link-button" onclick="reenviarCodigoEmail()">Enviar um novo código</button>
    <button type="button" class="account-link-button" onclick="renderizarModalAutenticacao('login')">Voltar ao login</button>`;
}

async function verificarContaEmail(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("accountFeedback");
  const dados = Object.fromEntries(new FormData(form).entries());
  try {
    const r = await fetch(`${API_BASE}/api/auth/verificar-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sucesso) throw new Error(j.mensagem || "Código de verificação inválido.");
    iniciarSessaoConta(j.token, j.usuario);
    if (!executarAcaoProtegidaPendente()) renderizarPerfilConta();
  } catch (e) { if (feedback) feedback.textContent = e.message; }
}

async function reenviarCodigoEmail() {
  const body = document.getElementById("loginModalBody");
  const email = String(body?.dataset.pendingEmail || body?.querySelector('input[name="email"]')?.value || "").trim().toLowerCase();
  const feedback = document.getElementById("accountFeedback");
  if (!email) { if (feedback) feedback.textContent = "Informe o e-mail da conta."; return; }
  try {
    const r = await fetch(`${API_BASE}/api/auth/reenviar-codigo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sucesso) throw new Error(j.mensagem || "Não foi possível reenviar o código.");
    if (j.codigo_simulado) {
      let box = document.getElementById("accountDemoCode");
      if (!box) { box = document.createElement("div"); box.id = "accountDemoCode"; box.className = "account-demo-code"; body.querySelector(".account-modal-heading")?.after(box); }
      box.innerHTML = `<strong>Código local de demonstração:</strong> <code>${esc(j.codigo_simulado)}</code><p>Modo local de desenvolvimento; não use como configuração de produção.</p>`;
    }
    if (feedback) feedback.textContent = j.mensagem || "Se necessário, um novo código foi enviado.";
  } catch (e) { if (feedback) feedback.textContent = e.message; }
}

async function entrarConta(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("accountFeedback");
  const button = form.querySelector('button[type="submit"]');
  const dados = Object.fromEntries(new FormData(form).entries());
  if (button) { button.disabled = true; button.textContent = "Entrando…"; }
  try {
    const r = await fetch(`${API_BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sucesso) throw new Error(j.mensagem || "Não foi possível entrar.");
    iniciarSessaoConta(j.token, j.usuario);
    if (!executarAcaoProtegidaPendente()) renderizarPerfilConta();
  } catch (e) { if (feedback) feedback.textContent = e.message; if (button) { button.disabled = false; button.textContent = "Entrar"; } }
}

function renderizarRecuperacaoSenha(emailInicial) {
  const body = document.getElementById("loginModalBody");
  if (!body) return;
  if (emailInicial === undefined) emailInicial = body.dataset.pendingEmail || body.querySelector('input[name="email"]')?.value || "";
  body.dataset.pendingEmail = String(emailInicial).toLowerCase();
  body.innerHTML = `<div class="account-modal-heading"><span class="account-leaf">🔐</span><h2>Recuperar senha</h2><p>Envie um código de recuperação para o e-mail cadastrado. O código expira em 10 minutos.</p></div><form id="formSolicitarReset" class="account-form" onsubmit="solicitarRedefinicaoSenha(event)"><label>E-mail da conta<input type="email" name="email" autocomplete="email" value="${esc(emailInicial)}" maxlength="180" required></label><button type="submit" class="btn-account-primary">Enviar código de recuperação</button><p id="accountFeedback" role="status" class="account-feedback"></p></form><button type="button" class="account-link-button" onclick="renderizarModalAutenticacao('login')">Voltar ao login</button>`;
}

async function solicitarRedefinicaoSenha(event) {
  event.preventDefault();
  const form=event.currentTarget,feedback=document.getElementById("accountFeedback"),email=String(new FormData(form).get("email")||"").trim().toLowerCase();
  try {
    const r=await fetch(`${API_BASE}/api/auth/solicitar-redefinicao`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.sucesso)throw new Error(j.mensagem||"Não foi possível solicitar a recuperação.");
    const body=document.getElementById("loginModalBody");body.dataset.pendingEmail=email;
    const demo=j.codigo_simulado?`<div class="account-demo-code" id="accountResetDemo"><strong>Código local de demonstração:</strong> <code>${esc(j.codigo_simulado)}</code><p>Disponível apenas no modo local sem provedor de e-mail.</p></div>`:`<div class="account-email-instructions"><p>Se houver uma conta verificada para esse e-mail, as instruções chegarão à caixa de entrada.</p></div>`;
    body.innerHTML=`<div class="account-modal-heading"><span class="account-leaf">✉️</span><h2>Redefinir senha</h2><p>${esc(email)}</p></div>${demo}<form class="account-form" onsubmit="confirmarRedefinicaoSenha(event)"><input type="hidden" name="email" value="${esc(email)}"><label>Código de 6 dígitos<input name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label><label>Nova senha<input type="password" name="senha" autocomplete="new-password" minlength="10" maxlength="200" required></label><label>Confirme a nova senha<input type="password" name="confirmar_senha" autocomplete="new-password" minlength="10" maxlength="200" required></label><button type="submit" class="btn-account-primary">Salvar nova senha</button><p id="accountFeedback" role="status" class="account-feedback"></p></form><button type="button" class="account-link-button" onclick="renderizarRecuperacaoSenha()">Solicitar outro código</button>`;
  } catch(e) { if(feedback)feedback.textContent=e.message; }
}

async function confirmarRedefinicaoSenha(event) {
  event.preventDefault();const form=event.currentTarget,feedback=document.getElementById("accountFeedback"),data=Object.fromEntries(new FormData(form).entries());
  if(data.senha!==data.confirmar_senha){if(feedback)feedback.textContent="As senhas não são iguais.";return;}
  delete data.confirmar_senha;
  try {const r=await fetch(`${API_BASE}/api/auth/redefinir-senha`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json().catch(()=>({}));if(!r.ok||!j.sucesso)throw new Error(j.mensagem||"Não foi possível redefinir a senha.");renderizarModalAutenticacao("login",j.mensagem||"Senha redefinida.");}
  catch(e){if(feedback)feedback.textContent=e.message;}
}

function iniciarSessaoConta(token, dadosUsuario) {
  if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  usuario = dadosUsuario || null;
  localStorage.removeItem("usuario_lv");
  carregarCarrinhoDaConta();
  carregarCheckoutDaConta();
  atualizarHeaderUsuario();
  if (produtoModalAtualId && document.getElementById("productReviewFormContainer")) void carregarAvaliacoesProduto(produtoModalAtualId);
}

function renderizarPerfilConta() {
  const body = document.getElementById("loginModalBody");
  if (!body || !usuario) return renderizarModalAutenticacao("login");
  body.innerHTML = `
    <div class="account-profile"><div class="account-avatar"><i class="fa fa-user"></i></div><p class="eyebrow">MINHA CONTA</p><h2>Olá, ${esc(usuario.nome || "Cliente")}!</h2><p class="account-email">${esc(usuario.email || "")}</p><div class="account-profile-status"><i class="fa fa-shield-check"></i> E-mail verificado</div></div>
    <form class="account-form account-profile-form" onsubmit="salvarPerfilConta(event)">
      <h3>Dados pessoais</h3><label>Nome completo<input name="nome" autocomplete="name" minlength="2" maxlength="120" value="${esc(usuario.nome||"")}" required></label>
      <label>E-mail verificado<input type="email" value="${esc(usuario.email||"")}" disabled></label>
      <label>WhatsApp / telefone<input name="telefone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" value="${esc(usuario.telefone||"")}" placeholder="(91) 99999-9999"></label>
      <label class="account-check-label"><input type="checkbox" name="receber_novidades" ${usuario.receber_novidades ? "checked" : ""}> Receber novidades e promoções por e-mail.</label>
      <button type="submit" class="btn-account-primary">Salvar alterações</button><p id="profileFeedback" role="status" class="account-feedback"></p>
    </form>
    <section class="account-orders"><h3>Meus pedidos</h3><div id="accountOrdersList"><p class="account-muted">Carregando seus pedidos…</p></div></section>
    <p class="account-privacy-note">Você permanece conectado apenas nesta sessão. Ao recarregar o site, será necessário entrar novamente.</p>
    <div class="account-profile-actions"><button type="button" class="btn-account-primary" onclick="fecharModalLogin()">Continuar comprando</button><button type="button" class="btn-account-logout" onclick="sairDaConta()">Sair da conta</button></div>`;
  void carregarPedidosConta();
}

async function salvarPerfilConta(event) {
  event.preventDefault();const form=event.currentTarget,feedback=document.getElementById("profileFeedback"),data=Object.fromEntries(new FormData(form).entries());data.receber_novidades=form.elements.receber_novidades.checked;
  try {const r=await fetch(`${API_BASE}/api/auth/perfil`,{method:"PATCH",headers:{"Content-Type":"application/json",...tokenAuthHeaders()},body:JSON.stringify(data)});const j=await r.json().catch(()=>({}));if(!r.ok||!j.sucesso)throw new Error(j.mensagem||"Não foi possível salvar o perfil.");usuario=j.usuario;atualizarHeaderUsuario();renderizarPerfilConta();const fb=document.getElementById("profileFeedback");if(fb)fb.textContent="Perfil atualizado com sucesso.";}
  catch(e){if(feedback)feedback.textContent=e.message;}
}

async function carregarPedidosConta() {
  const box=document.getElementById("accountOrdersList");if(!box)return;
  try {const r=await fetch(`${API_BASE}/api/auth/pedidos`,{headers:{...tokenAuthHeaders()},cache:"no-store"});const j=await r.json().catch(()=>({}));if(!r.ok||!j.sucesso)throw new Error(j.mensagem||"Pedidos indisponíveis.");
    if(!j.pedidos?.length){box.innerHTML='<p class="account-muted">Você ainda não realizou pedidos nesta conta.</p>';return;}
    const labels={recebido:"Recebido",confirmado:"Confirmado",em_preparacao:"Em preparação",enviado:"Enviado",concluido:"Concluído",cancelado:"Cancelado"};
    box.innerHTML=j.pedidos.map(p=>`<article class="account-order-card"><div><strong>${esc(p.codigo)}</strong><span>${esc(labels[p.status]||p.status)}</span></div><p>${(p.itens||[]).map(i=>`${Number(i.quantidade)}× ${esc(i.nome)}`).join(" · ")}</p><small>${esc(p.criado_em||"")}</small><strong>${Number(p.total||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong></article>`).join("");
  } catch(e){box.innerHTML=`<p class="account-muted">${esc(e.message||"Não foi possível carregar seus pedidos.")}</p>`;}
}

async function sairDaConta() {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" }); }
    catch (e) { console.warn("A sessão local foi encerrada, mas o servidor não confirmou o logout.", e); }
  }
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem("usuario_lv");
  usuario = null;
  carrinho = [];
  checkoutDados = {};
  atualizarHeaderUsuario();
  atualizarContadorCarrinho();
  acaoProtegidaPendente = null;
  renderizarHome();
  renderizarModalAutenticacao("login", "Você saiu da sua conta.");
}

function tokenAuthHeaders() {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==========================================================================
// AVALIAÇÕES REAIS DO PRODUTO E DO PRODUTOR
// ==========================================================================
async function carregarAvaliacoesProduto(id) {
  try {
    const r = await fetch(`${API_BASE}/api/produtos/${Number(id)}/avaliacoes`, { cache: "no-store" });
    const data = await r.json();
    if (!r.ok || !data.sucesso) throw new Error(data.mensagem || "Avaliações indisponíveis.");
    const summary = data.resumo || {};
    const averageProduct = document.getElementById("reviewProductAverage");
    const averageProducer = document.getElementById("reviewProducerAverage");
    const count = document.getElementById("reviewCount");
    const social = document.getElementById("produtoSocialRating");
    if (averageProduct) averageProduct.textContent = summary.media_produto ? `${Number(summary.media_produto).toFixed(1).replace(".", ",")} / 5` : "Sem notas";
    if (averageProducer) averageProducer.textContent = summary.media_produtor ? `${Number(summary.media_produtor).toFixed(1).replace(".", ",")} / 5` : "Sem notas";
    if (count) count.textContent = `${Number(summary.total || 0)} avaliação(ões) deste produto · ${Number(summary.total_produtor || 0)} avaliação(ões) do produtor`;
    if (social) social.textContent = summary.total ? `⭐ ${Number(summary.media_produto).toFixed(1).replace(".", ",")} (${Number(summary.total)} avaliação(ões))` : "Ainda sem avaliações de clientes";
    const list = document.getElementById("productReviewsList");
    if (list) list.innerHTML = (data.avaliacoes || []).length ? data.avaliacoes.map(a => `<article class="product-review-card"><div class="review-card-top"><strong>${esc(a.autor || "Cliente")}</strong><span>${"★".repeat(Number(a.nota_produto))}${"☆".repeat(5-Number(a.nota_produto))} ${Number(a.nota_produto)}/5</span></div><p>${esc(a.comentario || "Sem comentário escrito.")}</p><div class="review-card-bottom"><span>Nota do produtor: ${Number(a.nota_produtor)}/5</span><time>${esc(new Date(String(a.criado_em || "").replace(" ", "T") + (String(a.criado_em || "").includes("Z") ? "" : "Z")).toLocaleDateString("pt-BR"))}</time></div></article>`).join("") : '<div class="reviews-empty"><span>🌱</span><strong>Este produto ainda não tem avaliações.</strong><p>Se você já tem uma conta, entre para registrar sua experiência e avaliar também o produtor.</p></div>';
    const formSlot = document.getElementById("productReviewFormContainer");
    if (formSlot) formSlot.innerHTML = usuario && sessionStorage.getItem(AUTH_TOKEN_KEY)
      ? `<form class="product-review-form" onsubmit="enviarAvaliacaoProduto(event, ${Number(id)})"><h4>Conte como foi sua experiência</h4><div class="review-form-grid"><label>Nota do produto<select name="nota_produto" required><option value="">Selecione…</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${n} — ${n===5?'Excelente':n===4?'Muito bom':n===3?'Regular':n===2?'Ruim':'Muito ruim'}</option>`).join("")}</select></label><label>Nota do produtor<select name="nota_produtor" required><option value="">Selecione…</option>${[5,4,3,2,1].map(n=>`<option value="${n}">${n} / 5</option>`).join("")}</select></label></div><label>Comentário (opcional)<textarea name="comentario" rows="3" maxlength="1000" placeholder="Qualidade, embalagem, atendimento…"></textarea></label><button type="submit" class="btn-account-primary">Enviar avaliação</button><p class="account-feedback" id="reviewSubmitFeedback" role="status"></p></form>`
      : `<div class="review-login-cta"><p>Entre na sua conta para avaliar o produto e o produtor.</p><button type="button" class="btn-outline-green" onclick="abrirModalOuPerfil()">Entrar para avaliar</button></div>`;
  } catch (e) {
    const list = document.getElementById("productReviewsList");
    if (list) list.innerHTML = `<p class="reviews-error">Não foi possível carregar as avaliações agora. ${esc(e.message)}</p>`;
  }
}

async function enviarAvaliacaoProduto(event, id) {
  event.preventDefault();
  const form = event.currentTarget;
  const feedback = document.getElementById("reviewSubmitFeedback");
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) { if (feedback) feedback.textContent = "Entre na sua conta antes de avaliar."; abrirModalOuPerfil(); return; }
  const dados = Object.fromEntries(new FormData(form).entries());
  dados.nota_produto = Number(dados.nota_produto); dados.nota_produtor = Number(dados.nota_produtor);
  try {
    const r = await fetch(`${API_BASE}/api/produtos/${Number(id)}/avaliacoes`, { method: "POST", headers: { "Content-Type": "application/json", ...tokenAuthHeaders() }, body: JSON.stringify(dados) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.sucesso) throw new Error(j.mensagem || "Não foi possível salvar sua avaliação.");
    await carregarAvaliacoesProduto(id);
    const newFeedback = document.getElementById("reviewSubmitFeedback"); if (newFeedback) newFeedback.textContent = "Sua avaliação foi registrada. Obrigado!";
  } catch (e) { if (feedback) feedback.textContent = e.message; }
}

// ==========================================================================
// NAVEGAÇÃO & UI
// ==========================================================================
function showPage(page) {
  if (page === "carrinho" && !exigirConta("visualizar seu carrinho", () => showPage("carrinho"))) return;
  if (page === "comerciantes" && !exigirConta("acessar Comerciantes & Grupo VIP", () => showPage("comerciantes"))) return;
  const content = document.getElementById("content");
  if (!content) {
    console.error("Não foi encontrado o elemento #content para exibir a página.");
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
  rastrearVisitaNoServidor(page);

  if (page === "home") {
    renderizarHome();
  } else if (page === "carrinho") {
    try {
      // Recarrega e higieniza itens legados/inválidos antes de desenhar a tela.
      if (!contaAutenticada()) return exigirConta("visualizar seu carrinho", () => showPage("carrinho"));
      carrinho = normalizarCarrinho(lerJSON(chaveCarrinhoConta(), carrinho));
      salvarCarrinhoDaConta();
      atualizarContadorCarrinho();
      renderizarCarrinho();
    } catch (error) {
      console.error("Erro ao renderizar o carrinho:", error);
      content.innerHTML = '<section style="padding:32px;background:#fff;border-radius:16px"><h2>Erro ao abrir o carrinho</h2><p>Ocorreu um erro ao carregar seus produtos. Recarregue a página e tente novamente.</p><button type="button" onclick="window.location.reload()">Recarregar</button></section>';
    }
  } else if (page === "favoritos") {
    renderizarFavoritos();
  } else if (page === "comerciantes") {
    renderizarComerciantes();
  } else if (page === "admin") {
    renderizarAdmin();
  } else if (page === "atendimento") {
    content.innerHTML = `<section style="max-width:760px;margin:40px auto;padding:28px;background:#fff;border-radius:20px"><h2>Central de Atendimento</h2><p>Fale com nossa equipe para consultar disponibilidade, entrega, cuidados com as plantas e andamento dos pedidos.</p><p><strong>WhatsApp:</strong> atendimento pelo botão verde da página.</p><button class="btn-hero-primary" onclick="showPage('home')">Voltar à loja</button></section>`;
  } else {
    renderizarHome();
  }

  // Move o foco para o conteúdo atualizado para tornar a navegação mais previsível.
  content.focus({ preventScroll: true });
}

function toggleNavOptions() {
  const extras = document.getElementById("navExtraOptions");
  const button = document.getElementById("btnToggleNavExtras");
  if (!extras || !button) return;
  const open = extras.hasAttribute("hidden");
  if (open) extras.removeAttribute("hidden"); else extras.setAttribute("hidden", "");
  button.setAttribute("aria-expanded", String(open));
  button.innerHTML = open ? 'Mais opções <i class="fa fa-chevron-up" aria-hidden="true"></i>' : 'Mais opções <i class="fa fa-chevron-down" aria-hidden="true"></i>';
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

  renderizarHome();
  rolarParaProdutos();
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

function copiarCupom(codigo) {
  cupomAplicado = codigo;
  localStorage.setItem("cupom_lv", codigo);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(codigo).catch(() => {});
  }
  showToast("toastCarrinho", `Cupom ${codigo} ativado! 10% de desconto 🎟️`);
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
  if (!contaAutenticada()) {
    badge.textContent = "";
    badge.style.display = "none";
    return;
  }
  const total = (Array.isArray(carrinho) ? carrinho : []).reduce((sum, item) => {
    const quantidade = Number(item?.qtd);
    return sum + (Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 1);
  }, 0);
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
  if (usuario && usuario.nome) {
    label.textContent = usuario.nome.split(" ")[0];
    const btn = document.getElementById("btnPerfilHeader");
    if (btn) btn.title = `Minha conta — ${usuario.nome}`;
  } else {
    label.textContent = "Entrar";
    const btn = document.getElementById("btnPerfilHeader");
    if (btn) btn.title = "Entrar ou criar conta";
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
        <button type="button" class="btn-card-adicionar" onclick="event.stopPropagation(); adicionarAoCarrinho(${p.id})">
          <i class="fa fa-shopping-cart"></i> Adicionar
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

  content.innerHTML = heroHTML + pilaresHTML + categoriasPastelHTML + finadosHTML + gradeCompletaHTML + bannerAssinaturaHTML;
}

// ==========================================================================
// CARRINHO & CHECKOUT DENTRO DO SITE
// ==========================================================================
// ========================================================================
// CARRINHO & CHECKOUT DENTRO DO SITE
// ========================================================================
function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function capturarCheckoutDados() {
  const val = id => document.getElementById(id)?.value ?? "";
  checkoutDados = {
    nome: val("checkoutNome"), email: val("checkoutEmail"), telefone: val("checkoutTelefone"),
    cep: val("checkoutCep"), endereco: val("checkoutEndereco"), bairro: val("checkoutBairro"),
    cidade: val("checkoutCidade"), uf: val("checkoutUf"), mensagem: val("inputMsgCartao"),
    dataEntrega: val("inputDataEntrega")
  };
  salvarCheckoutDaConta();
  return checkoutDados;
}

function salvarDadosCheckout() {
  capturarCheckoutDados();
}

function adicionarAoCarrinho(id, opcoes = {}) {
  if (!exigirConta("adicionar produtos ao carrinho", () => adicionarAoCarrinho(id, opcoes))) return false;
  carrinho = normalizarCarrinho(carrinho);
  const p = produtos.find(item => Number(item.id) === Number(id));
  if (!p) return false;
  if (Number(p.estoque) <= 0) { showToast("toastCarrinho", "Este produto está sem estoque no momento."); return false; }
  const condicoesValidas = new Set(["padrao", "agendada", "retirada"]);
  const condicaoEntrega = condicoesValidas.has(String(opcoes.condicaoEntrega || "")) ? String(opcoes.condicaoEntrega) : "padrao";
  const observacao = String(opcoes.observacao || "").trim().slice(0, 500);
  const existente = carrinho.find(item => Number(item.id) === Number(id) && item.condicaoEntrega === condicaoEntrega && item.observacao === observacao);
  if (existente) {
    if (existente.qtd >= Math.min(99, Number(p.estoque) || 99)) { showToast("toastCarrinho", "Você já atingiu o limite disponível deste produto."); return false; }
    existente.qtd = Math.min(99, existente.qtd + 1);
  } else {
    carrinho.push({ ...p, qtd: 1, condicaoEntrega, observacao, lineKey: gerarChaveLinhaCarrinho() });
  }
  salvarCarrinhoDaConta();
  atualizarContadorCarrinho();
  showToast("toastCarrinho", `"${p.nome}" adicionado ao carrinho! 🛒`);
  return true;
}

function adicionarProdutoDetalhe(id, comprarAgora = false) {
  if (!exigirConta("adicionar produtos ao carrinho", () => adicionarProdutoDetalhe(id, comprarAgora))) return false;
  const condicaoEntrega = document.getElementById("productDeliveryCondition")?.value || "padrao";
  const observacao = document.getElementById("productOrderNotes")?.value || "";
  const adicionado = adicionarAoCarrinho(id, { condicaoEntrega, observacao });
  if (!adicionado) return false;
  if (comprarAgora) { fecharModal(); showPage("carrinho"); }
  return true;
}
function alterarQtdCarrinho(chave, delta) {
  if (!exigirConta("alterar seu carrinho", () => showPage("carrinho"))) return;
  capturarCheckoutDados();
  carrinho = normalizarCarrinho(carrinho);
  const item = carrinho.find(i => String(i.lineKey) === String(chave)) || carrinho.find(i => Number(i.id) === Number(chave));
  if (!item) return;
  const produto = produtos.find(p => Number(p.id) === Number(item.id));
  const max = Math.max(0, Math.min(99, Number(produto?.estoque ?? 99)));
  item.qtd = Math.max(0, Math.min(max, (Number(item.qtd) || 1) + Number(delta || 0)));
  if (item.qtd <= 0) carrinho = carrinho.filter(i => i.lineKey !== item.lineKey);
  salvarCarrinhoDaConta();
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

function removerItemCarrinho(chave) {
  if (!exigirConta("alterar seu carrinho", () => showPage("carrinho"))) return;
  capturarCheckoutDados();
  carrinho = normalizarCarrinho(carrinho);
  const item = carrinho.find(i => String(i.lineKey) === String(chave));
  carrinho = item ? carrinho.filter(i => i.lineKey !== item.lineKey) : carrinho.filter(i => Number(i.id) !== Number(chave));
  salvarCarrinhoDaConta();
  atualizarContadorCarrinho();
  renderizarCarrinho();
}

function condicaoEntregaLabel(condicao) {
  return ({ padrao: "Entrega padrão", agendada: "Entrega agendada", retirada: "Retirada combinada" })[condicao] || "Entrega padrão";
}
function renderizarCarrinho() {
  if (!exigirConta("visualizar seu carrinho", () => showPage("carrinho"))) return;
  const content = document.getElementById("content");
  if (!content) return;
  carrinho = normalizarCarrinho(carrinho);
  salvarCarrinhoDaConta();

  if (carrinho.length === 0) {
    content.innerHTML = `
      <section class="cart-empty-state">
        <span class="cart-empty-icon" aria-hidden="true">🛒</span>
        <h2>Seu carrinho está vazio</h2>
        <p>Encontre mudas, hortaliças e plantas para levar mais verde para sua casa.</p>
        <button type="button" class="btn-hero-primary" onclick="showPage('home')">Explorar produtos</button>
      </section>`;
    return;
  }

  const subtotal = carrinho.reduce((sum, item) => sum + (Number(item.preco) * (Number(item.qtd) || 1)), 0);
  const limiteBruto = Number(configLoja.frete_gratis_acima);
  const limiteFrete = Number.isFinite(limiteBruto) ? Math.max(0, limiteBruto) : 99;
  const freteFixo = Math.max(0, Number(configLoja.frete_valor) || 0);
  const descontoCupomConfigurado = Number(configLoja.desconto_cupom);
  const descontoPercentual = Number.isFinite(descontoCupomConfigurado) ? Math.max(0, Math.min(80, descontoCupomConfigurado)) : 10;
  const temCupom = String(cupomAplicado || "").toUpperCase() === "VERDE10";
  const descontoCupom = temCupom ? subtotal * descontoPercentual / 100 : 0;
  const descontoPix = metodoPagamentoAtivo === "pix" ? (subtotal - descontoCupom) * 0.05 : 0;
  const retiradaIntegral = carrinho.every(item => item.condicaoEntrega === "retirada");
  const frete = retiradaIntegral || subtotal >= limiteFrete ? 0 : freteFixo;
  const total = Math.max(0, subtotal - descontoCupom - descontoPix + frete);
  const reais = n => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const d = checkoutDados || {};
  const val = name => esc(d[name] || "");

  const itensHTML = carrinho.map(item => `
    <article class="carrinho-item">
      <img src="${esc(item.imagem)}" alt="${esc(item.nome)}" class="carrinho-img" loading="lazy">
      <div class="carrinho-detalhes"><strong>${esc(item.nome)}</strong><p>${formatarMoeda(item.preco)} por unidade</p><small class="cart-item-delivery">${esc(condicaoEntregaLabel(item.condicaoEntrega))}</small>${item.observacao ? `<small class="cart-item-note">Obs.: ${esc(item.observacao)}</small>` : ""}</div>
      <div class="carrinho-acoes">
        <div class="carrinho-qtd-ctrl" aria-label="Quantidade de ${esc(item.nome)}">
          <button type="button" aria-label="Diminuir quantidade" onclick="alterarQtdCarrinho('${esc(item.lineKey)}', -1)">−</button>
          <span>${item.qtd || 1}</span>
          <button type="button" aria-label="Aumentar quantidade" onclick="alterarQtdCarrinho('${esc(item.lineKey)}', 1)">+</button>
        </div>
        <strong class="carrinho-subtotal">${formatarMoeda(item.preco * (item.qtd || 1))}</strong>
        <button type="button" class="remove-btn" onclick="removerItemCarrinho('${esc(item.lineKey)}')" title="Remover ${esc(item.nome)}" aria-label="Remover ${esc(item.nome)}"><i class="fa fa-trash" aria-hidden="true"></i></button>
      </div>
    </article>`).join("");

  content.innerHTML = `
    <div class="cart-page-heading"><div><p class="eyebrow">SUA SELEÇÃO</p><h2>Carrinho de compras <span aria-hidden="true">🛒</span></h2><p>Revise os produtos e complete os dados de entrega.</p></div><button class="btn-outline-green" type="button" onclick="showPage('home')">Continuar comprando</button></div>
    <div class="carrinho-page-wrap">
      <section class="carrinho-items-col" aria-label="Itens do carrinho">
        <div class="barra-frete-gratis"><p>${retiradaIntegral ? '📦 Todos os itens estão marcados para retirada; sem cobrança de frete.' : subtotal >= limiteFrete ? '🎉 Você garantiu frete grátis!' : `Faltam ${formatarMoeda(Math.max(0, limiteFrete - subtotal))} para o frete grátis.`}</p><div class="frete-progresso-fundo"><div class="frete-progresso-preenchimento" style="width:${limiteFrete ? Math.min((subtotal / limiteFrete) * 100, 100) : 100}%;"></div></div></div>
        ${itensHTML}
      </section>
      <aside class="carrinho-summary-col">
        <h3>Resumo do pedido</h3>
        <div class="carrinho-cupom-box"><input type="text" id="inputCupomCarrinho" aria-label="Cupom de desconto" placeholder="Código do cupom" value="${temCupom ? 'VERDE10' : ''}"><button type="button" class="btn-aplicar-cupom" onclick="aplicarCupomInput()">Aplicar</button></div>
        <div class="cart-price-lines">
          <div><span>Subtotal</span><span>${formatarMoeda(subtotal)}</span></div>
          ${descontoCupom > 0 ? `<div class="price-discount"><span>Cupom (${reais(descontoPercentual)}%)</span><span>− ${formatarMoeda(descontoCupom)}</span></div>` : ''}
          ${descontoPix > 0 ? `<div class="price-discount"><span>Desconto Pix (5%)</span><span>− ${formatarMoeda(descontoPix)}</span></div>` : ''}
          <div><span>Frete</span><span>${frete === 0 ? 'Grátis' : formatarMoeda(frete)}</span></div>
          <div class="cart-total-line"><strong>Total estimado</strong><strong>${formatarMoeda(total)}</strong></div>
        </div>
        <p class="checkout-transparency"><i class="fa fa-info-circle" aria-hidden="true"></i> O pedido será registrado no site. Nesta versão de demonstração, o pagamento não é cobrado automaticamente; a equipe confirmará as instruções de pagamento.</p>
        <form id="formCheckoutPedido" class="checkout-form">
          <h4><i class="fa fa-truck" aria-hidden="true"></i> Dados para entrega</h4>
          <label for="checkoutNome">Nome completo *</label><input id="checkoutNome" name="nome" autocomplete="name" value="${val('nome')}" minlength="2" maxlength="120" required>
          <div class="checkout-two-cols"><div><label for="checkoutEmail">E-mail *</label><input type="email" id="checkoutEmail" name="email" autocomplete="email" value="${val('email')}" required></div><div><label for="checkoutTelefone">Telefone/WhatsApp *</label><input type="tel" id="checkoutTelefone" name="telefone" autocomplete="tel" value="${val('telefone')}" minlength="10" required></div></div>
          <div class="checkout-two-cols"><div><label for="checkoutCep">CEP *</label><div class="checkout-cep-row"><input id="checkoutCep" name="cep" autocomplete="postal-code" inputmode="numeric" placeholder="00000-000" value="${val('cep')}" pattern="[0-9]{5}-?[0-9]{3}" required><button type="button" class="btn-cep-lookup" onclick="consultarCep()">Buscar</button></div><small id="checkoutCepStatus" role="status"></small></div><div><label for="checkoutUf">UF *</label><input id="checkoutUf" name="uf" autocomplete="address-level1" maxlength="2" placeholder="PA" value="${val('uf')}" required></div></div>
          <label for="checkoutEndereco">Rua, número e complemento *</label><input id="checkoutEndereco" name="endereco" autocomplete="street-address" value="${val('endereco')}" minlength="5" maxlength="200" required>
          <div class="checkout-two-cols"><div><label for="checkoutBairro">Bairro *</label><input id="checkoutBairro" name="bairro" value="${val('bairro')}" minlength="2" required></div><div><label for="checkoutCidade">Cidade *</label><input id="checkoutCidade" name="cidade" autocomplete="address-level2" value="${val('cidade')}" minlength="2" required></div></div>
          <h4><i class="fa fa-credit-card" aria-hidden="true"></i> Preferência de pagamento</h4>
          <div class="payment-method-selector" role="group" aria-label="Preferência de pagamento">
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo==='pix'?'active':''}" aria-pressed="${metodoPagamentoAtivo==='pix'}" onclick="setMetodoPagamento('pix')">Pix (5% OFF)</button>
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo==='cartao'?'active':''}" aria-pressed="${metodoPagamentoAtivo==='cartao'}" onclick="setMetodoPagamento('cartao')">Cartão (3x)</button>
            <button type="button" class="metodo-btn ${metodoPagamentoAtivo==='boleto'?'active':''}" aria-pressed="${metodoPagamentoAtivo==='boleto'}" onclick="setMetodoPagamento('boleto')">Boleto</button>
          </div>
          <label for="inputMsgCartao">Mensagem para cartão presente (opcional)</label><textarea id="inputMsgCartao" rows="2" maxlength="500" placeholder="Ex.: Com carinho, para a sua horta!">${val('mensagem')}</textarea>
          <label for="inputDataEntrega">Data preferida de entrega (opcional)</label><input type="date" id="inputDataEntrega" value="${val('dataEntrega')}" min="${new Date().toISOString().slice(0,10)}">
          <button type="button" id="btnConfirmarPedido" class="btn-place-order" onclick="finalizarPedido()"><i class="fa fa-check-circle" aria-hidden="true"></i> Confirmar pedido na loja</button>
          <p class="checkout-secure-note"><i class="fa fa-lock" aria-hidden="true"></i> Seus dados são enviados ao servidor da loja para registrar o pedido.</p>
        </form>
      </aside>
    </div>`;
  const form = document.getElementById("formCheckoutPedido");
  if (form) { form.addEventListener("input", salvarDadosCheckout); form.addEventListener("change", salvarDadosCheckout); }
}

function aplicarCupomInput() {
  const input = document.getElementById("inputCupomCarrinho");
  if (!input) return;
  const codigo = input.value.trim().toUpperCase();
  if (codigo === "VERDE10") {
    capturarCheckoutDados();
    cupomAplicado = codigo;
    localStorage.setItem("cupom_lv", codigo);
    showToast("toastCarrinho", `Cupom ${codigo} ativado!`);
    renderizarCarrinho();
  } else {
    cupomAplicado = null;
    localStorage.removeItem("cupom_lv");
    alert("Cupom indisponível. Nesta versão, o código válido para checkout é VERDE10.");
    capturarCheckoutDados();
    renderizarCarrinho();
  }
}

function setMetodoPagamento(metodo) {
  capturarCheckoutDados();
  if (!["pix", "cartao", "boleto"].includes(metodo)) return;
  metodoPagamentoAtivo = metodo;
  renderizarCarrinho();
}

async function consultarCep() {
  const campo = document.getElementById("checkoutCep");
  const status = document.getElementById("checkoutCepStatus");
  const botao = document.querySelector(".btn-cep-lookup");
  const cep = String(campo?.value || "").replace(/\D/g, "");
  if (cep.length !== 8) { if (status) status.textContent = "Digite um CEP com 8 números."; campo?.focus(); return; }
  if (botao) { botao.disabled = true; botao.textContent = "Buscando…"; }
  if (status) status.textContent = "Consultando CEP…";
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { headers: { Accept: "application/json" } });
    if (!resposta.ok) throw new Error("Serviço de CEP indisponível.");
    const endereco = await resposta.json();
    if (endereco.erro) throw new Error("CEP não encontrado. Confira os números ou preencha o endereço manualmente.");
    const preencher = (id, valor) => { const el = document.getElementById(id); if (el && valor) { el.value = valor; el.dispatchEvent(new Event("input", { bubbles: true })); } };
    preencher("checkoutEndereco", [endereco.logradouro, endereco.complemento].filter(Boolean).join(", "));
    preencher("checkoutBairro", endereco.bairro);
    preencher("checkoutCidade", endereco.localidade);
    preencher("checkoutUf", endereco.uf);
    if (status) status.textContent = "Endereço localizado. Complete rua/número e confira os dados.";
    const enderecoCampo = document.getElementById("checkoutEndereco"); if (enderecoCampo && !enderecoCampo.value) enderecoCampo.focus();
    salvarDadosCheckout();
  } catch (erro) {
    if (status) status.textContent = erro.message || "Não foi possível consultar o CEP. Preencha o endereço manualmente.";
  } finally {
    if (botao) { botao.disabled = false; botao.textContent = "Buscar"; }
  }
}

async function finalizarPedido() {
  if (!exigirConta("finalizar uma compra", () => showPage("carrinho"))) return;
  if (!Array.isArray(carrinho) || !carrinho.length) return;
  const form = document.getElementById("formCheckoutPedido");
  if (form && !form.reportValidity()) return;
  const dados = capturarCheckoutDados();
  const cliente = {
    nome: dados.nome, email: dados.email, telefone: dados.telefone, cep: dados.cep,
    endereco: dados.endereco, bairro: dados.bairro, cidade: dados.cidade, uf: dados.uf
  };
  const itens = carrinho.map(item => ({ produto_id: Number(item.id), quantidade: Math.max(1, Math.min(99, Number(item.qtd) || 1)), condicao_entrega: item.condicaoEntrega || "padrao", observacao: String(item.observacao || "").slice(0, 500) }));
  const botao = document.getElementById("btnConfirmarPedido");
  if (botao) { botao.disabled = true; botao.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i> Registrando pedido…'; }
  try {
    const resposta = await fetch(`${API_BASE}/api/pedidos`, {
      method: "POST", headers: { "Content-Type": "application/json", ...tokenAuthHeaders() },
      body: JSON.stringify({ itens, cliente, metodo_pagamento: metodoPagamentoAtivo, data_entrega: dados.dataEntrega || "", mensagem_cartao: dados.mensagem || "", cupom: cupomAplicado || "" })
    });
    const resultado = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !resultado.sucesso || !resultado.pedido) throw new Error(resultado.mensagem || "Não foi possível registrar o pedido. Tente novamente.");
    carrinho = [];
    salvarCarrinhoDaConta();
    atualizarContadorCarrinho();
    cupomAplicado = null;
    localStorage.removeItem("cupom_lv");
    checkoutDados = {};
    const checkoutKey = chaveCheckoutConta();
    if (checkoutKey) localStorage.removeItem(checkoutKey);
    await carregarProdutosDoServidor();
    renderizarPedidoConfirmado(resultado.pedido);
  } catch (erro) {
    alert(`O pedido não foi registrado: ${erro.message}`);
    if (botao) { botao.disabled = false; botao.innerHTML = '<i class="fa fa-check-circle" aria-hidden="true"></i> Confirmar pedido na loja'; }
  }
}

function renderizarPedidoConfirmado(pedido) {
  const content = document.getElementById("content");
  if (!content) return;
  const reais = n => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const itens = (pedido.itens || []).map(item => `<div class="confirmation-item confirmation-item-delivery"><span>${Number(item.quantidade)}× ${esc(item.nome)}<small>${esc(condicaoEntregaLabel(item.condicao_entrega || "padrao"))}${item.observacao ? ` · Obs.: ${esc(item.observacao)}` : ""}</small></span><strong>${reais(Number(item.preco) * Number(item.quantidade))}</strong></div>`).join("");
  const data = pedido.cliente || {};
  content.innerHTML = `
    <section class="order-confirmation">
      <div class="confirmation-icon"><i class="fa fa-check" aria-hidden="true"></i></div>
      <p class="eyebrow">LOJA VERDE</p><h2>Pedido registrado com sucesso!</h2>
      <p>Obrigado${data.nome ? `, ${esc(data.nome.split(' ')[0])}` : ''}! Seu pedido foi salvo no sistema da loja.</p>
      <div class="order-code-box"><span>Número do pedido</span><strong>${esc(pedido.codigo)}</strong><button type="button" class="btn-outline-green" onclick="navigator.clipboard?.writeText('${esc(pedido.codigo)}').then(()=>showToast('toastCarrinho','Código copiado!')).catch(()=>alert('Código do pedido: ${esc(pedido.codigo)}'))">Copiar código</button></div>
      <div class="confirmation-details"><h3>Resumo</h3>${itens}<div class="confirmation-item"><span>Subtotal</span><span>${reais(pedido.subtotal)}</span></div><div class="confirmation-item"><span>Desconto</span><span>− ${reais(pedido.desconto)}</span></div><div class="confirmation-item"><span>Frete</span><span>${Number(pedido.frete)===0?'Grátis':reais(pedido.frete)}</span></div><div class="confirmation-item confirmation-total"><strong>Total do pedido</strong><strong>${reais(pedido.total)}</strong></div></div>
      <div class="confirmation-warning"><strong>Próximo passo</strong><p>Forma de pagamento selecionada: ${esc(String(pedido.metodo_pagamento||'').toUpperCase())}. Nenhuma cobrança foi feita automaticamente nesta versão de demonstração. Guarde o código acima para consultar o pedido com a equipe da loja.</p></div>
      <div class="confirmation-actions"><button type="button" class="btn-place-order" onclick="showPage('home')">Continuar comprando</button><button type="button" class="btn-outline-green" onclick="window.print()">Imprimir resumo</button></div>
    </section>`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================================================
// MODAL DE DETALHES DO PRODUTO
// ==========================================================================
function abrirModalProduto(id) {
  const p = produtos.find(item => Number(item.id) === Number(id));
  if (!p) return;
  produtoModalAtualId = Number(p.id);

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
          <span id="produtoSocialRating">Carregando avaliações de clientes…</span> •
          <span style="color: var(--sucesso); font-weight: 700;">Garantia Planta Viva</span>
        </div>
        <p class="product-producer-name"><i class="fa fa-seedling" aria-hidden="true"></i> Produtor: <strong>${esc(p.vendedor || "Produtor independente")}</strong></p>

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

        <div class="product-order-options">
          <label for="productDeliveryCondition">Condição da entrega</label>
          <select id="productDeliveryCondition">
            <option value="padrao">Entrega padrão</option>
            <option value="agendada">Entrega agendada (escolha a data no carrinho)</option>
            <option value="retirada">Retirada combinada — sem frete</option>
          </select>
          <label for="productOrderNotes">Observações para este produto</label>
          <textarea id="productOrderNotes" rows="2" maxlength="500" placeholder="Ex.: entregar após as 16h, embalagem para presente…"></textarea>
          <small>Se todos os itens forem para retirada, o frete fica zerado. A disponibilidade será confirmada pela loja.</small>
        </div>

        <div class="product-ctas-stack">
          <button type="button" class="btn-buy-now" onclick="adicionarProdutoDetalhe(${p.id}, true)">Comprar Agora</button>
          <button type="button" class="btn-add-cart-outline" onclick="adicionarProdutoDetalhe(${p.id}, false)">
            <i class="fa fa-cart-plus"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
    <section class="product-reviews-section" aria-labelledby="productReviewsHeading">
      <div class="reviews-header"><div><h3 id="productReviewsHeading">Avaliações de clientes</h3><p id="reviewCount">Carregando avaliações registradas pela loja…</p></div>
        <div class="review-stats"><div><small>Nota do produto</small><strong id="reviewProductAverage">—</strong></div><div><small>Nota do produtor</small><strong id="reviewProducerAverage">—</strong><small>Somada entre produtos do mesmo fornecedor</small></div></div>
      </div>
      <div id="productReviewsList" class="product-reviews-list"><div class="reviews-empty">Carregando avaliações…</div></div>
      <div id="productReviewFormContainer"></div>
    </section>
  `;

  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  carregarAvaliacoesProduto(p.id);
}

function fecharModal() {
  const modal = document.getElementById("modalProduto");
  if (modal) modal.classList.add("hidden");
  sincronizarTravaScrollModal();
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
  sincronizarTravaScrollModal();
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
    sincronizarTravaScrollModal();
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
    sincronizarTravaScrollModal();
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
    sincronizarTravaScrollModal();
  }
}

function renderizarComerciantes() {
  if (!exigirConta("acessar Comerciantes & Grupo VIP", () => showPage("comerciantes"))) return;
  const content = document.getElementById("content");
  if (!content) return;
  const emailConta = esc(usuario?.email || "");
  const nomeConta = esc(usuario?.nome || "cliente");

  content.innerHTML = `<section class="merchant-vip-page">
    <header class="merchant-hero">
      <div class="merchant-hero-copy">
        <div class="merchant-kicker"><span class="merchant-kicker-dot"></span> PARCERIAS &amp; BENEFÍCIOS <span class="merchant-kicker-divider">/</span> ÁREA EXCLUSIVA</div>
        <h2>Seu negócio também pode <span>florescer.</span></h2>
        <p>Conectamos a Loja Verde a floriculturas, restaurantes, revendedores e empresas que querem levar mais vida aos seus espaços e clientes.</p>
        <div class="merchant-hero-actions">
          <a href="#merchantApplication" class="merchant-primary-link">Quero ser parceiro <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          <span class="merchant-hero-note"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Solicitação vinculada à sua conta</span>
        </div>
      </div>
      <div class="merchant-hero-art" aria-hidden="true">
        <div class="merchant-art-glow"></div>
        <div class="merchant-art-orbit"></div>
        <div class="merchant-art-plant">🌿</div>
        <div class="merchant-art-card merchant-art-card-top"><span class="merchant-art-icon"><i class="fa-solid fa-seedling"></i></span><span><strong>Boas parcerias</strong><small>cultivadas juntas</small></span></div>
        <div class="merchant-art-card merchant-art-card-bottom"><span class="merchant-art-star">✦</span><span><strong>Conexões que crescem</strong><small>um passo de cada vez</small></span></div>
      </div>
      <div class="merchant-hero-bottom">
        <span><i class="fa-solid fa-leaf" aria-hidden="true"></i> Plantas e soluções naturais</span>
        <span><i class="fa-solid fa-handshake" aria-hidden="true"></i> Relacionamento comercial</span>
        <span><i class="fa-solid fa-tags" aria-hidden="true"></i> Ofertas para parceiros</span>
      </div>
    </header>

    <div class="merchant-account-banner">
      <div class="merchant-account-avatar"><i class="fa-solid fa-user-check" aria-hidden="true"></i></div>
      <div class="merchant-account-copy"><strong>Olá, ${nomeConta}!</strong><span>Sua conta está conectada. Use o formulário para apresentar seu negócio.</span></div>
      <div class="merchant-account-email"><span><i class="fa-solid fa-circle-check" aria-hidden="true"></i> CONTA CONECTADA</span><strong>${emailConta}</strong></div>
    </div>

    <section class="merchant-benefits-section" aria-labelledby="merchantBenefitsTitle">
      <div class="merchant-section-heading"><div><p class="merchant-overline">PARA CRESCER EM CONJUNTO</p><h3 id="merchantBenefitsTitle">Uma parceria com raízes fortes</h3></div><p>Uma área criada para facilitar o contato comercial e reunir informações úteis para quem compra ou trabalha com plantas.</p></div>
      <div class="merchant-benefits-grid">
        <article class="merchant-benefit-card"><span class="merchant-benefit-icon"><i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i></span><h4>Compras em volume</h4><p>Envie sua solicitação para avaliarmos as necessidades do seu negócio e as condições comerciais adequadas.</p></article>
        <article class="merchant-benefit-card"><span class="merchant-benefit-icon merchant-icon-sand"><i class="fa-solid fa-tags" aria-hidden="true"></i></span><h4>Ofertas para parceiros</h4><p>Consulte nesta página as campanhas e os cupons disponíveis para parceiros aprovados.</p></article>
        <article class="merchant-benefit-card"><span class="merchant-benefit-icon merchant-icon-lilac"><i class="fa-solid fa-comments" aria-hidden="true"></i></span><h4>Contato mais direto</h4><p>Centralize os dados do seu negócio para que a equipe possa analisar e retornar sua solicitação.</p></article>
        <article class="merchant-benefit-card"><span class="merchant-benefit-icon merchant-icon-peach"><i class="fa-solid fa-people-group" aria-hidden="true"></i></span><h4>Comunidade VIP</h4><p>O acesso a benefícios e grupos exclusivos depende da análise e aprovação da parceria.</p></article>
      </div>
    </section>

    <section class="merchant-workspace-grid" aria-label="Solicitação de parceria e informações VIP">
      <div class="merchant-application-card" id="merchantApplication">
        <div class="merchant-card-heading"><div class="merchant-heading-icon"><i class="fa-solid fa-file-signature" aria-hidden="true"></i></div><div><p class="merchant-overline">VAMOS CONVERSAR</p><h3>Apresente seu negócio</h3><p>Preencha os dados abaixo. Os campos marcados são obrigatórios.</p></div></div>
        <form id="formComercianteLoja" class="merchant-application-form">
          <label class="merchant-field merchant-field-wide">Nome do negócio <span>*</span><input name="nome_negocio" autocomplete="organization" required minlength="2" maxlength="120" placeholder="Ex.: Floricultura Jardim Vivo"></label>
          <label class="merchant-field">Nome do contato <span>*</span><input name="contato_nome" value="${nomeConta}" autocomplete="name" required minlength="2" maxlength="120" placeholder="Quem devemos procurar?"></label>
          <label class="merchant-field">WhatsApp comercial <span>*</span><input name="whatsapp" type="tel" autocomplete="tel" required minlength="10" maxlength="24" placeholder="(91) 99999-9999"></label>
          <label class="merchant-field merchant-field-wide">E-mail da conta verificada <span class="merchant-field-verified"><i class="fa-solid fa-lock" aria-hidden="true"></i> vinculado</span><input name="email" type="email" value="${emailConta}" autocomplete="email" readonly required></label>
          <label class="merchant-field">CNPJ/CPF <small>Opcional</small><input name="cnpj_cpf" maxlength="30" autocomplete="off" placeholder="Documento do negócio"></label>
          <label class="merchant-field">Tipo de negócio <span>*</span><select name="tipo_negocio" required><option value="Floricultura">Floricultura</option><option value="Restaurante">Restaurante</option><option value="Condomínio">Condomínio</option><option value="Escritório">Escritório</option><option value="Revendedor">Revendedor</option><option value="Paisagismo">Paisagismo</option><option value="Outro">Outro</option></select></label>
          <button class="merchant-submit-btn" type="submit"><span>Enviar solicitação de parceria</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
        </form>
        <p class="merchant-form-privacy"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Seus dados serão usados para analisar e responder à solicitação comercial.</p>
        <div id="resultadoComerciante" class="merchant-form-result" role="status" aria-live="polite"></div>
      </div>

      <aside class="merchant-side-column">
        <div class="merchant-vip-card">
          <div class="merchant-vip-card-top"><span class="merchant-vip-emblem"><i class="fa-solid fa-leaf" aria-hidden="true"></i></span><span class="merchant-vip-label">LOJA VERDE <b>•</b> VIP</span></div>
          <p class="merchant-overline">CRESCER É MELHOR EM CONJUNTO</p>
          <h3>Um espaço para cultivar novas oportunidades.</h3>
          <p class="merchant-vip-description">Cadastre seu negócio para que a equipe possa conhecer seu perfil e avaliar os próximos passos da parceria.</p>
          <div class="merchant-vip-status"><i class="fa-regular fa-clock" aria-hidden="true"></i><span><strong>Próxima etapa</strong><small>Análise da solicitação pela equipe</small></span></div>
          <div class="merchant-vip-disclaimer">O envio do formulário não garante aprovação nem acesso automático a grupos exclusivos.</div>
        </div>
        <div class="merchant-steps-card">
          <div class="merchant-steps-title"><i class="fa-solid fa-route" aria-hidden="true"></i><h3>Como funciona</h3></div>
          <div class="merchant-step"><span>01</span><div><strong>Conte sobre seu negócio</strong><p>Envie seus dados de contato e segmento.</p></div></div>
          <div class="merchant-step"><span>02</span><div><strong>Aguarde a análise</strong><p>A equipe avalia as informações enviadas.</p></div></div>
          <div class="merchant-step"><span>03</span><div><strong>Confira os benefícios</strong><p>Veja as promoções disponíveis nesta área.</p></div></div>
        </div>
      </aside>
    </section>

    <section class="merchant-promotions-section" aria-labelledby="merchantPromotionsTitle">
      <div class="merchant-section-heading merchant-promotions-heading"><div><p class="merchant-overline">CONDIÇÕES ESPECIAIS</p><h3 id="merchantPromotionsTitle">Promoções para parceiros</h3></div><div class="merchant-live-label"><span></span> Atualizado pela loja</div></div>
      <div id="lista-promocoes-b2b" class="merchant-promotions-grid" aria-live="polite"><div class="merchant-promos-loading"><i class="fa-solid fa-seedling" aria-hidden="true"></i><span>Carregando promoções disponíveis…</span></div></div>
    </section>
  </section>`;

  const form = document.getElementById("formComercianteLoja");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!exigirConta("enviar uma solicitação de parceria", () => showPage("comerciantes"))) return;
    const dados = Object.fromEntries(new FormData(form).entries());
    const out = document.getElementById("resultadoComerciante");
    const submit = form.querySelector('button[type="submit"]');
    if (submit) { submit.disabled = true; submit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Enviando solicitação…</span>'; }
    try {
      const r = await fetch(`${API_BASE}/api/comerciantes/cadastro`, {method:"POST",headers:{"Content-Type":"application/json",...tokenAuthHeaders()},body:JSON.stringify(dados)});
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.sucesso) throw new Error(j.mensagem || "Não foi possível enviar a solicitação.");
      out.classList.add("is-success");
      out.textContent = j.mensagem + (j.cupom_gerado ? ` Cupom: ${j.cupom_gerado}` : "");
      form.reset();
      const email = form.elements.email; if (email) email.value = usuario.email;
      const nome = form.elements.contato_nome; if (nome) nome.value = usuario.nome || "";
    } catch (error) {
      out.classList.remove("is-success");
      out.textContent = error.message || "Não foi possível enviar. Confira se o servidor está ativo.";
      if (error.message && /sessão|login|autenticação|verifique seu e-mail/i.test(error.message)) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        usuario = null; carrinho = []; checkoutDados = {};
        atualizarHeaderUsuario(); atualizarContadorCarrinho();
        renderizarHome();
        exigirConta("enviar uma solicitação de parceria", () => showPage("comerciantes"));
      }
    } finally {
      if (submit) submit.innerHTML = '<span>Enviar solicitação de parceria</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
      if (submit) submit.disabled = false;
    }
  });

  fetch(`${API_BASE}/api/comerciantes/promocoes`, {headers:{...tokenAuthHeaders()},cache:"no-store"})
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok || !j.sucesso) { const error = new Error(j.mensagem || "Não foi possível carregar as promoções."); error.status = r.status; throw error; } return j; })
    .then(j => {
      const box = document.getElementById("lista-promocoes-b2b");
      if (!box) return;
      box.textContent = "";
      box.classList.remove("merchant-promos-empty");
      if (!j.promocoes?.length) {
        box.classList.add("merchant-promos-empty");
        const icon = document.createElement("i"); icon.className = "fa-regular fa-calendar-xmark"; icon.setAttribute("aria-hidden", "true");
        const message = document.createElement("span"); message.textContent = "Nenhuma promoção ativa por enquanto. Volte em breve para conferir as novidades.";
        box.append(icon, message); return;
      }
      j.promocoes.forEach(p => {
        const el = document.createElement("article"); el.className = "merchant-promo-card";
        const badge = document.createElement("span"); badge.className = "merchant-promo-badge"; badge.textContent = "OFERTA PARA PARCEIROS";
        const h = document.createElement("h4"); h.className = "merchant-promo-title"; h.textContent = p.titulo;
        const d = document.createElement("p"); d.className = "merchant-promo-description"; d.textContent = p.descricao;
        const divider = document.createElement("div"); divider.className = "merchant-promo-divider";
        const c = document.createElement("p"); c.className = "merchant-promo-code";
        const codeLabel = document.createElement("span"); codeLabel.textContent = "CUPOM";
        const code = document.createElement("strong"); code.textContent = p.cupom;
        c.append(codeLabel, code);
        const footer = document.createElement("div"); footer.className = "merchant-promo-footer";
        const discount = document.createElement("strong"); discount.className = "merchant-promo-discount"; discount.textContent = `${p.desconto_pct}% OFF`;
        const minimum = document.createElement("span"); minimum.textContent = `Mínimo de ${p.minimo_unidades} unidades`;
        footer.append(discount, minimum);
        el.append(badge, h, d, divider, c, footer); box.appendChild(el);
      });
    }).catch(error => {
      if (error.status === 401 || error.status === 403) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        usuario = null; carrinho = []; checkoutDados = {};
        atualizarHeaderUsuario(); atualizarContadorCarrinho();
        renderizarHome();
        exigirConta("acessar Comerciantes & Grupo VIP", () => showPage("comerciantes"));
        return;
      }
      const box = document.getElementById("lista-promocoes-b2b");
      if (box) { box.classList.add("merchant-promos-empty"); box.textContent = error.message || "Promoções indisponíveis no momento."; }
    });
}

// ========================================================================
// PAINEL ADMINISTRATIVO — protegido pela ADMIN_API_KEY do arquivo .env
// ========================================================================
function moedaBRL(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function requisicaoAdmin(url, options = {}) {
  const chave = sessionStorage.getItem("loja_verde_admin_key");
  const headers = { "Content-Type": "application/json", "X-Admin-Key": chave || "", ...(options.headers || {}) };
  const resposta = await fetch(`${API_BASE}${url}`, { ...options, headers });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok || dados.sucesso === false) {
    if (resposta.status === 403) sessionStorage.removeItem("loja_verde_admin_key");
    throw new Error(dados.mensagem || `Falha na administração (${resposta.status}).`);
  }
  return dados;
}

async function renderizarAdmin() {
  const content = document.getElementById("content");
  if (!content) return;
  let chave = sessionStorage.getItem("loja_verde_admin_key");
  if (!chave) {
    chave = window.prompt("Área restrita. Cole a ADMIN_API_KEY mostrada no terminal ao iniciar o servidor:");
    if (!chave) { showPage("home"); return; }
    sessionStorage.setItem("loja_verde_admin_key", chave.trim());
  }
  content.innerHTML = '<section class="admin-loading"><i class="fa fa-spinner fa-spin"></i><h2>Carregando painel administrativo…</h2></section>';
  try {
    const [resumoData, configData, produtoData, pedidoData, promoData, reviewData] = await Promise.all([
      requisicaoAdmin("/api/admin/resumo"), requisicaoAdmin("/api/admin/configuracoes"),
      requisicaoAdmin("/api/admin/produtos"), requisicaoAdmin("/api/admin/pedidos"), requisicaoAdmin("/api/admin/promocoes"), requisicaoAdmin("/api/admin/avaliacoes")
    ]);
    const resumo = resumoData.resumo || {}, c = configData.configuracoes || {};
    const produtosAdmin = produtoData.produtos || [], pedidosAdmin = pedidoData.pedidos || [], promocoesAdmin = promoData.promocoes || [], avaliacoesAdmin = reviewData.avaliacoes || [];
    const statusLabel = { recebido: "Recebido", confirmado: "Confirmado", em_preparacao: "Em preparação", enviado: "Enviado", concluido: "Concluído", cancelado: "Cancelado" };
    const produtoHTML = produtosAdmin.map(p => `
      <article class="admin-product-card" data-admin-product="${Number(p.id)}">
        <div class="admin-product-card-heading"><div><span class="admin-id">#${Number(p.id)}</span><strong>${esc(p.nome)}</strong></div><label class="admin-toggle"><input type="checkbox" data-field="ativo" ${p.ativo ? "checked" : ""}> Produto visível</label></div>
        <div class="admin-product-fields">
          <label>Nome<input data-field="nome" value="${esc(p.nome)}" maxlength="160" required></label>
          <label>Categoria<input data-field="categoria" value="${esc(p.categoria)}" maxlength="60" required></label>
          <label>Produtor/fornecedor<input data-field="vendedor" value="${esc(p.vendedor || "Loja Verde")}" maxlength="120" required></label>
          <label>Preço atual (R$)<input data-field="preco" type="number" min="0.01" step="0.01" value="${Number(p.preco).toFixed(2)}" required></label>
          <label>Preço original (opcional)<input data-field="precoOriginal" type="number" min="0" step="0.01" value="${p.precoOriginal == null ? "" : Number(p.precoOriginal).toFixed(2)}"></label>
          <label>Estoque<input data-field="estoque" type="number" min="0" step="1" value="${Number(p.estoque)}" required></label>
          <label class="admin-field-wide">Imagem (URL HTTPS ou /caminho)<input data-field="imagem" value="${esc(p.imagem || "")}" maxlength="1000"></label>
          <label class="admin-field-wide">Descrição<textarea data-field="descricao" rows="2" maxlength="1000">${esc(p.descricao || "")}</textarea></label>
        </div>
        <div class="admin-product-actions"><span class="admin-product-stock ${Number(p.estoque) <= 5 ? "low" : ""}">${Number(p.estoque) <= 5 ? "Estoque baixo" : "Estoque disponível"}</span><button type="button" class="btn-admin-primary" onclick="adminSalvarProduto(${Number(p.id)})">Salvar alterações</button></div>
      </article>`).join("");
    const promocaoHTML = promocoesAdmin.map(p => `
      <article class="admin-promo-card" data-admin-promo="${Number(p.id)}">
        <div class="admin-product-fields">
          <label>Título<input data-promo-field="titulo" value="${esc(p.titulo)}" maxlength="160" required></label>
          <label>Cupom<input data-promo-field="cupom" value="${esc(p.cupom)}" maxlength="60" required></label>
          <label>Desconto (%)<input data-promo-field="desconto_pct" type="number" min="0" max="80" step="1" value="${Number(p.desconto_pct)}" required></label>
          <label>Quantidade mínima<input data-promo-field="minimo_unidades" type="number" min="1" step="1" value="${Number(p.minimo_unidades)}" required></label>
          <label>Validade<input data-promo-field="valido_ate" type="date" value="${esc(p.valido_ate || "")}"></label>
          <label class="admin-toggle"><input data-promo-field="ativo" type="checkbox" ${p.ativo ? "checked" : ""}> Promoção ativa</label>
          <label class="admin-field-wide">Descrição<textarea data-promo-field="descricao" rows="2" maxlength="1000">${esc(p.descricao || "")}</textarea></label>
        </div>
        <div class="admin-product-actions"><span class="admin-product-stock">${p.ativo ? "Visível para parceiros" : "Promoção desativada"}</span><button class="btn-admin-primary" type="button" onclick="adminSalvarPromocao(${Number(p.id)})">Salvar promoção</button></div>
      </article>`).join("");
    const reviewAdminHTML = avaliacoesAdmin.map(a => `
      <article class="admin-review-card">
        <div class="admin-review-card-head"><strong>${esc(a.autor || "Cliente")}</strong><span>${"★".repeat(Number(a.nota_produto))}${"☆".repeat(5-Number(a.nota_produto))} produto · ${Number(a.nota_produtor)}/5 produtor</span></div>
        <p><strong>${esc(a.produto_nome || "Produto")}</strong></p><p>${esc(a.comentario || "Sem comentário escrito.")}</p>
        <div class="admin-product-actions"><small>${esc(a.criado_em || "")}</small><button type="button" class="btn-account-logout" onclick="adminExcluirAvaliacao(${Number(a.id)})">Excluir avaliação</button></div>
      </article>`).join("");
    const pedidoHTML = pedidosAdmin.map(p => `
      <details class="admin-order-card"><summary><span><strong>${esc(p.codigo)}</strong><small>${esc(p.cliente_nome || "Cliente") } · ${esc(p.criado_em || "")}</small></span><span class="admin-order-summary-total">${moedaBRL(p.total)}</span></summary>
        <div class="admin-order-details"><p><strong>Contato:</strong> ${esc(p.cliente_email || "—")} · ${esc(p.cliente_telefone || "—")}</p><p><strong>Entrega:</strong> ${esc(p.endereco || "—")}, ${esc(p.bairro || "—")}, ${esc(p.cidade || "—")}/${esc(p.uf || "")} · CEP ${esc(p.cep || "—")}</p>
        <p><strong>Pagamento escolhido:</strong> ${esc(String(p.metodo_pagamento || "").toUpperCase())} — <em>não significa pagamento recebido</em></p>
        <div class="admin-order-items">${(p.itens || []).map(i => `<div><span>${Number(i.quantidade)}× ${esc(i.nome)}<small>${esc(condicaoEntregaLabel(i.condicao_entrega || "padrao"))}${i.observacao ? ` · Obs.: ${esc(i.observacao)}` : ""}</small></span><strong>${moedaBRL(Number(i.preco)*Number(i.quantidade))}</strong></div>`).join("")}</div>
        <div class="admin-order-status-row"><label for="status-${esc(p.codigo)}">Status do pedido</label><select id="status-${esc(p.codigo)}" data-order-status="${esc(p.codigo)}">${Object.entries(statusLabel).map(([k,v]) => `<option value="${k}" ${p.status===k?'selected':''}>${v}</option>`).join("")}</select><button type="button" class="btn-admin-primary" onclick="adminSalvarStatusPedido('${esc(p.codigo)}')">Atualizar status</button></div>
      </div></details>`).join("");
    content.innerHTML = `
      <section class="admin-dashboard">
        <header class="admin-heading"><div><p class="eyebrow">ACESSO RESTRITO</p><h2>Painel administrativo</h2><p>Gerencie catálogo, dados básicos da loja e pedidos recebidos.</p></div><button type="button" class="btn-outline-green" onclick="adminSair()">Sair do painel</button></header>
        <div class="admin-demo-notice"><strong>Modo de demonstração</strong><span>Os pedidos são salvos no banco. A cobrança real de Pix/cartão/boleto ainda depende da integração de um gateway.</span></div>
        <div class="admin-stats-grid"><article><span>Pedidos ativos</span><strong>${Number(resumo.pedidos || 0)}</strong></article><article><span>Produtos visíveis</span><strong>${Number(resumo.produtos || 0)}</strong></article><article><span>Produtos com estoque baixo</span><strong>${Number(resumo.estoque_baixo || 0)}</strong></article><article><span>Visitas registradas</span><strong>${Number(resumo.visitas || 0)}</strong></article><article><span>Valor de pedidos não cancelados</span><strong>${moedaBRL(Number(resumo.total_pedidos_centavos || 0)/100)}</strong></article></div>
        <section class="admin-section"><div class="admin-section-title"><div><h3>Configurações da loja</h3><p>Contato, banner superior e regras básicas de frete/cupons.</p></div></div>
          <form id="formAdminConfiguracoes" class="admin-settings-form">
            <label>Nome da loja<input id="adminNomeLoja" name="nome_loja" value="${esc(c.nome_loja || "Loja Verde")}" required maxlength="80"></label>
            <label>E-mail público<input id="adminEmailContato" name="email_contato" type="email" value="${esc(c.email_contato || "")}" required></label>
            <label>WhatsApp (DDI + DDD + número, só dígitos)<input id="adminWhatsapp" name="whatsapp" value="${esc(c.whatsapp || "")}" inputmode="numeric" pattern="[0-9]{10,15}" required></label>
            <label>Frete grátis acima de (R$)<input id="adminFreteGratis" name="frete_gratis_acima" type="number" min="0" step="0.01" value="${Number(c.frete_gratis_acima ?? 99)}" required></label>
            <label>Valor do frete (R$)<input id="adminFreteValor" name="frete_valor" type="number" min="0" step="0.01" value="${Number(c.frete_valor ?? 15)}" required></label>
            <label>Desconto do cupom VERDE10 (%)<input id="adminDescontoCupom" name="desconto_cupom" type="number" min="0" max="80" step="1" value="${Number(c.desconto_cupom ?? 10)}" required></label>
            <label class="admin-field-wide">Aviso do topo (até 200 caracteres)<input id="adminAvisoTopo" name="aviso_topo" maxlength="200" value="${esc(c.aviso_topo || "")}"></label>
            <div class="admin-form-footer"><span id="adminConfigFeedback" role="status"></span><button type="submit" class="btn-admin-primary">Salvar configurações</button></div>
          </form>
        </section>
        <section class="admin-section"><div class="admin-section-title"><div><h3>Promoções para parceiros</h3><p>Atualize cupons B2B exibidos na página Comerciantes & Grupo VIP.</p></div><span class="admin-count">${promocoesAdmin.length} promoções</span></div>
          <form id="formAdminNovaPromocao" class="admin-new-product"><h4>Adicionar promoção</h4><div class="admin-product-fields"><label>Título<input name="titulo" required maxlength="160"></label><label>Cupom<input name="cupom" required maxlength="60"></label><label>Desconto (%)<input name="desconto_pct" type="number" min="0" max="80" step="1" value="10" required></label><label>Quantidade mínima<input name="minimo_unidades" type="number" min="1" value="10" required></label><label>Validade<input name="valido_ate" type="date"></label><label class="admin-field-wide">Descrição<textarea name="descricao" rows="2" maxlength="1000"></textarea></label></div><button type="submit" class="btn-admin-primary">Criar promoção</button><span id="adminNovaPromocaoFeedback" role="status"></span></form>
          <div class="admin-product-list">${promocaoHTML || '<p>Nenhuma promoção cadastrada.</p>'}</div>
        </section>
        <section class="admin-section"><div class="admin-section-title"><div><h3>Catálogo de produtos</h3><p>Edite preços, estoque, descrições, imagens e visibilidade. Alterações salvas são usadas no catálogo e validadas no checkout.</p></div><span class="admin-count">${produtosAdmin.length} produtos</span></div>
          <form id="formAdminNovoProduto" class="admin-new-product"><h4>Adicionar produto</h4><div class="admin-product-fields"><label>Nome<input name="nome" required maxlength="160"></label><label>Categoria<input name="categoria" required maxlength="60" placeholder="mudas, hortalicas…"></label><label>Produtor/fornecedor<input name="vendedor" required maxlength="120" value="Loja Verde"></label><label>Preço atual (R$)<input name="preco" type="number" min="0.01" step="0.01" required></label><label>Preço original (opcional)<input name="precoOriginal" type="number" min="0" step="0.01"></label><label>Estoque inicial<input name="estoque" type="number" min="0" step="1" value="0" required></label><label class="admin-field-wide">Imagem (URL HTTPS ou caminho local)<input name="imagem" maxlength="1000"></label><label class="admin-field-wide">Descrição<textarea name="descricao" rows="2" maxlength="1000"></textarea></label></div><button type="submit" class="btn-admin-primary">Cadastrar produto</button><span id="adminNovoProdutoFeedback" role="status"></span></form>
          <div class="admin-product-list">${produtoHTML || '<p>Nenhum produto cadastrado.</p>'}</div>
        </section>
        <section class="admin-section"><div class="admin-section-title"><div><h3>Avaliações de clientes</h3><p>Comentários enviados por contas cadastradas. Exclua conteúdo ofensivo ou inadequado.</p></div><span class="admin-count">${avaliacoesAdmin.length} avaliações</span></div><div class="admin-reviews-list">${reviewAdminHTML || '<p>Ainda não há avaliações cadastradas.</p>'}</div></section>
        <section class="admin-section"><div class="admin-section-title"><div><h3>Pedidos recentes</h3><p>Revise cliente/endereço e atualize a situação. Cancelar um pedido devolve as unidades ao estoque.</p></div><span class="admin-count">${pedidosAdmin.length} pedidos</span></div><div class="admin-orders-list">${pedidoHTML || '<p>Os pedidos feitos no site aparecerão aqui.</p>'}</div></section>
        <div id="adminGlobalFeedback" class="admin-global-feedback" role="status"></div>
      </section>`;
    document.getElementById("formAdminConfiguracoes")?.addEventListener("submit", adminSalvarConfiguracoes);
    document.getElementById("formAdminNovoProduto")?.addEventListener("submit", adminAdicionarProduto);
    document.getElementById("formAdminNovaPromocao")?.addEventListener("submit", adminAdicionarPromocao);
  } catch (erro) {
    content.innerHTML = `<section class="admin-error"><h2>Não foi possível abrir a administração</h2><p>${esc(erro.message)}</p><p>Confira a chave ADMIN_API_KEY exibida no terminal quando o servidor iniciou.</p><button type="button" class="btn-outline-green" onclick="adminSair()">Voltar para a loja</button><button type="button" class="btn-admin-primary" onclick="renderizarAdmin()">Tentar novamente</button></section>`;
  }
}

async function adminSalvarConfiguracoes(event) {
  if (event) event.preventDefault();
  const form = document.getElementById("formAdminConfiguracoes");
  const feedback = document.getElementById("adminConfigFeedback");
  if (!form || !form.reportValidity()) return;
  const dados = Object.fromEntries(new FormData(form).entries());
  try {
    const r = await requisicaoAdmin("/api/admin/configuracoes", { method: "PUT", body: JSON.stringify(dados) });
    if (feedback) feedback.textContent = r.mensagem || "Configurações salvas.";
    await carregarConfiguracoesPublicas();
    aplicarConfiguracoesNaPagina();
  } catch (e) { if (feedback) feedback.textContent = e.message; }
}

async function adminSalvarProduto(id) {
  const card = document.querySelector(`[data-admin-product="${Number(id)}"]`);
  if (!card) return;
  const value = name => card.querySelector(`[data-field="${name}"]`);
  const dados = {
    nome: value("nome").value, categoria: value("categoria").value, vendedor: value("vendedor").value, preco: Number(value("preco").value),
    precoOriginal: value("precoOriginal").value === "" ? null : Number(value("precoOriginal").value),
    estoque: Number(value("estoque").value), imagem: value("imagem").value, descricao: value("descricao").value,
    ativo: value("ativo").checked
  };
  try {
    await requisicaoAdmin(`/api/admin/produtos/${Number(id)}`, { method: "PATCH", body: JSON.stringify(dados) });
    const status = document.getElementById("adminGlobalFeedback"); if (status) status.textContent = `Produto #${id} atualizado.`;
    await carregarProdutosDoServidor();
    await renderizarAdmin();
  } catch (e) { alert(`Não foi possível salvar o produto: ${e.message}`); }
}

async function adminAdicionarProduto(event) {
  if (event) event.preventDefault();
  const form = document.getElementById("formAdminNovoProduto");
  const feedback = document.getElementById("adminNovoProdutoFeedback");
  if (!form || !form.reportValidity()) return;
  const dados = Object.fromEntries(new FormData(form).entries());
  dados.preco = Number(dados.preco); dados.precoOriginal = dados.precoOriginal === "" || dados.precoOriginal == null ? null : Number(dados.precoOriginal); dados.estoque = Number(dados.estoque); dados.ativo = true;
  try {
    const r = await requisicaoAdmin("/api/admin/produtos", { method: "POST", body: JSON.stringify(dados) });
    if (feedback) feedback.textContent = r.mensagem || "Produto cadastrado.";
    form.reset();
    await carregarProdutosDoServidor();
    await renderizarAdmin();
  } catch (e) { if (feedback) feedback.textContent = e.message; }
}

async function adminSalvarStatusPedido(codigo) {
  const select = document.querySelector(`[data-order-status="${codigo}"]`);
  if (!select) return;
  try {
    const r = await requisicaoAdmin(`/api/admin/pedidos/${encodeURIComponent(codigo)}/status`, { method: "PATCH", body: JSON.stringify({ status: select.value }) });
    const feedback = document.getElementById("adminGlobalFeedback"); if (feedback) feedback.textContent = r.mensagem || "Status atualizado.";
    await renderizarAdmin();
  } catch (e) { alert(`Não foi possível atualizar o pedido: ${e.message}`); }
}

async function adminSalvarPromocao(id) {
  const card = document.querySelector(`[data-admin-promo="${Number(id)}"]`);
  if (!card) return;
  const val = name => card.querySelector(`[data-promo-field="${name}"]`);
  const dados = {
    titulo: val("titulo").value, cupom: val("cupom").value, desconto_pct: Number(val("desconto_pct").value),
    minimo_unidades: Number(val("minimo_unidades").value), valido_ate: val("valido_ate").value,
    descricao: val("descricao").value, ativo: val("ativo").checked
  };
  try { await requisicaoAdmin(`/api/admin/promocoes/${Number(id)}`, { method: "PATCH", body: JSON.stringify(dados) }); await renderizarAdmin(); }
  catch (e) { alert(`Não foi possível salvar a promoção: ${e.message}`); }
}

async function adminAdicionarPromocao(event) {
  if (event) event.preventDefault();
  const form = document.getElementById("formAdminNovaPromocao"), feedback = document.getElementById("adminNovaPromocaoFeedback");
  if (!form || !form.reportValidity()) return;
  const dados = Object.fromEntries(new FormData(form).entries());
  dados.desconto_pct = Number(dados.desconto_pct); dados.minimo_unidades = Number(dados.minimo_unidades); dados.ativo = true;
  try { const r = await requisicaoAdmin("/api/admin/promocoes", { method: "POST", body: JSON.stringify(dados) }); if (feedback) feedback.textContent = r.mensagem || "Promoção criada."; form.reset(); await renderizarAdmin(); }
  catch (e) { if (feedback) feedback.textContent = e.message; }
}

async function adminExcluirAvaliacao(id) {
  if (!window.confirm("Excluir esta avaliação? Esta ação não pode ser desfeita.")) return;
  try { await requisicaoAdmin(`/api/admin/avaliacoes/${Number(id)}`, { method: "DELETE" }); await renderizarAdmin(); }
  catch (e) { alert(`Não foi possível excluir a avaliação: ${e.message}`); }
}

function adminSair() {
  sessionStorage.removeItem("loja_verde_admin_key");
  showPage("home");
}



// Expõe explicitamente as funções usadas pelos botões inline do HTML.
Object.assign(window, { showPage, adicionarAoCarrinho, adicionarProdutoDetalhe, alterarQtdCarrinho, removerItemCarrinho, renderizarCarrinho, setMetodoPagamento, aplicarCupomInput, finalizarPedido, toggleNavOptions, adminSalvarProduto, adminSalvarConfiguracoes, adminSalvarStatusPedido, adminAdicionarProduto, adminSalvarPromocao, adminAdicionarPromocao, adminExcluirAvaliacao, adminSair, consultarCep, abrirModalOuPerfil, fecharModalLogin, renderizarModalAutenticacao, cadastrarConta, entrarConta, verificarContaEmail, reenviarCodigoEmail, renderizarRecuperacaoSenha, solicitarRedefinicaoSenha, confirmarRedefinicaoSenha, salvarPerfilConta, sairDaConta, enviarAvaliacaoProduto });
