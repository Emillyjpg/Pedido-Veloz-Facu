require('./tracing');

const express = require('express');
const pinoHttp = require('pino-http');
const { register, collectDefaultMetrics } = require('prom-client');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3002;

collectDefaultMetrics({ prefix: 'pagamentos_' });

app.use(express.json());
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));

// Health checks
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'pagamentos' }));
app.get('/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', service: 'pagamentos' });
  } catch (err) {
    res.status(503).json({ status: 'unavailable', error: err.message });
  }
});

// Metrics
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Pagamentos
app.post('/api/pagamentos', async (req, res) => {
  const { pedido_id, metodo, valor } = req.body;
  if (!pedido_id || !metodo || !valor) {
    return res.status(400).json({ error: 'Campos obrigatórios: pedido_id, metodo, valor' });
  }
  const validMethods = ['pix', 'cartao_credito', 'cartao_debito', 'boleto'];
  if (!validMethods.includes(metodo)) {
    return res.status(400).json({ error: `Método inválido. Válidos: ${validMethods.join(', ')}` });
  }
  const { rows } = await pool.query(
    'INSERT INTO pagamentos (pedido_id, metodo, valor, status) VALUES ($1, $2, $3, $4) RETURNING *',
    [pedido_id, metodo, valor, 'processando']
  );
  res.status(201).json(rows[0]);
});

app.get('/api/pagamentos/:pedido_id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM pagamentos WHERE pedido_id = $1 ORDER BY created_at DESC',
    [req.params.pedido_id]
  );
  res.json(rows);
});

app.patch('/api/pagamentos/:id/confirmar', async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE pagamentos SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    ['aprovado', req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Pagamento não encontrado' });
  res.json(rows[0]);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 pagamentos service listening on port ${PORT}`);
  });
}

module.exports = app;
