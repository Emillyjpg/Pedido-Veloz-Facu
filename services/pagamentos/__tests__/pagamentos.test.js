const request = require('supertest');

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

describe('Pagamentos Service', () => {
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

  describe('POST /api/pagamentos', () => {
    it('should create a payment', async () => {
      const payment = { pedido_id: 1, metodo: 'pix', valor: 59.90 };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, ...payment, status: 'processando' }] });

      const res = await request(app).post('/api/pagamentos').send(payment);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('processando');
    });

    it('should return 400 for invalid method', async () => {
      const res = await request(app).post('/api/pagamentos').send({
        pedido_id: 1, metodo: 'bitcoin', valor: 100,
      });
      expect(res.status).toBe(400);
    });

    it('should return 400 when missing fields', async () => {
      const res = await request(app).post('/api/pagamentos').send({ pedido_id: 1 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/pagamentos/:pedido_id', () => {
    it('should return payments for a pedido', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, pedido_id: 1, status: 'aprovado' }] });
      const res = await request(app).get('/api/pagamentos/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('PATCH /api/pagamentos/:id/confirmar', () => {
    it('should confirm a payment', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'aprovado' }] });
      const res = await request(app).patch('/api/pagamentos/1/confirmar');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('aprovado');
    });

    it('should return 404 when payment not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).patch('/api/pagamentos/999/confirmar');
      expect(res.status).toBe(404);
    });
  });
});
