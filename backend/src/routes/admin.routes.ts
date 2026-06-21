import { Router, urlencoded } from 'express';
import { 
  adminRoot, adminLoginPage, adminLogin, 
  adminLogout, adminHome, requireAdminSession 
} from '../controllers/admin.controller';

const router = Router();

// Express urlencoded middleware is needed because the admin login form submits as application/x-www-form-urlencoded
router.use(urlencoded({ extended: true }));

router.get('/', adminRoot);
router.get('/login', adminLoginPage);
router.post('/login', adminLogin);

// Protected routes
router.use(requireAdminSession);
router.post('/logout', adminLogout);
router.get('/', adminHome);

export default router;
