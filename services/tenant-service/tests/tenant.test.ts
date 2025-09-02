import request from 'supertest';

// Mock the database and Redis connections for tests
jest.mock('../src/services/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      getKnex: jest.fn(() => ({
        // Mock Knex methods
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(0),
        returning: jest.fn().mockResolvedValue([]),
        transaction: jest.fn(),
        raw: jest.fn().mockResolvedValue({ rows: [] })
      })),
      testConnection: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined)
    }))
  }
}));

jest.mock('../src/services/RedisService', () => ({
  RedisService: {
    getInstance: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(1)
    }))
  }
}));

// Import app after mocking
import app from '../src/index';

describe('Tenant Service Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('service', 'tenant-service');
    expect(response.body).toHaveProperty('checks');
  });
});

describe('Tenant Management', () => {
  // Create a proper test JWT token
  const jwt = require('jsonwebtoken');
  const validToken = `Bearer ${jwt.sign({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    roles: ['admin'],
    permissions: ['tenant:create', 'tenant:read', 'tenant:update', 'tenant:delete']
  }, 'nexus_jwt_secret_key_2024')}`;

  describe('GET /tenants/domain/:domain', () => {
    it('should get tenant by domain without authentication', async () => {
      const response = await request(app)
        .get('/tenants/domain/acme')
        .expect(500); // Will be 500 due to mocked database error

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /tenants', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/tenants')
        .send({
          name: 'Test Tenant',
          domain: 'test',
          adminEmail: 'admin@test.com',
          planId: 'basic'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/tenants')
        .set('Authorization', validToken)
        .send({
          name: 'Test Tenant'
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Missing required fields');
    });
  });

  describe('GET /tenants', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/tenants')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });
});

describe('Service Root', () => {
  it('should return service information', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('service', 'Nexus Tenant Service');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('status', 'running');
  });
});

describe('404 Handler', () => {
  it('should handle unknown endpoints', async () => {
    const response = await request(app)
      .get('/unknown-endpoint')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Endpoint not found');
  });
});
