import { Router } from 'express';
import { getProblemsFeed } from '../controllers/problems.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/problems', getProblemsFeed);

export default router;
