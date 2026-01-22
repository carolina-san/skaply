import { Router, NextFunction } from 'express';
import {
  providerRoutes,
  authRoutes,
  furnitureRoutes,
  stepRoutes,
  categoryRoutes,
  chatbotRoutes,
  colorRoutes
} from './public';
import {
  privateFurnitureRoutes,
  privateProviderRoutes
} from './private';
import { ToolService } from '@/services/toolService';
import { ApiError } from '@/utils/ApiError';

const router = Router();
const toolService = new ToolService();

// Health check
router.get('/health', async (_req, res, next: NextFunction) => {
  try {
    const healthTool = await toolService.getHealthTool();
    res.status(200).json({
      message: 'API is running',
      timestamp: new Date().toISOString(),
      healthTool: healthTool.rows
    });
  } catch (error) {
    next(new ApiError('INTERNAL_SERVER', 'Api check health failed'));
  }
});

// PUBLIC routes
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/categories', categoryRoutes);
router.use('/furniture', furnitureRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/colors', colorRoutes);

// PRIVATE routes
router.use('/private/furniture', privateFurnitureRoutes);
router.use('/private/providers', privateProviderRoutes);

export default router;