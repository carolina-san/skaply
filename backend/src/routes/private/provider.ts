import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const providerController = new ProviderController();

router.get('/', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviders);
router.get('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviderById); 
router.post( '/:id/enable', authMiddleware, authorize([UserRole.ADMIN]), providerController.enableProvider);
router.post( '/:id/disable', authMiddleware, authorize([UserRole.ADMIN]), providerController.disableProvider);
router.post('/:id/approve', authMiddleware, authorize([UserRole.ADMIN]), providerController.approveProvider);
router.post('/:id/reject', authMiddleware, authorize([UserRole.ADMIN]), providerController.rejectProvider);
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

// GET /providers?status=PENDING
// GET /providers?status=REJECTED
// GET /providers?status=APPROVED

// modificar un proveedor
// eliminar un proveedor


export default router;
