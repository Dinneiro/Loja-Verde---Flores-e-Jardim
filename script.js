// =============================
// CATÁLOGO DE PRODUTOS (ATUALIZADO com Estoque, Combo e Preço de Combo)
// =============================
let produtos = [
  // --- Condolências ---
  { id: 1, nome: "Samambaia", imagem: "https://i.pinimg.com/736x/f3/af/db/f3afdb6985bd1b696d594598af9d95c6.jpg", categoria: "condolencias", vendedor: "Floricultura Esperança", comentarios: [], preco: 25, descricao: "Clássica e elegante, a Samambaia é ideal para expressar conforto. Símbolo de recomeço e eternidade, é fácil de cuidar.", entrega: "3 dias úteis", sugestoes: [2, 3], nomeCombo: "Vaso de Cerâmica", precoCombo: 37, estoque: 30 },
  { id: 2, nome: "Bromélia Verde", imagem: "https://www.sitiodamata.com.br/media/catalog/product/cache/bd7e41e8357e6ae06c7d33758afd4978/b/r/bromelia-imperial-alcantarea-imperialis_2nd.jpg", categoria: "condolencias", vendedor: "Flora Viva", comentarios: [], preco: 35, descricao: "Com suas folhas robustas e vibrantes, a Bromélia traz uma beleza exótica e duradoura. Perfeita para ambientes internos.", entrega: "2 dias úteis", sugestoes: [1, 4], nomeCombo: "Adubo Orgânico", precoCombo: 45, estoque: 25 },
  { id: 3, nome: "Espada-de-São-Jorge", imagem: "https://www.petz.com.br/blog/wp-content/uploads/2021/12/como-plantar-espada-de-sao-jorge3.jpg", categoria: "condolencias", vendedor: "Jardim da Paz", comentarios: [], preco: 30, descricao: "Popular por purificar o ar e pela resistência, é uma escolha de baixo cuidado e grande simbolismo.", entrega: "1 dia útil", sugestoes: [4, 5], nomeCombo: "Regador de Metal", precoCombo: 42, estoque: 40 },
  { id: 4, nome: "Zamioculca", imagem: "https://www.estadao.com.br/resizer/v2/MGGLB6C6Z5O3VLOSOIHUROQ62I.jpg?quality=80&auth=fe0f2e9a1efe05a5ff00586ff083b9c5e06917135161f6baf8153e1935cd8343&width=550&height=925&focal=980,586", categoria: "condolencias", vendedor: "Terra & Cia.", comentarios: [], preco: 32, descricao: "Planta moderna, conhecida por crescer bem em ambientes com pouca luz e exigir pouca água.", entrega: "3 dias úteis", sugestoes: [1, 2], nomeCombo: "Suporte de Madeira", precoCombo: 48, estoque: 15 },

  // --- Aniversário ---
  { id: 5, nome: "Cacto", imagem: "https://i.pinimg.com/1200x/6a/74/9a/6a749ac99ec29d1c6d29668b9566eb7a.jpg", categoria: "aniversario", vendedor: "Cactos & Suculentas", comentarios: [], preco: 15, descricao: "Um presente divertido e único que simboliza força e persistência. Ideal para quem está começando na jardinagem.", entrega: "5 dias úteis", sugestoes: [6, 7], nomeCombo: "Mini Ferramentas", precoCombo: 25, estoque: 50 },
  { id: 6, nome: "Girassol", imagem: "https://i.pinimg.com/736x/38/96/a2/3896a27350f442ac94cc111cc2be7493.jpg", categoria: "aniversario", vendedor: "Raio de Sol Flores", comentarios: [], preco: 35, descricao: "Símbolo de felicidade e vitalidade. Sua cor amarela vibrante garante um sorriso no dia do aniversariante.", entrega: "1 dia útil", sugestoes: [8, 9], nomeCombo: "Cartão Personalizado", precoCombo: 40, estoque: 20 },
  { id: 7, nome: "Violeta", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6f4zVXBOUy_cU1IzfExEV8fmGH6PdKAe7VQ&s", categoria: "aniversario", vendedor: "Flores da Vovó", comentarios: [], preco: 20, descricao: "Pequena e charmosa, a Violeta é um presente delicado que se adapta a espaços pequenos. Disponível em várias cores.", entrega: "3 dias úteis", sugestoes: [5, 6], nomeCombo: "Cachepô Decorado", precoCombo: 30, estoque: 30 },
  { id: 8, nome: "Begônia", imagem: "https://diariodonordeste.verdesmares.com.br/image/contentid/policy:1.3320564:1672943298/begonia%20planta%20.jpg?f=16x9&h=720&w=1280&$p$f$h$w=14b654f", categoria: "aniversario", vendedor: "Jardim Alegre", comentarios: [], preco: 28, descricao: "Com suas flores exuberantes e longas, a Begônia é perfeita para trazer cor a qualquer ambiente. Cuidado fácil.", entrega: "2 dias úteis", sugestoes: [9, 10], nomeCombo: "Spray de Brilho", precoCombo: 38, estoque: 5 }, // Estoque baixo
  { id: 9, nome: "Lírio-da-paz", imagem: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSw8HY00YSh6-jLa4MaTs7hB1DGRCJOkMKRXA&s", categoria: "aniversario", vendedor: "Aromas Naturais", comentarios: [], preco: 30, descricao: "Conhecido por florescer em ambientes internos e pela beleza das suas folhas, é um presente de paz e pureza.", entrega: "1 dia útil", sugestoes: [7, 8], nomeCombo: "Kit Feng Shui", precoCombo: 45, estoque: 22 },

  // --- Casamento ---
  { id: 10, nome: "Orquídea", imagem: "https://i.pinimg.com/736x/f3/dc/41/f3dc41d7accc02861dcb47d484c532c4.jpg", categoria: "casamento", vendedor: "Orquidário Nobre", comentarios: [], preco: 40, descricao: "Um símbolo de amor, luxo e beleza. A Orquídea é o presente ideal para celebrar a união e a elegância.", entrega: "1 dia útil", sugestoes: [11, 12], nomeCombo: "Vaso de Cristal", precoCombo: 55, estoque: 18 },
  { id: 11, nome: "Rosas Vermelhas", imagem: "https://i.pinimg.com/1200x/10/32/a4/1032a4f9bc2539711ce791701ddba47c.jpg", categoria: "casamento", vendedor: "Rei das Rosas", comentarios: [], preco: 50, descricao: "O clássico do romance e da paixão. Um buquê com 12 rosas vermelhas frescas, o presente eterno para o amor.", entrega: "Entrega Expressa - 4h", sugestoes: [13, 14], nomeCombo: "Buquê Premium c/ 24", precoCombo: 90, estoque: 30 },
  { id: 12, nome: "Lírio Branco", imagem: "https://www.picturethisai.com/wiki-image/1080/201217426818465792.jpeg", categoria: "casamento", vendedor: "Flores Puras", comentarios: [], preco: 45, descricao: "Representa a pureza, inocência e majestade. Um arranjo perfeito para a decoração de casamentos e presentes.", entrega: "2 dias úteis", sugestoes: [10, 14], nomeCombo: "Laço de Seda", precoCombo: 52, estoque: 12 },
  { id: 13, nome: "Jasmim", imagem: "https://cdn.assets-casacor.tec.br/file/casacor-images-news/2025/03/1722289251-jasmim-manga.webp", categoria: "casamento", vendedor: "Aromas do Campo", comentarios: [], preco: 42, descricao: "Seu perfume doce é perfeito para criar um ambiente romântico. Simboliza o amor e a sorte.", entrega: "4 dias úteis", sugestoes: [11, 12], nomeCombo: "Kit Difusor", precoCombo: 60, estoque: 0 }, // Fora de estoque
  { id: 14, nome: "Hortênsia Azul", imagem: "https://s2-casavogue.glbimg.com/h1z9MCBkCNc94n4oimTk4v2Nzpg=/0x0:620x413/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_d72fd4bf0af74c0c89d27a5a226dbbf8/internal_photos/bs/2023/c/7/sIoFlqTzSBdI18tkLCWg/2021-02-02-hortensia-como-plantar-em-casa-1.jpeg", categoria: "casamento", vendedor: "Flores Raras", comentarios: [], preco: 48, descricao: "Sua tonalidade azul vibrante é muito procurada. Simboliza a devoção e o sentimento sincero.", entrega: "3 dias úteis", sugestoes: [13, 10], nomeCombo: "Balde Decorativo", precoCombo: 62, estoque: 20 },

  // --- Jardim ---
  { id: 15, nome: "Alecrim", imagem: "https://s2.glbimg.com/ev4J4_MHZYdjpmymwfw2RthHrkw=/e.glbimg.com/og/ed/f/original/2022/05/31/dicas-para-plantar-o-alecrim-e-mante-lo-saudavel-1.jpg", categoria: "jardim", vendedor: "Temperos do Sítio", comentarios: [], preco: 15, descricao: "Um tempero essencial e aromático para sua cozinha. Atrai boa sorte e é muito resistente.", entrega: "2 dias úteis", sugestoes: [16, 17], nomeCombo: "Pote de Barro", precoCombo: 25, estoque: 60 },
  { id: 16, nome: "Manjericão", imagem: "https://images.tcdn.com.br/img/img_prod/799330/manjericao_grecco_481_1_20200523173359.jpg", categoria: "jardim", vendedor: "Temperos do Sítio", comentarios: [], preco: 12, descricao: "O ingrediente secreto do molho pesto. Adicione frescor e sabor aos seus pratos.", entrega: "1 dia útil", sugestoes: [15, 17], nomeCombo: "Tesoura de Poda", precoCombo: 22, estoque: 70 },
  { id: 17, nome: "Suculentas Variadas", imagem: "https://cdn.awsli.com.br/600x700/1334/1334796/produto/53581613/df0fea7c6a.jpg", categoria: "jardim", vendedor: "Cactos & Suculentas", comentarios: [], preco: 18, descricao: "Coleção de mini suculentas para decorar seu escritório ou dar de presente. Fáceis de cuidar!", entrega: "4 dias úteis", sugestoes: [5, 7], nomeCombo: "Pedras Decorativas", precoCombo: 28, estoque: 45 }
];

// ----------------------------------------------------
// ATUALIZAÇÃO DO CARRINHO
// O carrinho agora armazena objetos para suportar variações (base vs combo)
// ----------------------------------------------------
let carrinho = [];
const carrinhoSalvo = JSON.parse(localStorage.getItem("carrinho")) || [];
// Migração: Se o carrinho salvo for do formato antigo (só números), converte para o novo
if (carrinhoSalvo.length > 0 && typeof carrinhoSalvo[0] === 'number') {
  carrinho = carrinhoSalvo.map(id => ({ id: id, tipo: 'base' }));
  localStorage.setItem("carrinho", JSON.stringify(carrinho)); // Salva no novo formato
} else {
  carrinho = carrinhoSalvo; // Já está no formato novo ou é um array vazio
}

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let usuario = JSON.parse(localStorage.getItem("usuario")) || null;

// Utilitário para hash simples (senha)
async function hash(texto) {
  const msgUint8 = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function showToast(id, msg) {
  const t = document.getElementById(id);
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

// ----------------------------------------------------
// Função para trocar abas na tela de login
// ----------------------------------------------------
function mudarAba(abaAtiva, abaInativa) {
    document.getElementById(abaAtiva).classList.add("active");
    document.getElementById(abaInativa).classList.remove("active");

    document.getElementById('aba-' + abaAtiva).classList.add("active");
    document.getElementById('aba-' + abaInativa).classList.remove("active");
}

// ----------------------------------------------------
// Função para renderizar o formulário na tela de login
// ----------------------------------------------------
function renderLoginScreen() {
    const loginScreen = document.getElementById("loginScreen");
    if (loginScreen.innerHTML.trim() === "") {
        loginScreen.innerHTML = `
          <div class="login-container">
            <div class="login-abas">
              <button id="aba-entrar" class="login-aba active" onclick="mudarAba('entrar', 'cadastrar')">Entrar</button>
              <button id="aba-cadastrar" class="login-aba" onclick="mudarAba('cadastrar', 'entrar')">Cadastrar</button>
            </div>
            <div class="login-conteudo">
              <div id="entrar" class="login-form active">
                <h3>Bem-vindo à Loja Verde</h3>
                <input id='loginNome' placeholder='Nome' type='text'><br>
                <input id='loginSenha' type='password' placeholder='Senha'><br>
                <button onclick='fazerLogin()' class="login-btn login">Entrar</button>
                <a href="#" class="link-esqueceu">Esqueceu a senha?</a>
              </div>
              <div id="cadastrar" class="login-form">
                <h3>Novo Cadastro</h3>
                <input id='cadNome' placeholder='Nome completo' type='text'><br>
                <input id='cadEmail' placeholder='Email' type='text'><br>
                <input id='cadSenha' type='password' placeholder='Senha'><br>
                <input id='cadConfSenha' type='password' placeholder='Repita a senha'><br>
                <button onclick='cadastrarUsuario()' class="login-btn register">Cadastrar</button>
              </div>
            </div>
          </div>`;
    }
}


// ----------------------------------------------------
// FUNÇÃO SHOWPAGE ATUALIZADA (Lógica de Login Obrigatório)
// ----------------------------------------------------
function showPage(page) {
  const content = document.getElementById("content");
  const btnAdmin = document.getElementById("btnAdmin");
  
  const loginScreen = document.getElementById("loginScreen");
  const mainHeader = document.getElementById("mainHeader");
  const mainFooter = document.getElementById("mainFooter");

  // SE NÃO ESTIVER LOGADO -> MOSTRAR TELA DE LOGIN OBRIGATÓRIA
  if (!usuario) {
      loginScreen.classList.remove("hidden");
      renderLoginScreen(); 
      
      mainHeader.classList.add("hidden");
      mainFooter.classList.add("hidden");
      content.classList.add("hidden");
      document.getElementById("modalProduto").classList.add("hidden");
      return; 
  }

  // SE CHEGOU AQUI, O USUÁRIO ESTÁ LOGADO
  loginScreen.classList.add("hidden");
  mainHeader.classList.remove("hidden");
  mainFooter.classList.remove("hidden");
  content.classList.remove("hidden");

  btnAdmin.classList.toggle("hidden", usuario.nome !== "admin");

  // ----------------------------------------------------
  // Renderização normal das páginas
  // ----------------------------------------------------
  if (page === "home" || ["casamento", "aniversario", "condolencias", "jardim"].includes(page)) {
    let lista = produtos;
    if (page !== "home") lista = produtos.filter(p => p.categoria === page);

    content.innerHTML = `<h2>${page === "home" ? "Produtos" : page.charAt(0).toUpperCase() + page.slice(1)}</h2>
                         <div class="grid"></div>`;
    const grid = content.querySelector(".grid");
    lista.forEach(p => {
      grid.innerHTML += `
        <div class='product'>
          <img src="${p.imagem}" alt="${p.nome}">
          <strong>${p.nome}</strong><br>
          <p>R$${p.preco}</p>
          <button class='add' onclick='abrirProduto(${p.id})'>Ver Detalhes</button>
          <button onclick='addCarrinho(${p.id}, "base")'><i class="fa fa-cart-plus"></i></button>
          <button onclick='addFavorito(${p.id})'><i class="fa fa-heart"></i></button>
        </div>`;
    });
  }

  else if (page === "carrinho") {
    // LÓGICA DO CARRINHO ATUALIZADA
    let carrinhoAgrupado = {};
    carrinho.forEach(item => {
      // A chave única agora inclui o tipo (ex: "1_base" ou "1_combo")
      const key = `${item.id}_${item.tipo}`;
      carrinhoAgrupado[key] = (carrinhoAgrupado[key] || 0) + 1;
    });

    content.innerHTML = `
      <h2>Seu Carrinho de Compras</h2>
      <div class="carrinho-list"></div>
      <div class="carrinho-resumo"></div>
    `;

    const list = content.querySelector(".carrinho-list");
    const resumo = content.querySelector(".carrinho-resumo");
    let total = 0;

    for (const key in carrinhoAgrupado) {
      const [idStr, tipo] = key.split('_');
      const id = parseInt(idStr);
      const p = produtos.find(x => x.id === id);
      const quantidade = carrinhoAgrupado[key];

      // Definir nome e preço com base no tipo
      let nomeProduto = p.nome;
      let precoUnitario = p.preco;
      if (tipo === 'combo' && p.nomeCombo) {
          nomeProduto = `${p.nome} (c/ ${p.nomeCombo})`;
          precoUnitario = p.precoCombo;
      }
      
      const subtotal = precoUnitario * quantidade;
      total += subtotal;

      list.innerHTML += `
        <div class="carrinho-item">
          <img src="${p.imagem}" alt="${nomeProduto}" class="carrinho-img">
          <div class="carrinho-detalhes">
            <strong>${nomeProduto}</strong><br>
            <p>Preço Unitário: R$${precoUnitario.toFixed(2)}</p>
          </div>
          <div class="carrinho-acoes">
            <span class="carrinho-qtd">Qtd: ${quantidade}</span>
            <span class="carrinho-subtotal">R$${subtotal.toFixed(2)}</span>
            <button class="remove-btn" onclick='removerCarrinho(${p.id}, "${tipo}")'>
              <i class="fa fa-trash"></i> Retirar
            </button>
          </div>
        </div>
      `;
    }

    if (total === 0) {
        list.innerHTML = "<p>Seu carrinho está vazio 😔</p>";
    } else {
        resumo.innerHTML = `
          <h3>Resumo da Compra</h3>
          <p>Total dos Produtos: <strong>R$${total.toFixed(2)}</strong></p>
          <button class="checkout-btn" onclick="showPage('checkout')">
            Finalizar Compra <i class="fa fa-arrow-right"></i>
          </button>
        `;
    }
  }
  
  else if (page === "checkout") {
    // LÓGICA DE TOTAL DO CHECKOUT ATUALIZADA
    const total = carrinho.reduce((sum, item) => {
        const p = produtos.find(x => x.id === item.id);
        if (item.tipo === 'combo' && p.precoCombo) {
            return sum + p.precoCombo;
        }
        return sum + p.preco;
    }, 0);
    const frete = 15.00; 
    const pagamentoTotal = total + frete;

    content.innerHTML = `
      <h2>Finalizar Pedido</h2>
      <div class="checkout-container">
        <div class="checkout-section">
          <h3>Detalhes de Entrega</h3>
          <p>Endereço: Rua das Flores, 123 - Jardim Botânico</p>
          <p>Previsão: 5-7 dias úteis</p>
        </div>
        <div class="checkout-section">
          <h3>Método de Pagamento</h3>
          <div class="metodos-pagamento">
            <button class="metodo-btn active">Cartão de Crédito</button>
            <button class="metodo-btn">Pix</button>
            <button class="metodo-btn">Boleto</button>
          </div>
          <input placeholder="Número do Cartão" type="text" style="width: 100%; margin-top: 1rem;">
          <input placeholder="Nome no Cartão" type="text" style="width: 100%;">
        </div>
        <div class="checkout-resumo">
          <h3>Resumo do Pedido</h3>
          <p>Subtotal: R$${total.toFixed(2)}</p>
          <p>Frete: R$${frete.toFixed(2)}</p>
          <hr>
          <p class="total-final">Total a Pagar: <strong>R$${pagamentoTotal.toFixed(2)}</strong></p>
          <button class="confirm-btn" onclick="finalizarPedido()">Pagar e Fazer Pedido</button>
        </div>
      </div>
    `;
  }
  
  else if (page === "config") {
    const fotoUrl = usuario.foto || 'https://i.pravatar.cc/150?u=' + usuario.email;

    content.innerHTML = `
      <h2>Meu Perfil</h2>
      <div class='profile-card'>
        <div class="profile-header">
            <img src="${fotoUrl}" alt="Foto de Perfil" class="profile-img">
            <input id='perfilFoto' placeholder='Link da Imagem' value="${usuario.foto || ''}" style="width: 90%;">
            <button onclick="salvarFoto()">Salvar Foto</button>
        </div>
        <p><strong>Nome:</strong> ${usuario.nome} (Não editável)</p>
        <label for="perfilEmail">Email:</label>
        <input id='perfilEmail' value="${usuario.email}" style="width: 90%;"><br>
        <button onclick="salvarPerfil()">Salvar Alterações</button>
        <hr>
        <h3>Meus Favoritos</h3>
        <p>${favoritos.map(id => produtos.find(x => x.id === id).nome).join(", ") || "Nenhum favorito"}</p>
        <button onclick="logout()">Sair</button>
      </div>`;
  }
  
  else if (page === "atendimento") {
    content.innerHTML = `
      <h2>Central de Ajuda da Loja Verde</h2>
      <div class="atendimento-search">
        <input type="text" placeholder="Pesquisar ajuda (Ex: Devolução, Rastreio, Cuidados com Orquídea)" style="width: 100%;">
      </div>
      <div class="topicos-container">
        <h3>Tópicos Populares</h3>
        <div class="topicos-grid">
          <div class="topico-card" onclick="alert('Ajuda sobre pedidos e cancelamentos.');">
            <i class="fa fa-shopping-bag"></i>
            <span>Meus Pedidos e Cancelamentos</span>
          </div>
          <div class="topico-card" onclick="alert('Ajuda sobre rastreamento e entrega.');">
            <i class="fa fa-truck"></i>
            <span>Rastreamento e Entrega</span>
          </div>
          <div class="topico-card" onclick="alert('Ajuda sobre devoluções e reembolsos.');">
            <i class="fa fa-undo"></i>
            <span>Devoluções e Reembolsos</span>
          </div>
          <div class="topico-card" onclick="alert('Ajuda sobre cuidados com plantas.');">
            <i class="fa fa-seedling"></i>
            <span>Cuidados com a Planta</span>
          </div>
          <div class="topico-card" onclick="alert('Ajuda sobre login e segurança.');">
            <i class="fa fa-user-lock"></i>
            <span>Login e Segurança</span>
          </div>
          <div class="topico-card" onclick="showPage('faleConosco')">
            <i class="fa fa-comments"></i>
            <span>Falar Conosco</span>
          </div>
        </div>
      </div>
    `;
  }
  
  else if (page === "faleConosco") {
    content.innerHTML = `
      <h2>Fale Conosco</h2>
      <p>Descreva sua dúvida detalhadamente para que possamos te ajudar.</p>
      <textarea id='msgAtendimento' placeholder='Digite sua mensagem...'></textarea><br>
      <button onclick='enviarAtendimento()'>Enviar Mensagem</button>
    `;
  }
  
  else if (page === "admin" && usuario.nome === "admin") {
    content.innerHTML = `
      <h2>Painel Administrativo</h2>
      <p>Bem-vindo, administrador 🌱</p>
      <h3>Gerenciar Produtos</h3>
      <div class="admin-grid">
        ${produtos.map(p => `
          <div class="admin-produto">
            <img src="${p.imagem}" width="80" alt="${p.nome}">
            <strong>${p.nome}</strong> - R$${p.preco} (Estoque: ${p.estoque})
            <div class="admin-acoes">
              <button onclick='editarProduto(${p.id})'><i class="fa fa-edit"></i> Editar</button>
              <button class="remove-btn" onclick='excluirProduto(${p.id})'><i class="fa fa-times"></i> Excluir</button>
            </div>
          </div>
        `).join("")}
      </div>
      <button class="add-btn" onclick="abrirModalAdicionarProduto()">Adicionar Novo Produto</button>
    `;
  }
  
  else if (page === "favoritos") {
    content.innerHTML = "<h2>Favoritos</h2><div class='grid'></div>";
    const grid = content.querySelector(".grid");
    favoritos.forEach(id => {
      let p = produtos.find(x => x.id === id);
      grid.innerHTML += `
        <div class='product'>
          <img src="${p.imagem}" alt="${p.nome}">
          <strong>${p.nome}</strong><br>
          <p>R$${p.preco}</p>
          <button onclick='addCarrinho(${p.id}, "base")'><i class="fa fa-cart-plus"></i></button>
          <button onclick='removerFavorito(${p.id})'><i class="fa fa-trash"></i> Remover</button>
        </div>`;
    });
    if (favoritos.length === 0) content.innerHTML += "<p>Você não tem nenhum item favorito.</p>";
  }
}

// ----------------------------------------------------
// Funções do Carrinho (ATUALIZADAS)
// ----------------------------------------------------
function removerCarrinho(id, tipo) {
    // Encontra o índice do *primeiro* item que corresponde ao id e tipo
    const index = carrinho.findIndex(item => item.id === id && item.tipo === tipo);

    if (index > -1) {
        carrinho.splice(index, 1);
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        showToast("toastFavorito", "Item removido do carrinho!");
        showPage("carrinho");
    }
}

function finalizarPedido() {
    showToast("toastCarrinho", "Pedido finalizado com sucesso! 🌷");
    carrinho = [];
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    showPage("home");
}

// ----------------------------------------------------
// Funções do Perfil
// ----------------------------------------------------
function salvarPerfil() {
    const novoEmail = document.getElementById('perfilEmail').value;
    if (novoEmail.trim()) {
        usuario.email = novoEmail;
        localStorage.setItem("usuario", JSON.stringify(usuario));
        showToast("toastCarrinho", "Email atualizado com sucesso!");
        showPage("config");
    } else {
        showToast("toastFavorito", "O email não pode estar vazio.");
    }
}

function salvarFoto() {
    const novaFoto = document.getElementById('perfilFoto').value;
    usuario.foto = novaFoto;
    localStorage.setItem("usuario", JSON.stringify(usuario));
    showToast("toastCarrinho", "Foto de perfil atualizada!");
    showPage("config");
}

// ----------------------------------------------------
// Funções do Admin
// ----------------------------------------------------
function editarProduto(id) {
    let p = produtos.find(x => x.id === id);
    const novoPreco = prompt(`Editar preço de ${p.nome}. Novo preço:`, p.preco);
    if (novoPreco !== null && !isNaN(parseFloat(novoPreco))) {
        p.preco = parseFloat(novoPreco);
        // Também poderia editar o estoque aqui
        showToast("toastCarrinho", `${p.nome} atualizado!`);
        showPage("admin");
    }
}

function excluirProduto(id) {
    if (confirm("Tem certeza que deseja EXCLUIR este produto?")) {
        produtos = produtos.filter(p => p.id !== id);
        showToast("toastFavorito", "Produto excluído!");
        showPage("admin");
    }
}

function abrirModalAdicionarProduto() {
    showToast("toastFavorito", "Função em desenvolvimento!");
}

// ----------------------------------------------------
// Funções de Comentário, Login e Outras
// ----------------------------------------------------

// ====================================================
// FUNÇÃO ABRIR PRODUTO (MODAL) - TOTALMENTE REFEITA
// ====================================================
function abrirProduto(id) {
  let p = produtos.find(x => x.id === id);
  const d = document.getElementById("detalhesProduto");
  const modal = document.getElementById("modalProduto");

  // --- Lógica de Estoque ---
  let statusEstoque = "";
  let statusClass = "";
  let desabilitado = false;

  if (p.estoque === 0) {
      statusEstoque = "Fora de estoque";
      statusClass = "out-of-stock";
      desabilitado = true;
  } else if (p.estoque < 10) {
      statusEstoque = `Últimas ${p.estoque} unidades!`;
      statusClass = "low-stock";
  } else {
      statusEstoque = "Em estoque";
      statusClass = "in-stock";
  }
  const disabledAttr = desabilitado ? "disabled" : "";

  // --- Lógica de Comentários ---
  const comentariosHTML = p.comentarios.length > 0
    ? p.comentarios.map(c => `<p class="comment-item"><strong>${c.usuario}:</strong> ${c.texto}</p>`).join("")
    : "<p>Seja o primeiro a comentar!</p>";

  // --- Lógica de Sugestões ---
  let sugestoesHTML = "";
  if (p.sugestoes && p.sugestoes.length > 0) {
      sugestoesHTML = p.sugestoes.map(sugestaoId => {
          const s = produtos.find(x => x.id === sugestaoId);
          if (!s) return "";
          return `
            <div class="suggestion-item" onclick="abrirProduto(${s.id})">
              <img src="${s.imagem}" alt="${s.nome}">
              <div class="suggestion-details">
                <strong>${s.nome}</strong>
                <span>R$${s.preco.toFixed(2)}</span>
              </div>
            </div>
          `;
      }).join("");
  }

  // --- Renderização do HTML do Modal ---
  d.innerHTML = `
    <div class="modal-produto-grid">
      <div class="modal-produto-col-img">
        <img src='${p.imagem}' alt='${p.nome}'>
      </div>
      <div class="modal-produto-col-info">
        <h2>${p.nome}</h2>
        <p class="modal-descricao">${p.descricao}</p>
        
        <ul class="product-details-list">
          <li class="detail-item"><strong>Vendedor:</strong> ${p.vendedor}</li>
          <li class="detail-item"><strong>Entrega:</strong> ${p.entrega}</li>
        </ul>

        <p class="stock-status ${statusClass}">${statusEstoque}</p>

        <div class="purchase-options">
          <div class="option-box">
            <div class="option-box-info">
              <strong>${p.nome}</strong>
              <span class="option-price">R$${p.preco.toFixed(2)}</span>
            </div>
            <button class="add-to-cart-option-btn" onclick="addCarrinho(${p.id}, 'base'); fecharModal();" ${disabledAttr}>
              Adicionar
            </button>
          </div>
          
          <div class="option-box">
            <div class="option-box-info">
              <strong>${p.nome} + ${p.nomeCombo}</strong>
              <span class="option-price">R$${p.precoCombo.toFixed(2)}</span>
            </div>
            <button class="add-to-cart-option-btn" onclick="addCarrinho(${p.id}, 'combo'); fecharModal();" ${disabledAttr}>
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-produto-secoes">
      <div class="modal-secao">
        <h3>Você pode gostar</h3>
        <div class="suggestions-container">
          ${sugestoesHTML}
        </div>
      </div>
      
      <div class="modal-secao">
        <h3>Comentários</h3>
        <div class="comentarios-lista">
          ${comentariosHTML}
        </div>
        <textarea id='novoComentario' placeholder='Escreva um comentário'></textarea>
        <button onclick='addComentario(${id})' class="comment-btn">Enviar</button>
      </div>
    </div>
  `;
  
  modal.classList.remove("hidden");
}


function fecharModal() { document.getElementById("modalProduto").classList.add("hidden"); }

function addComentario(id) {
  let c = document.getElementById("novoComentario").value;
  if (c.trim() && usuario) {
    const comentario = { usuario: usuario.nome, texto: c };
    produtos.find(p => p.id === id).comentarios.push(comentario);
    abrirProduto(id); // Re-renderiza o modal para mostrar o novo comentário
  } else if (!usuario) {
    showToast("toastFavorito", "Você precisa estar logado para comentar!");
  }
}

// FUNÇÃO ADDCARRINHO (ATUALIZADA)
function addCarrinho(id, tipo = 'base') {
  const p = produtos.find(x => x.id === id);
  if (!p) return;

  // Verifica o estoque
  const itemsInCart = carrinho.filter(item => item.id === id && item.tipo === tipo).length;
  if (p.estoque === 0) {
      showToast("toastFavorito", `${p.nome} está fora de estoque.`);
      return;
  }
  if (itemsInCart >= p.estoque) {
    showToast("toastFavorito", `Limite de estoque para "${p.nome}" atingido!`);
    return;
  }
  
  // Adiciona o objeto ao carrinho
  carrinho.push({ id, tipo });
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  
  let msg = tipo === 'combo' ? `${p.nome} (c/ ${p.nomeCombo})` : p.nome;
  showToast("toastCarrinho", `"${msg}" adicionado ao carrinho!`);
}


function addFavorito(id) {
  if (!favoritos.includes(id)) favoritos.push(id);
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  showToast("toastFavorito", "Adicionado aos favoritos!");
}

function removerFavorito(id) {
    favoritos = favoritos.filter(itemId => itemId !== id);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    showToast("toastFavorito", "Removido dos favoritos!");
    showPage("favoritos");
}

async function cadastrarUsuario() {
  const nome = document.getElementById("cadNome").value;
  const email = document.getElementById("cadEmail").value;
  const senha = document.getElementById("cadSenha").value;
  const conf = document.getElementById("cadConfSenha").value;

  if (!nome || !email || !senha || !conf) return showToast("toastFavorito", "Preencha todos os campos!");
  if (senha !== conf) return showToast("toastFavorito", "Senhas não coincidem!");

  const senhaHash = await hash(senha);
  const novoUsuario = { nome, email, senha: senhaHash, foto: null };
  localStorage.setItem("usuario", JSON.stringify(novoUsuario));
  usuario = novoUsuario;
  showToast("toastCarrinho", "Cadastro realizado com sucesso!");
  showPage("home");
}

async function fazerLogin() {
  const nome = document.getElementById("loginNome").value;
  const senha = document.getElementById("loginSenha").value;
  
  if (nome === "admin" && senha === "verde123") {
    usuario = { nome: "admin", email: "admin@lojaverde.com", foto: 'https://i.pravatar.cc/150?img=4' };
    localStorage.setItem("usuario", JSON.stringify(usuario));
    showPage("admin");
    return;
  }
  
  const senhaHash = await hash(senha);
  const salvo = JSON.parse(localStorage.getItem("usuario"));
  if (salvo && salvo.nome === nome && salvo.senha === senhaHash) {
    usuario = salvo;
    showPage("home");
  } else {
    showToast("toastFavorito", "Usuário ou senha incorretos!");
  }
}

function logout() {
  localStorage.removeItem("usuario");
  usuario = null;
  carrinho = []; // Limpa o carrinho local
  favoritos = []; // Limpa favoritos local
  showToast("toastCarrinho", "Você saiu com sucesso."); 
  showPage("login"); 
}

function enviarAtendimento() {
  const msg = document.getElementById("msgAtendimento").value;
  if (msg.trim()) {
    showToast("toastCarrinho", "Mensagem enviada! 🌿");
    document.getElementById("msgAtendimento").value = "";
    showPage("atendimento");
  }
}

window.onload = () => showPage(usuario ? "home" : "login");
