import { Router } from 'express';
import { AuthController } from '@/controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

export default router;
