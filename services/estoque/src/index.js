require('./tracing');

const express = require('express');
const pinoHttp = require('pino-http');
const { register, collectDefaultMetrics } = require('prom-client');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3003;

collectDefaultMetrics({ prefix: 'estoque_' });

app.use(express.json());
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));

// Health checks
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'estoque' }));
app.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', service: 'estoque' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable', error: err.message });
  }
});

// Metrics
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Estoque
app.get('/api/estoque', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM produtos ORDER BY nome');
  res.json(rows);
});

app.get('/api/estoque/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM produtos WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(rows[0]);
});

app.post('/api/estoque', async (req, res) => {
  const { nome, sku, quantidade, preco } = req.body;
  if (!nome || !sku || quantidade == null || !preco) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, sku, quantidade, preco' });
  }
  const { rows } = await pool.query(
    'INSERT INTO produtos (nome, sku, quantidade, preco) VALUES ($1, $2, $3, $4) RETURNING *',
    [nome, sku, quantidade, preco]
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/estoque/:id/reservar', async (req, res) => {
  const { quantidade } = req.body;
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ error: 'Quantidade deve ser positiva' });
  }
  const { rows } = await pool.query(
    'UPDATE produtos SET quantidade = quantidade - $1, updated_at = NOW() WHERE id = $2 AND quantidade >= $1 RETURNING *',
    [quantidade, req.params.id]
  );
  if (rows.length === 0) return res.status(409).json({ error: 'Estoque insuficiente ou produto não encontrado' });
  res.json(rows[0]);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 estoque service listening on port ${PORT}`);
  });
}

module.exports = app;
