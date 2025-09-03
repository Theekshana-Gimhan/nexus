import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /auth/login
router.post('/login', AuthController.login);

// POST /auth/register
router.post('/register', AuthController.register);

// POST /auth/refresh
router.post('/refresh', AuthController.refreshToken);

// POST /auth/service-token - client credentials
router.post('/service-token', AuthController.serviceToken);

// GET /auth/profile (protected route)
router.get('/profile', authenticateToken, AuthController.getProfile);

export default router;
