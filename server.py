"""
=============================================================================
LOJA VERDE — BACKEND EM PYTHON (FLASK + SQLITE + SEGURANÇA E-MAIL + COMERCIANTES)
=============================================================================
"""

import os
import sqlite3
import hashlib
import secrets
import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Diretório base
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# O frontend pode estar na mesma pasta ou na subpasta
FRONTEND_DIR = os.path.join(BASE_DIR, "Loja-Verde---Flores-e-Jardim-main") if os.path.exists(os.path.join(BASE_DIR, "Loja-Verde---Flores-e-Jardim-main", "index.html")) else BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "database", "loja_verde.db")

# Garante existência da pasta database
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# =============================================================================
# BANCO DE DADOS SQLITE (SQL PURO)
# =============================================================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa as tabelas SQL com integridade referencial e dados semente."""
    conn = get_db()
    cursor = conn.cursor()

    # 1. Tabela de Visitantes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS visitantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            user_agent TEXT,
            pagina TEXT,
            data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
            visitas_acumuladas INTEGER DEFAULT 1
        );
    """)

    # 2. Tabela de Usuários com Identificação e Verificação de E-mail
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            codigo_verificacao TEXT,
            email_verificado INTEGER DEFAULT 0,
            token_sessao TEXT,
            role TEXT DEFAULT 'cliente',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 3. Tabela de Plantas & Produtos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS plantas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            categoria TEXT NOT NULL,
            subcategoria TEXT,
            preco REAL NOT NULL,
            preco_original REAL,
            estoque INTEGER DEFAULT 20,
            imagem TEXT NOT NULL,
            descricao TEXT,
            luz TEXT,
            agua TEXT,
            dificuldade TEXT,
            tamanho TEXT,
            pet_friendly INTEGER DEFAULT 1,
            selo TEXT,
            nome_combo TEXT,
            preco_combo REAL,
            vendidos INTEGER DEFAULT 0,
            avaliacoes REAL DEFAULT 4.9,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 4. Tabela de Comerciantes & Parceiros (B2B / Atacado)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS comerciantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_negocio TEXT NOT NULL,
            contato_nome TEXT NOT NULL,
            email TEXT NOT NULL,
            whatsapp TEXT NOT NULL,
            cnpj_cpf TEXT,
            tipo_negocio TEXT,
            cupom_gerado TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'ativo',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 5. Tabela de Promoções Exclusivas para Comerciantes
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS promocoes_comerciantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            cupom TEXT NOT NULL,
            desconto_pct INTEGER NOT NULL,
            minimo_unidades INTEGER DEFAULT 10,
            valido_ate TEXT,
            ativo INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # 6. Tabela de Pedidos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            cliente_nome TEXT NOT NULL,
            whatsapp TEXT,
            itens_json TEXT NOT NULL,
            subtotal REAL NOT NULL,
            desconto REAL DEFAULT 0,
            frete REAL DEFAULT 0,
            total REAL NOT NULL,
            metodo_pagamento TEXT,
            data_entrega TEXT,
            mensagem_cartao TEXT,
            status TEXT DEFAULT 'recebido_whatsapp',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        );
    """)

    conn.commit()

    # Inserção de dados padrão de comerciantes se tabela estiver vazia
    cursor.execute("SELECT COUNT(*) AS total FROM promocoes_comerciantes")
    if cursor.fetchone()["total"] == 0:
        promocoes = [
            ("Lote Restaurante — Ervas e Temperos", "Caixa com 20 mudas selecionadas (Manjericão, Alecrim, Hortelã)", "REVENDAVERDE25", 25, 20, "2026-12-31"),
            ("Lote Condomínios & Escritórios", "Plantas purificadoras de ar em vasos (Zamioculcas, Jibóias, Espadas)", "VERDECORP30", 30, 15, "2026-12-31"),
            ("Especial Floriculturas — Finados & Eventos", "Caixas com Crisântemos e Kalanchoes com selo anti-dengue", "ATACADOFINADOS", 35, 30, "2026-11-02")
        ]
        cursor.executemany("""
            INSERT INTO promocoes_comerciantes (titulo, descricao, cupom, desconto_pct, minimo_unidades, valido_ate)
            VALUES (?, ?, ?, ?, ?, ?)
        """, promocoes)
        conn.commit()

    conn.close()

