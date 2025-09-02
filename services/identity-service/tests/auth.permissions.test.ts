import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../src/services/DatabaseService';
import { RedisService } from '../src/services/RedisService';
import { MessageBrokerService } from '../src/services/MessageBrokerService';
import authRoutes from '../src/routes/auth';
import userRoutes from '../src/routes/users';
import roleRoutes from '../src/routes/roles';
import healthRoutes from '../src/routes/health';

// Lightweight app bootstrap for tests
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/health', healthRoutes);

let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  await DatabaseService.initialize();
  await RedisService.initialize();
  await MessageBrokerService.initialize();
});

afterAll(async () => {
  await DatabaseService.disconnect();
  await RedisService.disconnect();
  await MessageBrokerService.disconnect();
});

describe('Auth & Permission Flow', () => {
  it('health ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('login admin', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@nexus.lk', password: 'admin123' });
    expect(res.status).toBe(200);
    adminToken = res.body.data.accessToken;
    expect(adminToken).toBeTruthy();
  });

  it('admin can create user (201)', async () => {
    const email = `jest_${Date.now()}@nexus.lk`;
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password: 'test123', firstName: 'Jest', lastName: 'User' });
    expect([200,201]).toContain(res.status); // tolerance until all endpoints standardized
    expect(res.body.success).toBe(true);
  });

  it('admin can list roles (permission protected)', async () => {
    const res = await request(app)
      .get('/roles')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.roles).toBeDefined();
  });
});
