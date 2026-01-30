/*

get     /                           -> devuelve todos los providers
get     /:id                        -> devuelve un provider por ID
put     /:id/enable                 -> habilita un provider
put     /:id/disable                -> deshabilita un provider 
put     /:id/registration/approve   -> aprueba la registracion de un provider                                  
put     /:id/registration/reject    -> rechaza la registracion de un provider
put     /me                         -> [PROV] actualiza los datos del provider autenticado (company_name, telephone, tax_address)
put     /:id                        -> [ADMIN] actualiza los datos de un provider por ID (company_name, telephone, tax_address, email, cif)
delete  /:id                        -> elimina un provider por ID

*/

import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const providerController = new ProviderController();

router.get('/', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviders);
router.get('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviderById); 
router.put( '/:id/enable', authMiddleware, authorize([UserRole.ADMIN]), providerController.enableProvider); 
router.put('/:id/disable', authMiddleware, authorize([UserRole.ADMIN]), providerController.disableProvider);
router.put('/:id/registration/approve', authMiddleware, authorize([UserRole.ADMIN]), providerController.approveRegistration);
router.put('/:id/registration/reject', authMiddleware, authorize([UserRole.ADMIN]), providerController.rejectRegistration);
router.put('/me', authMiddleware, authorize([UserRole.PROV]), providerController.updateMyProvider);
router.put('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProvider);
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

// visible/oculto
// changePassword

// filtros
// GET /providers?status=PENDING
// GET /providers?status=REJECTED
// GET /providers?status=APPROVED

export default router;