# Inicializa o banco ao carregar
init_db()

# =============================================================================
# UTILITÁRIOS DE CRIPTOGRAFIA & SEGURANÇA
# =============================================================================
def gerar_hash_senha(senha: str, salt: str = None):
    if not salt:
        salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((senha + salt).encode('utf-8'))
    return hash_obj.hexdigest(), salt

def gerar_codigo_otp():
    """Gera um código de verificação numérico de 6 dígitos."""
    return f"{secrets.randbelow(900000) + 100000}"

# =============================================================================
# ROTAS DA API REST: RASTREIO DE VISITANTES
# =============================================================================
@app.route("/api/visitante/rastrear", methods=["POST"])
def rastrear_visitante():
    dados = request.get_json(silent=True) or {}
    ip = request.remote_addr or request.headers.get("X-Forwarded-For", "127.0.0.1")
    user_agent = request.headers.get("User-Agent", "Desconhecido")
    pagina = dados.get("pagina", "home")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, visitas_acumuladas FROM visitantes WHERE ip = ? LIMIT 1", (ip,))
    existente = cursor.fetchone()

    if existente:
        nova_visita = existente["visitas_acumuladas"] + 1
        cursor.execute("UPDATE visitantes SET visitas_acumuladas = ?, data_hora = CURRENT_TIMESTAMP, pagina = ? WHERE id = ?",
                       (nova_visita, pagina, existente["id"]))
    else:
        nova_visita = 1
        cursor.execute("INSERT INTO visitantes (ip, user_agent, pagina, visitas_acumuladas) VALUES (?, ?, ?, 1)",
                       (ip, user_agent, pagina))

    conn.commit()
    conn.close()

    return jsonify({"sucesso": True, "ip": ip, "visitas": nova_visita})

