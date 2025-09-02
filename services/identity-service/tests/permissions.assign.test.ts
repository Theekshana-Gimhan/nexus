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

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_secret';
  await DatabaseService.initialize();
  await RedisService.initialize();
});

afterAll(async () => {
  await DatabaseService.disconnect();
  await RedisService.disconnect();
});

describe('Assign/Remove Role and cache invalidation', () => {
  it('assigns and removes role and clears cache on each mutation', async () => {
    // login admin
    const login = await request(app).post('/auth/login').send({ email: 'admin@nexus.lk', password: 'admin123' });
    expect(login.status).toBe(200);
    const adminToken = login.body.data.accessToken;

    // create a new user
    const email = `jest_assign_${Date.now()}@nexus.lk`;
    const create = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password: 'test123', firstName: 'Assign', lastName: 'User' });
    expect([200,201]).toContain(create.status);
    const userId = create.body.data.user.id;

    // prime cache
    await PermissionService.getUserAccessProfile(userId);
    const key = `perms:user:${userId}`;
    const cached = await RedisService.get(key);
    expect(cached).toBeTruthy();

    // find a role to assign (use 'manager' role that exists in seeds)
    const rolesRes = await request(app).get('/roles').set('Authorization', `Bearer ${adminToken}`);
    expect(rolesRes.status).toBe(200);
    const managerRole = rolesRes.body.data.roles.find((r: any) => r.name === 'manager');
    expect(managerRole).toBeTruthy();

    // assign role
    const assign = await request(app)
      .post(`/users/${userId}/roles`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roleId: managerRole.id });
    expect(assign.status).toBe(200);

    const afterAssign = await RedisService.get(key);
    expect(afterAssign).toBeNull();

    // prime again and then remove role
    await PermissionService.getUserAccessProfile(userId);
    const afterPrime = await RedisService.get(key);
    expect(afterPrime).toBeTruthy();

    const remove = await request(app)
      .delete(`/users/${userId}/roles/${managerRole.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(remove.status).toBe(200);

    const afterRemove = await RedisService.get(key);
    expect(afterRemove).toBeNull();
  });
});
