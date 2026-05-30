require('./tracing');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { register, collectDefaultMetrics } = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

collectDefaultMetrics({ prefix: 'gateway_' });

app.use(helmet());
app.use(cors());
app.use(pinoHttp({ level: process.env.LOG_LEVEL || 'info' }));
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

// Health checks
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));
app.get('/ready', (_req, res) => res.json({ status: 'ready', service: 'api-gateway' }));

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Proxy routes
const PEDIDOS_URL = process.env.PEDIDOS_SERVICE_URL || 'http://pedidos:3001';
const PAGAMENTOS_URL = process.env.PAGAMENTOS_SERVICE_URL || 'http://pagamentos:3002';
const ESTOQUE_URL = process.env.ESTOQUE_SERVICE_URL || 'http://estoque:3003';

app.use(createProxyMiddleware({
  target: PEDIDOS_URL,
  changeOrigin: true,
  pathFilter: '/api/pedidos',
}));
app.use(createProxyMiddleware({
  target: PAGAMENTOS_URL,
  changeOrigin: true,
  pathFilter: '/api/pagamentos',
}));
app.use(createProxyMiddleware({
  target: ESTOQUE_URL,
  changeOrigin: true,
  pathFilter: '/api/estoque',
}));

app.listen(PORT, () => {
  console.log(`🚀 api-gateway listening on port ${PORT}`);
});

module.exports = app;
