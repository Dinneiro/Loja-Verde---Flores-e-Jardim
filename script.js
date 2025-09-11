let produtos = [
  { id: 1, nome: "Samambaia", imagem: "https://source.unsplash.com/200x150/?fern", vendedor: "João", comentarios: [], preco: 25 },
  { id: 2, nome: "Cacto", imagem: "https://source.unsplash.com/200x150/?cactus", vendedor: "Maria", comentarios: [], preco: 15 },
  { id: 3, nome: "Orquídea", imagem: "https://source.unsplash.com/200x150/?orchid", vendedor: "Ana", comentarios: [], preco: 40 },
  { id: 4, nome: "Adubo Orgânico", imagem: "https://source.unsplash.com/200x150/?fertilizer", vendedor: "Carlos", comentarios: [], preco: 30 },
  { id: 5, nome: "Rosas Vermelhas", imagem: "https://source.unsplash.com/200x150/?rose", vendedor: "Clara", comentarios: [], preco: 50 },
  { id: 6, nome: "Mudas de Laranja", imagem: "https://source.unsplash.com/200x150/?orange-tree", vendedor: "Paulo", comentarios: [], preco: 70 }
];

let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let usuario = localStorage.getItem("usuario") || null;
let usuarioData = JSON.parse(localStorage.getItem("usuarioData")) || null;

function showPage(page) {
  let content = document.getElementById("content");

  if (!usuario && page !== "login") { showPage("login"); return; }

  if (page === "home") {
    content.innerHTML = "<h2>Produtos</h2><div class='grid'></div>";
    let grid = content.querySelector(".grid");
    produtos.forEach(p => {
      grid.innerHTML += `
        <div class='product'>
          <img src="${p.imagem}" alt="${p.nome}"><br>
          <strong>${p.nome}</strong> - R$${p.preco}<br>
          Vendedor: ${p.vendedor}<br>
          <button class='add' onclick='abrirProduto(${p.id})'>Ver Produto</button>
          <button onclick='addCarrinho(${p.id})'><i class="fa fa-cart-plus"></i></button>
          <button onclick='addFavorito(${p.id})'><i class="fa fa-heart"></i></button>
        </div>
      `;
    });
  } else if (page === "carrinho") {
    content.innerHTML = "<h2>Carrinho</h2>";
    carrinho.forEach(id => {
      let p = produtos.find(x => x.id === id);
      content.innerHTML += `<div>${p.nome} - R$${p.preco}</div>`;
    });
  } else if (page === "favoritos") {
    content.innerHTML = "<h2>Favoritos</h2>";
    favoritos.forEach(id => {
      let p = produtos.find(x => x.id === id);
      content.innerHTML += `<div>${p.nome} - R$${p.preco}</div>`;
    });
  } else if (page === "config") {
    content.innerHTML = `
      <h2>Configurações</h2>
      <button onclick="toggleTheme()">Trocar Tema</button>
      <h3>Perfil</h3>
      ${usuarioData ? `
        <p><strong>Nome:</strong> ${usuarioData.nome}</p>
        <p><strong>Email:</strong> ${usuarioData.email}</p>
        <p><strong>CPF:</strong> ${usuarioData.cpf}</p>
        <p><strong>Celular:</strong> ${usuarioData.celular}</p>
        <p><strong>Telefone:</strong> ${usuarioData.telefone}</p>
        <p><strong>Endereço:</strong> ${usuarioData.endereco}</p>
      ` : "<p>Nenhum perfil encontrado</p>"}
    `;
  } else if (page === "atendimento") {
    content.innerHTML = `
      <h2>Central de Atendimento</h2>
      <p>Envie sua dúvida ou sugestão:</p>
      <textarea id='msgAtendimento' placeholder='Escreva aqui'></textarea><br>
      <button onclick='enviarAtendimento()'>Enviar</button>
    `;
  } else if (page === "login") {
    if (usuario) {
      content.innerHTML = `<h2>Bem-vindo, ${usuario}</h2><button onclick='logout()'>Sair</button>`;
    } else {
      content.innerHTML = `
        <h2>Login</h2>
        <input id='nomeUser' placeholder='Nome'><br>
        <button onclick='login()'>Entrar</button>
        <div id="cadastroUsuario" style="margin-top:1rem;">
          <h3>Cadastrar Novo Usuário</h3>
          <input id='nomeCompleto' placeholder='Nome completo'><br>
          <input id='cpf' placeholder='CPF'><br>
          <input id='email' placeholder='Email'><br>
          <input id='celular' placeholder='Celular'><br>
          <input id='telefone' placeholder='Telefone fixo'><br>
          <input id='endereco' placeholder='Endereço'><br>
          <button onclick='cadastrarUsuario()'>Cadastrar</button>
        </div>
      `;
    }
  }
}

