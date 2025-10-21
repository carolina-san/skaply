import { Router } from 'express';
import userRoutes from './users';
import authRoutes from './auth';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({ 
    message: 'API is running', 
    timestamp: new Date().toISOString() 
  });
});

// Feature routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
