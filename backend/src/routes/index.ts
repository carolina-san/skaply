import { Router } from 'express';
import providerRoutes from './provider';
import authRoutes from './auth';
import furnitureRoutes from './furniture';
import categoryRoutes from './categories';

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
router.use('/providers', providerRoutes);
router.use('/furnitures',furnitureRoutes);
router.use('/categories',categoryRoutes);
export default router;
