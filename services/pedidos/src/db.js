const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'pedidos_db',
  user: process.env.DB_USER || 'pedidos_user',
  password: process.env.DB_PASSWORD || 'pedidos_pass',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected pool error', err);
});

module.exports = pool;
