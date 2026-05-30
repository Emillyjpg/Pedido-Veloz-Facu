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

describe('Estoque Service', () => {
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

  describe('GET /api/estoque', () => {
    it('should return list of products', async () => {
      const products = [{ id: 1, nome: 'Pizza', sku: 'PIZ-001', quantidade: 50 }];
      mockQuery.mockResolvedValueOnce({ rows: products });

      const res = await request(app).get('/api/estoque');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(products);
    });
  });

  describe('POST /api/estoque', () => {
    it('should create a product', async () => {
      const product = { nome: 'Pizza', sku: 'PIZ-001', quantidade: 50, preco: 29.90 };
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, ...product }] });

      const res = await request(app).post('/api/estoque').send(product);
      expect(res.status).toBe(201);
      expect(res.body.nome).toBe('Pizza');
    });

    it('should return 400 when missing fields', async () => {
      const res = await request(app).post('/api/estoque').send({ nome: 'Pizza' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/estoque/:id/reservar', () => {
    it('should reserve stock', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, quantidade: 48 }] });
      const res = await request(app).patch('/api/estoque/1/reservar').send({ quantidade: 2 });
      expect(res.status).toBe(200);
      expect(res.body.quantidade).toBe(48);
    });

    it('should return 409 when insufficient stock', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const res = await request(app).patch('/api/estoque/1/reservar').send({ quantidade: 100 });
      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid quantity', async () => {
      const res = await request(app).patch('/api/estoque/1/reservar').send({ quantidade: -1 });
      expect(res.status).toBe(400);
    });
  });
});
