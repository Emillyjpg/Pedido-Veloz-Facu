const request = require('supertest');

// Mock dependencies
jest.mock('../src/tracing', () => {});
jest.mock('prom-client', () => ({
  register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
  collectDefaultMetrics: jest.fn(),
}));

const mockQuery = jest.fn();
jest.mock('../src/db', () => ({
  query: (...args) => mockQuery(...args),
  on: jest.fn(),
}));

const app = require('../src/index');

describe('Pedidos Service', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /ready', () => {
    it('should return ready when DB is available', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ready');
    });

    it('should return 503 when DB is unavailable', async () => {
      mockQuery.mockRejectedValueOnce(new Error('connection refused'));
      const res = await request(app).get('/ready');
      expect(res.status).toBe(503);
    });
  });

  describe('GET /api/pedidos', () => {
    it('should return list of pedidos', async () => {
      const mockPedidos = [
        { id: 1, cliente: 'João', status: 'pendente' },
        { id: 2, cliente: 'Maria', status: 'pago' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPedidos });

      const res = await request(app).get('/api/pedidos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPedidos);
    });
  });

  describe('POST /api/pedidos', () => {
    it('should create a new pedido', async () => {
      const newPedido = { cliente: 'João', itens: [{ produto: 'Pizza', qty: 2 }], valor_total: 59.90 };
      const created = { id: 1, ...newPedido, status: 'pendente' };
      mockQuery.mockResolvedValueOnce({ rows: [created] });

      const res = await request(app).post('/api/pedidos').send(newPedido);
      expect(res.status).toBe(201);
      expect(res.body.cliente).toBe('João');
    });

    it('should return 400 when missing fields', async () => {
      const res = await request(app).post('/api/pedidos').send({ cliente: 'João' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/pedidos/:id/status', () => {
    it('should update pedido status', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'pago' }] });
      const res = await request(app).patch('/api/pedidos/1/status').send({ status: 'pago' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pago');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app).patch('/api/pedidos/1/status').send({ status: 'invalido' });
      expect(res.status).toBe(400);
    });

    it('should return 404 when pedido not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).patch('/api/pedidos/999/status').send({ status: 'pago' });
      expect(res.status).toBe(404);
    });
  });
});