// Função Toast
function showToast(elementId, message) {
  const toast = document.getElementById(elementId);
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

function addCarrinho(id) {
  carrinho.push(id);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  showToast("toastCarrinho", "Adicionado ao Carrinho!");
}

function addFavorito(id) {
  if (!favoritos.includes(id)) favoritos.push(id);
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  showToast("toastFavorito", "Adicionado aos Favoritos!");
}

function abrirProduto(id) {
  let produto = produtos.find(p => p.id === id);
  let detalhes = document.getElementById("detalhesProduto");
  detalhes.innerHTML = `
    <h2>${produto.nome}</h2>
    <img src="${produto.imagem}" width="200"><br>
    Vendedor: ${produto.vendedor}<br>
    Preço: R$${produto.preco}<br>
    <h3>Comentários</h3>
    <div id='listaComentarios'>${produto.comentarios.map(c => `<p>${c}</p>`).join("")}</div>
    <textarea id='novoComentario' placeholder='Escreva um comentário'></textarea><br>
    <button onclick='addComentario(${id})'>Enviar</button>
  `;
  document.getElementById("modalProduto").classList.remove("hidden");
}

function fecharModal() { document.getElementById("modalProduto").classList.add("hidden"); }

function addComentario(id) {
  let comentario = document.getElementById("novoComentario").value;
  if (comentario.trim() !== "") {
    let produto = produtos.find(p => p.id === id);
    produto.comentarios.push(comentario);
    abrirProduto(id);
  }
}

function toggleTheme() { document.body.classList.toggle("dark-theme"); }

function login() {
  let nome = document.getElementById("nomeUser").value;
  if (nome.trim() !== "") {
    usuario = nome;
    localStorage.setItem("usuario", usuario);
    showPage("home");
  }
}

function cadastrarUsuario() {
  let nome = document.getElementById("nomeCompleto").value;
  let cpf = document.getElementById("cpf").value;
  let email = document.getElementById("email").value;
  let celular = document.getElementById("celular").value;
  let telefone = document.getElementById("telefone").value;
  let endereco = document.getElementById("endereco").value;

  if (!nome || !cpf || !email || !celular || !endereco) { alert("Preencha todos os campos!"); return; }

  usuarioData = { nome, cpf, email, celular, telefone, endereco, foto: null, produtos: [] };
  localStorage.setItem("usuarioData", JSON.stringify(usuarioData));
  usuario = nome;
  localStorage.setItem("usuario", usuario);
  showPage("home");
}

function logout() {
  usuario = null;
  usuarioData = null;
  localStorage.removeItem("usuario");
  localStorage.removeItem("usuarioData");
  showPage("login");
}

function enviarAtendimento() {
  let msg = document.getElementById("msgAtendimento").value;
  if (msg.trim()) { alert("Mensagem enviada: " + msg); document.getElementById("msgAtendimento").value = ""; }
}

window.onload = function () {
  if (!usuario) showPage("login"); else showPage("home");
};
