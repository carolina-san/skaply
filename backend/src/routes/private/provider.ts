// put /providers/me cambia: company_name, telephone, tax_address
// put /providers/:id cambia: email, cif, company_name, telephone, tax_address 

import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const providerController = new ProviderController();

router.get('/', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviders);
router.get('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviderById); 
// activar o desactivar proveedor
router.put( '/:id/enable', authMiddleware, authorize([UserRole.ADMIN]), providerController.enableProvider); 
router.put('/:id/disable', authMiddleware, authorize([UserRole.ADMIN]), providerController.disableProvider);
// aprobar o rechazar solicitud 
router.put('/:id/approve', authMiddleware, authorize([UserRole.ADMIN]), providerController.approveProvider);
router.put('/:id/reject', authMiddleware, authorize([UserRole.ADMIN]), providerController.rejectProvider);
// modificar 
router.put('/me', authMiddleware, authorize([UserRole.PROV]), providerController.updateMyProvider);
router.put('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProvider);
// eliminar
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

// GET /providers?status=PENDING
// GET /providers?status=REJECTED
// GET /providers?status=APPROVED

export default router;
