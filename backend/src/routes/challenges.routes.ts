import { Router } from 'express';
import { 
  createChallenge, listChallenges, getChallenge, 
  acceptChallenge, declineChallenge, startChallenge 
} from '../controllers/challenges.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createChallenge);
router.get('/', listChallenges);
router.get('/:challengeID', getChallenge);
router.post('/:challengeID/accept', acceptChallenge);
router.post('/:challengeID/decline', declineChallenge);
router.post('/:challengeID/start', startChallenge);

export default router;
