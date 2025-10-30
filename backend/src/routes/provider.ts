import { Router } from 'express';
import { ProviderController } from '../controllers/ProviderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const providerController = new ProviderController();

router.get('/', authMiddleware, providerController.getProviders);
router.get('/:id', authMiddleware, providerController.getProviderById);
router.put('/:id', authMiddleware, providerController.updateProvider);
router.delete('/:id', authMiddleware, providerController.deleteProvider);

export default router;
