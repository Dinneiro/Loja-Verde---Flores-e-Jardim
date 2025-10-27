// Produtos (Mantidos)
let produtos = [
  { id: 1, nome: "Samambaia", imagem: "https://source.unsplash.com/200x150/?fern", categoria: "condolencias", vendedor: "João", comentarios: [], preco: 25 },
  { id: 2, nome: "Cacto", imagem: "https://source.unsplash.com/200x150/?cactus", categoria: "aniversario", vendedor: "Maria", comentarios: [], preco: 15 },
  { id: 3, nome: "Orquídea", imagem: "https://source.unsplash.com/200x150/?orchid", categoria: "casamento", vendedor: "Ana", comentarios: [], preco: 40 },
  { id: 4, nome: "Rosas Vermelhas", imagem: "https://source.unsplash.com/200x150/?rose", categoria: "casamento", vendedor: "Clara", comentarios: [], preco: 50 },
  { id: 5, nome: "Girassol", imagem: "https://source.unsplash.com/200x150/?sunflower", categoria: "aniversario", vendedor: "Paulo", comentarios: [], preco: 35 }
];

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
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
  if (page === "home" || ["casamento", "aniversario", "condolencias"].includes(page)) {
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
          <button class='add' onclick='abrirProduto(${p.id})'>Ver</button>
          <button onclick='addCarrinho(${p.id})'><i class="fa fa-cart-plus"></i></button>
          <button onclick='addFavorito(${p.id})'><i class="fa fa-heart"></i></button>
        </div>`;
    });
  }

  else if (page === "carrinho") {
    let carrinhoAgrupado = {};
    carrinho.forEach(id => {
      carrinhoAgrupado[id] = (carrinhoAgrupado[id] || 0) + 1;
    });

    content.innerHTML = `
      <h2>Seu Carrinho de Compras</h2>
      <div class="carrinho-list"></div>
      <div class="carrinho-resumo"></div>
    `;

    const list = content.querySelector(".carrinho-list");
    const resumo = content.querySelector(".carrinho-resumo");
    let total = 0;

    for (const id in carrinhoAgrupado) {
      const p = produtos.find(x => x.id === parseInt(id));
      const quantidade = carrinhoAgrupado[id];
      const subtotal = p.preco * quantidade;
      total += subtotal;

      list.innerHTML += `
        <div class="carrinho-item">
          <img src="${p.imagem}" alt="${p.nome}" class="carrinho-img">
          <div class="carrinho-detalhes">
            <strong>${p.nome}</strong><br>
            <p>Preço Unitário: R$${p.preco}</p>
          </div>
          <div class="carrinho-acoes">
            <span class="carrinho-qtd">Qtd: ${quantidade}</span>
            <span class="carrinho-subtotal">R$${subtotal.toFixed(2)}</span>
            <button class="remove-btn" onclick='removerCarrinho(${p.id})'>
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
    const total = carrinho.reduce((sum, id) => sum + produtos.find(x => x.id === id).preco, 0);
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
            <strong>${p.nome}</strong> - R$${p.preco}
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
          <button onclick='addCarrinho(${p.id})'><i class="fa fa-cart-plus"></i></button>
          <button onclick='removerFavorito(${p.id})'><i class="fa fa-trash"></i> Remover</button>
        </div>`;
    });
    if (favoritos.length === 0) content.innerHTML += "<p>Você não tem nenhum item favorito.</p>";
  }
}

// ----------------------------------------------------
// Funções do Carrinho
// ----------------------------------------------------
function removerCarrinho(id) {
    const index = carrinho.indexOf(id);
    if (index > -1) {
        carrinho.splice(index, 1);
        localStorage.setItem("carrinho", JSON.stringify(carrinho));
        // MUDANÇA: 'alert' -> 'showToast' (usando o toast de aviso/erro)
        showToast("toastFavorito", "Item removido do carrinho!");
        showPage("carrinho");
    }
}

function finalizarPedido() {
    // MUDANÇA: 'alert' -> 'showToast' (usando o toast de sucesso)
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
        // MUDANÇA: 'alert' -> 'showToast' (usando o toast de erro)
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
    // Mantido 'prompt' pois é um pop-up de *entrada de dados*, não de *aviso*
    let p = produtos.find(x => x.id === id);
    const novoPreco = prompt(`Editar preço de ${p.nome}. Novo preço:`, p.preco);
    if (novoPreco !== null && !isNaN(parseFloat(novoPreco))) {
        p.preco = parseFloat(novoPreco);
        showToast("toastCarrinho", `${p.nome} atualizado!`);
        showPage("admin");
    }
}

function excluirProduto(id) {
    // Mantido 'confirm' pois é um pop-up de *confirmação*, não de *aviso*
    if (confirm("Tem certeza que deseja EXCLUIR este produto?")) {
        produtos = produtos.filter(p => p.id !== id);
        showToast("toastFavorito", "Produto excluído!");
        showPage("admin");
    }
}

function abrirModalAdicionarProduto() {
    // MUDANÇA: 'alert' -> 'showToast' (usando o toast de aviso)
    showToast("toastFavorito", "Função em desenvolvimento!");
}

// ----------------------------------------------------
// Funções de Comentário, Login e Outras
// ----------------------------------------------------
function abrirProduto(id) {
  let p = produtos.find(x => x.id === id);
  const d = document.getElementById("detalhesProduto");
  const comentariosHTML = p.comentarios.map(c => `<p><strong>${c.usuario}:</strong> ${c.texto}</p>`).join("");
  
  d.innerHTML = `
    <h2>${p.nome}</h2>
    <img src='${p.imagem}' width='200' alt='${p.nome}'><br>
    R$${p.preco}<br>
    <button onclick='addCarrinho(${p.id}); fecharModal();'>Adicionar ao Carrinho</button>
    <h3>Comentários</h3>
    ${comentariosHTML}
    <textarea id='novoComentario' placeholder='Escreva um comentário'></textarea><br>
    <button onclick='addComentario(${id})'>Enviar</button>`;
  document.getElementById("modalProduto").classList.remove("hidden");
}

function fecharModal() { document.getElementById("modalProduto").classList.add("hidden"); }

function addComentario(id) {
  let c = document.getElementById("novoComentario").value;
  if (c.trim() && usuario) {
    const comentario = { usuario: usuario.nome, texto: c };
    produtos.find(p => p.id === id).comentarios.push(comentario);
    document.getElementById("novoComentario").value = "";
    abrirProduto(id);
  } else if (!usuario) {
    // MUDANÇA: 'alert' -> 'showToast' (usando o toast de erro)
    showToast("toastFavorito", "Você precisa estar logado para comentar!");
  }
}

function addCarrinho(id) {
  carrinho.push(id);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  showToast("toastCarrinho", "Adicionado ao carrinho!");
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

  // MUDANÇA: 'alert' -> 'showToast'
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
    // MUDANÇA: 'alert' -> 'showToast'
    showToast("toastFavorito", "Usuário ou senha incorretos!");
  }
}

function logout() {
  localStorage.removeItem("usuario");
  usuario = null;
  showToast("toastCarrinho", "Você saiu com sucesso."); // Pop-up de logout
  showPage("login"); 
}

function enviarAtendimento() {
  const msg = document.getElementById("msgAtendimento").value;
  if (msg.trim()) {
    // MUDANÇA: 'alert' -> 'showToast'
    showToast("toastCarrinho", "Mensagem enviada! 🌿");
    document.getElementById("msgAtendimento").value = "";
    showPage("atendimento");
  }
}

window.onload = () => showPage(usuario ? "home" : "login");
