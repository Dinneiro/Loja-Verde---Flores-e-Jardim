# Loja Verde - Flores e Jardim 🌿

![License](https://img.shields.io/badge/license-MIT-green.svg) ![Status](https://img.shields.io/badge/status-em_desenvolvimento-yellow.svg)

Um projeto de e-commerce completo para uma floricultura, focado em um design delicado, responsivo e com todas as funcionalidades essenciais de uma loja virtual.

**[Acesse a demonstração ao vivo (Link desativado)]**

---

## Tabela de Conteúdos
* [Sobre o Projeto](#sobre-o-projeto)
* [Funcionalidades Principais](#funcionalidades-principais)
* [Tecnologias Utilizadas](#tecnologias-utilizadas)
* [Como Rodar o Projeto](#como-rodar-o-projeto)
* [Contato](#contato)

---

## 🌳 Sobre o Projeto

**Loja Verde** é uma simulação de site de e-commerce para venda de flores, plantas, adubos e produtos de jardinagem. O objetivo foi criar uma experiência de usuário agradável, com cores suaves e tipografia elegante, ao mesmo tempo que implementa uma lógica de front-end robusta para gerenciar sessões de usuário, carrinho de compras e estoque de produtos.

---

## 🚀 Funcionalidades Principais

O site possui um conjunto completo de funcionalidades de e-commerce:

### 🛍️ E-Commerce
* **Catálogo de Produtos:** Exibição dos produtos em formato de grade (grid).
* **Gestão de Estoque:** O sistema controla o estoque de cada item. Produtos com estoque baixo exibem um aviso ("Poucas unidades") e produtos fora de estoque não podem ser comprados.
* **Carrinho de Compras Avançado:** O carrinho é persistido no `localStorage` e é capaz de gerenciar variações de produtos.
* **Opções de Produto ("Combos"):** O usuário pode escolher entre comprar o produto "base" (ex: "Samambaia") ou um "combo" (ex: "Samambaia + Vaso de Cerâmica") com preço diferente.
* **Modal de Produto Detalhado:** Ao clicar em um item, um modal completo (inspirado na Amazon) é exibido, contendo:
    * Opções de compra (base vs. combo).
    * Status de estoque em tempo real.
    * Descrição, vendedor e tempo de entrega.
    * Sugestões de produtos ("Você pode gostar").
    * Seção de comentários.

### 👤 Funcionalidades de Usuário
* **Autenticação:** Sistema completo de Login e Cadastro de usuários. A sessão do usuário é persistida para que ele não precise logar novamente.
* **Segurança:** A senha do usuário é tratada com `hash` (SHA-256) antes de ser salva no `localStorage`.
* **Lista de Favoritos:** Usuários podem salvar seus produtos preferidos.
* **Perfil do Usuário:** Página para o usuário alterar seu e-mail e foto de perfil.

### 🔒 Painel de Administrador
* **Acesso Restrito:** Uma página de "Admin" é habilitada para o usuário com nome `admin`.
* **Visualização de Estoque:** O admin pode ver todos os produtos cadastrados e seu nível de estoque atual.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando apenas tecnologias web front-end.

* **HTML5:** Estrutura semântica do site.
* **CSS3:** Estilização completa, incluindo Variáveis Globais (`:root`), Grid/Flexbox e design responsivo (`@media`).
* **JavaScript (ES6+):** Toda a lógica do site, incluindo:
    * Manipulação do DOM.
    * `async/await` para a função de hash de senha.
    * Gerenciamento de estado (carrinho, favoritos, usuário).
* **Web APIs:**
    * **`localStorage`**: Usado para persistir o carrinho, a lista de favoritos e a sessão do usuário entre as visitas.
    * **`Crypto API`**: Usada para a função `crypto.subtle.digest` que gera o hash da senha.
* **Design & Fontes:**
    * **Google Fonts** (Great Vibes, Playfair Display, Lato).
    * **Font Awesome** (para ícones).

---

## ⚙️ Como Rodar o Projeto

O projeto não requer um *build* ou um servidor, pois é 100% front-end e usa `localStorage` para simular um banco de dados.

1.  Clone este repositório:
    ```bash
    git clone [https://github.com/seu-usuario/loja-verde.git](https://github.com/seu-usuario/loja-verde.git)
    ```

2.  Navegue até a pasta do projeto:
    ```bash
    cd loja-verde
    ```

3.  Abra o arquivo `index.html` diretamente no seu navegador de preferência (Google Chrome, Firefox, etc.).

O site estará totalmente funcional.

---

## 👤 Contato
Email: thiagosilvafx5@gmail.com
Desenvolvido por **Thiago Oliveira** - 2025
