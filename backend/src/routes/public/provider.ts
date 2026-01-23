import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';

const router = Router();
const providerController = new ProviderController();

router.get('/', providerController.getActiveProviders);
router.get('/:id', providerController.getActiveProviderById);

export default router;
