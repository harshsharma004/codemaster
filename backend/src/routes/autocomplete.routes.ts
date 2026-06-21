import { Router } from 'express';
import { autocompleteUsers, autocompleteProblems } from '../controllers/autocomplete.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/users', autocompleteUsers);
router.get('/problems', autocompleteProblems);

export default router;
