import { Router } from 'express';
import providerRoutes from './provider';
import authRoutes from './auth';
import furnitureRoutes from './furniture';
import stepRoutes from './step';
import categoryRoutes from './categories';
import chatbotRoutes from './chatbot'
import colorRoutes from './colors';
import { ToolService } from '@/services/toolService';

const router = Router();
const toolService = new ToolService();

// Health check
router.get('/health', async (_req, res) => {
  try {
    const healthTool = await toolService.getHealthTool();
    res.status(200).json({ 
      message: 'API is running', 
      timestamp: new Date().toISOString(),
      healthTool: healthTool.rows
    });
  } catch (error) {
    res.status(500).json({
      message: 'API health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Feature routes
router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/categories',categoryRoutes);
router.use('/furniture',furnitureRoutes);
router.use('/furniture/:id/steps',stepRoutes); //DUDA: hará falta?
router.use('/chatbot',chatbotRoutes);
router.use('/colors',colorRoutes);

export default router;
