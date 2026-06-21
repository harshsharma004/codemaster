import { Router } from 'express';
import { globalStats, personalAnalytics } from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/stats', globalStats);
router.get('/analytics/me', personalAnalytics);

export default router;
