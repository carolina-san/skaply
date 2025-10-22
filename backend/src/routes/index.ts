import { Router } from 'express';
import userRoutes from './users';
import authRoutes from './auth';
import pool from '@config/database';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({ 
    message: 'API is running', 
    timestamp: new Date().toISOString() 
  });
});

router.get('/mueble', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.mueble ORDER BY id ASC LIMIT 100');
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching muebles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching muebles'
    });
  }
});

// Feature routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
