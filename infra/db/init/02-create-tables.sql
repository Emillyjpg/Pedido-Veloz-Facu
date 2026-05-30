-- Pedidos DB
\c pedidos_db pedidos_user;

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente VARCHAR(255) NOT NULL,
  itens JSONB NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente);

-- Pagamentos DB
\c pagamentos_db pagamentos_user;

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL,
  metodo VARCHAR(50) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'processando',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);

-- Estoque DB
\c estoque_db estoque_user;

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  preco DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_produtos_sku ON produtos(sku);
