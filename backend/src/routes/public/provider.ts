import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';

const router = Router();
const providerController = new ProviderController();

router.get('/', providerController.getVisibleProviders);
router.get('/:id', providerController.getVisibleProviderById);

export default router;
