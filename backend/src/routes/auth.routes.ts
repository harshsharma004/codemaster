import { Router } from 'express';
import { checkUsername, register, login, googleAuth, me } from '../controllers/auth.controller';
import { authRateLimiter, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', authRateLimiter, login);
router.post('/google', googleAuth);
router.get('/me', requireAuth, me);

export default router;
