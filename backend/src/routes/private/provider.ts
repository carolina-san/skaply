import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';


const router = Router();
const providerController = new ProviderController();


//router.put('/:id', authMiddleware, providerController.updateProvider);
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

export default router;
