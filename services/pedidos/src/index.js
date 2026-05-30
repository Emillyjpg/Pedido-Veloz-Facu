require('./tracing');

const express = require('express');
const pinoHttp = require('pino-http');
const { register, collectDefaultMetrics } = require('prom-client');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

collectDefaultMetrics({ prefix: 'pedidos_' });

app.use(express.json());
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));

// Health checks
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'pedidos' }));
app.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', service: 'pedidos' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable', error: err.message });
  }
});

// Metrics
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// CRUD Pedidos
app.get('/api/pedidos', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM pedidos ORDER BY created_at DESC LIMIT 50');
  res.json(rows);
});

app.get('/api/pedidos/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(rows[0]);
});

app.post('/api/pedidos', async (req, res) => {
  const { cliente, itens, valor_total } = req.body;
  if (!cliente || !itens || !valor_total) {
    return res.status(400).json({ error: 'Campos obrigatórios: cliente, itens, valor_total' });
  }
  const { rows } = await pool.query(
    'INSERT INTO pedidos (cliente, itens, valor_total, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [cliente, JSON.stringify(itens), valor_total, 'pendente']
  );
  res.status(201).json(rows[0]);
});

app.patch('/api/pedidos/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pendente', 'pago', 'preparando', 'enviado', 'entregue', 'cancelado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Válidos: ${validStatuses.join(', ')}` });
  }
  const { rows } = await pool.query(
    'UPDATE pedidos SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(rows[0]);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 pedidos service listening on port ${PORT}`);
  });
}

module.exports = app;
