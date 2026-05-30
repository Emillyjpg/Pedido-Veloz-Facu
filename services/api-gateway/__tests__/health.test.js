const request = require('supertest');

// Mock tracing before requiring app
jest.mock('../src/tracing', () => {});
jest.mock('prom-client', () => ({
  register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
  collectDefaultMetrics: jest.fn(),
}));
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: () => (_req, res) => res.status(502).json({ error: 'proxy disabled in test' }),
}));

const app = require('../src/index');

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', service: 'api-gateway' });
    });
  });

  describe('GET /ready', () => {
    it('should return status ready', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ready', service: 'api-gateway' });
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics endpoint', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
    });
  });
});
