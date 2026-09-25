PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    endereco TEXT,
    senha TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    preco REAL NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    imagem TEXT,
    ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_pedido TEXT DEFAULT CURRENT_TIMESTAMP,
    valor_total REAL NOT NULL,
    status TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    data_entrega TEXT NOT NULL,
    horario_inicio TEXT NOT NULL,
    horario_fim TEXT NOT NULL,
    status TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    forma_pagamento TEXT NOT NULL,
    valor REAL NOT NULL,
    status TEXT,
    data_pagamento TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario
ON pedidos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido
ON itens_pedido(pedido_id);

CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto
ON itens_pedido(produto_id);

CREATE INDEX IF NOT EXISTS idx_agendamentos_pedido
ON agendamentos(pedido_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido
ON pagamentos(pedido_id);
