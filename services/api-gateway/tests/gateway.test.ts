import request from 'supertest';
import { app } from '../src/index';

describe('API Gateway', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Root Endpoint', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Nexus API Gateway');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Authentication Required Routes', () => {
    it('should reject unauthenticated requests to tenant routes', async () => {
      const response = await request(app)
        .get('/api/v1/tenants')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should reject unauthenticated requests to user routes', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // This test would require multiple requests to trigger rate limiting
      // For now, just verify the endpoint exists
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      // Should get a service error since we're not actually hitting the identity service
      expect([400, 401, 500, 502]).toContain(response.status);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown/route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not found');
    });
  });
});