# =============================================================================
# ROTAS DA API REST: AUTENTICAÇÃO COM IDENTIFICAÇÃO E VERIFICAÇÃO DE E-MAIL
# =============================================================================
@app.route("/api/auth/registrar", methods=["POST"])
def registrar_usuario():
    dados = request.get_json() or {}
    nome = dados.get("nome", "").strip()
    email = dados.get("email", "").strip().lower()
    senha = dados.get("senha", "").strip()

    if not nome or not email or not senha:
        return jsonify({"sucesso": False, "mensagem": "Nome, e-mail e senha são obrigatórios."}), 400

    if "@" not in email or "." not in email:
        return jsonify({"sucesso": False, "mensagem": "E-mail inválido."}), 400

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM usuarios WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"sucesso": False, "mensagem": "Este e-mail já está cadastrado."}), 409

    senha_hash, salt = gerar_hash_senha(senha)
    codigo_otp = gerar_codigo_otp()

    cursor.execute("""
        INSERT INTO usuarios (nome, email, senha_hash, salt, codigo_verificacao, email_verificado)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (nome, email, senha_hash, salt, codigo_otp))
    conn.commit()
    novo_id = cursor.lastrowid
    conn.close()

    # Simulação e retorno do código OTP para verificação no frontend
    return jsonify({
        "sucesso": True,
        "usuario_id": novo_id,
        "email": email,
        "mensagem": f"Código de verificação enviado para {email}.",
        "codigo_simulado": codigo_otp  # Permite validar direto na tela de demonstração
    })

@app.route("/api/auth/verificar-email", methods=["POST"])
def verificar_email():
    dados = request.get_json() or {}
    email = dados.get("email", "").strip().lower()
    codigo = dados.get("codigo", "").strip()

    if not email or not codigo:
        return jsonify({"sucesso": False, "mensagem": "E-mail e código são obrigatórios."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, codigo_verificacao FROM usuarios WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"sucesso": False, "mensagem": "Usuário não encontrado."}), 404

    if user["codigo_verificacao"] != codigo:
        conn.close()
        return jsonify({"sucesso": False, "mensagem": "Código de verificação incorreto."}), 400

    token_sessao = secrets.token_hex(24)
    cursor.execute("""
        UPDATE usuarios 
        SET email_verificado = 1, codigo_verificacao = NULL, token_sessao = ?
        WHERE id = ?
    """, (token_sessao, user["id"]))
    conn.commit()
    conn.close()

    return jsonify({
        "sucesso": True,
        "mensagem": "E-mail verificado com sucesso!",
        "token": token_sessao,
        "usuario": {
            "id": user["id"],
            "nome": user["nome"],
            "email": email,
            "email_verificado": True
        }
    })

@app.route("/api/auth/login", methods=["POST"])
def login_usuario():
    dados = request.get_json() or {}
    email = dados.get("email", "").strip().lower()
    senha = dados.get("senha", "").strip()

    if not email or not senha:
        return jsonify({"sucesso": False, "mensagem": "E-mail e senha são obrigatórios."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome, email, senha_hash, salt, email_verificado FROM usuarios WHERE email = ?", (email,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"sucesso": False, "mensagem": "E-mail ou senha incorretos."}), 401

    senha_hash, _ = gerar_hash_senha(senha, user["salt"])
    if senha_hash != user["senha_hash"]:
        conn.close()
        return jsonify({"sucesso": False, "mensagem": "E-mail ou senha incorretos."}), 401

    token_sessao = secrets.token_hex(24)
    cursor.execute("UPDATE usuarios SET token_sessao = ? WHERE id = ?", (token_sessao, user["id"]))
    conn.commit()
    conn.close()

    return jsonify({
        "sucesso": True,
        "token": token_sessao,
        "usuario": {
            "id": user["id"],
            "nome": user["nome"],
            "email": user["email"],
            "email_verificado": bool(user["email_verificado"])
        }
    })

# =============================================================================
# ROTAS DA API REST: PORTAL DO COMERCIANTE & GRUPO DE VENDAS
# =============================================================================
@app.route("/api/comerciantes/cadastro", methods=["POST"])
def cadastrar_comerciante():
    dados = request.get_json() or {}
    nome_negocio = dados.get("nome_negocio", "").strip()
    contato_nome = dados.get("contato_nome", "").strip()
    email = dados.get("email", "").strip().lower()
    whatsapp = dados.get("whatsapp", "").strip()
    cnpj_cpf = dados.get("cnpj_cpf", "").strip()
    tipo_negocio = dados.get("tipo_negocio", "Restaurante / Cafeteria")

    if not nome_negocio or not contato_nome or not whatsapp or not email:
        return jsonify({"sucesso": False, "mensagem": "Preencha todos os campos obrigatórios."}), 400

    # Gera cupom único de atacado baseado no nome e hash
    sufixo = secrets.token_hex(2).upper()
    cupom_gerado = f"PARCEIRO20-{sufixo}"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO comerciantes (nome_negocio, contato_nome, email, whatsapp, cnpj_cpf, tipo_negocio, cupom_gerado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (nome_negocio, contato_nome, email, whatsapp, cnpj_cpf, tipo_negocio, cupom_gerado))
    conn.commit()
    comerciante_id = cursor.lastrowid
    conn.close()

    link_grupo_whatsapp = f"https://wa.me/5511999999999?text={secrets.token_hex(4)}" # Link configurável

    return jsonify({
        "sucesso": True,
        "mensagem": "Comerciante cadastrado com sucesso!",
        "comerciante_id": comerciante_id,
        "cupom_gerado": cupom_gerado,
        "link_grupo_whatsapp": "https://chat.whatsapp.com/exemplo-grupo-vip-loja-verde"
    })

@app.route("/api/comerciantes/promocoes", methods=["GET"])
def listar_promocoes_comerciantes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, titulo, descricao, cupom, desconto_pct, minimo_unidades, valido_ate
        FROM promocoes_comerciantes
        WHERE ativo = 1
        ORDER BY desconto_pct DESC
    """)
    promocoes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"sucesso": True, "promocoes": promocoes})

# =============================================================================
# SERVIR ARQUIVOS ESTÁTICOS DO SITE
# =============================================================================
@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    if os.path.exists(os.path.join(FRONTEND_DIR, filename)):
        return send_from_directory(FRONTEND_DIR, filename)
    elif os.path.exists(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    return send_from_directory(FRONTEND_DIR, "index.html")

# =============================================================================
# INICIALIZAÇÃO DO SERVIDOR
# =============================================================================
if __name__ == "__main__":
    print(f"🌿 Loja Verde Python Backend iniciado!")
    print(f"📦 Banco de Dados SQL: {DB_PATH}")
    print(f"🌐 Servindo Frontend de: {FRONTEND_DIR}")
    print(f"🚀 Acesse: http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
