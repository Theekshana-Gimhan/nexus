import request from 'supertest';
import express from 'express';
import { DatabaseService } from '../src/services/DatabaseService';
import { RedisService } from '../src/services/RedisService';
import authRoutes from '../src/routes/auth';
import userRoutes from '../src/routes/users';
import roleRoutes from '../src/routes/roles';
import healthRoutes from '../src/routes/health';
import { PermissionService } from '../src/services/PermissionService';

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
});

afterAll(async () => {
  await DatabaseService.disconnect();
  await RedisService.disconnect();
});

describe('Permission cache invalidation', () => {
  it('primes cache then deletes user and clears perms cache', async () => {
    // login as admin
    const login = await request(app).post('/auth/login').send({ email: 'admin@nexus.lk', password: 'admin123' });
    expect(login.status).toBe(200);
    adminToken = login.body.data.accessToken;

    // create a new user
    const email = `jest_cache_${Date.now()}@nexus.lk`;
    const create = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password: 'test123', firstName: 'Cache', lastName: 'User' });
    expect([200,201]).toContain(create.status);
    const userId = create.body.data.user.id;
    expect(userId).toBeTruthy();

  // Prime the permission cache
  await PermissionService.getUserAccessProfile(userId);
    const cacheKey = `perms:user:${userId}`;
    const cached = await RedisService.get(cacheKey);
    expect(cached).toBeTruthy();

    // Delete user (this should remove user_roles and invalidate cache)
    const del = await request(app)
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);

    // Cache key should be removed (or at least not contain the profile)
    const after = await RedisService.get(cacheKey);
    expect(after).toBeNull();
  });
});
