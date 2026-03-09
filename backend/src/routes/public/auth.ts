import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authMiddleware, authorize } from '@middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Solo para admins
router.get('/me', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), authController.me);
router.put('/me', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), authController.updateMyProfile);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

export default router;
