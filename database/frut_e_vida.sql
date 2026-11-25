

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT,
    telefone TEXT,
    cep TEXT,
    endereco TEXT,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'cliente',
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT,
    unidade TEXT,
    emoji TEXT,
    destaque INTEGER NOT NULL DEFAULT 0,
    preco REAL NOT NULL,
    preco_antigo REAL,
    estoque INTEGER NOT NULL DEFAULT 0,
    imagem TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    data_pedido TEXT DEFAULT CURRENT_TIMESTAMP,
    subtotal REAL,
    frete REAL NOT NULL DEFAULT 0,
    desconto REAL NOT NULL DEFAULT 0,
    cupom TEXT,
    valor_total REAL NOT NULL,
    tipo_entrega TEXT NOT NULL DEFAULT 'padrao',
    endereco_entrega TEXT,
    status TEXT,
    origem_offline INTEGER NOT NULL DEFAULT 0,
    id_local TEXT UNIQUE,
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
    mp_referencia TEXT,
    mp_preferencia_id TEXT,
    mp_pagamento_id TEXT,
    link_pagamento TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Linha do tempo do pedido (cada mudança de etapa vira um registro).
CREATE TABLE IF NOT EXISTS rastreamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    descricao TEXT,
    data TEXT NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

CREATE TABLE IF NOT EXISTS favoritos (
    usuario_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, produto_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

CREATE INDEX IF NOT EXISTS idx_rastreamento_pedido ON rastreamento(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto ON itens_pedido(produto_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_pedido ON agendamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos(pedido_id);