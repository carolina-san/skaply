/*

get     /                           -> devuelve todos los providers
get     /:id                        -> devuelve un provider por ID
put     /:id/enable                 -> habilita un provider
put     /:id/disable                -> deshabilita un provider (suspendido por falta de pago, etc.)
put     /:id/visible                -> hace visible (publico) un provider (solo se puede si está enabled)
put     /:id/invisible              -> hace invisible (no publico) un provider 
put     /:id/registration/approve   -> aprueba la registracion de un provider                                  
put     /:id/registration/reject    -> rechaza la registracion de un provider
put     /me                         -> [PROV] actualiza los datos del provider autenticado (company_name, telephone, tax_address)
put     /me/change-password         -> [PROV] cambia la contraseña del provider autenticado
put     /:id                        -> [ADMIN] actualiza los datos de un provider por ID (company_name, telephone, tax_address, email, cif)
delete  /:id                        -> elimina un provider por ID


currentPassword, newPassword
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
router.put('/:id/visible', authMiddleware, authorize([UserRole.ADMIN]), providerController.makeProviderVisible);
router.put('/:id/invisible', authMiddleware, authorize([UserRole.ADMIN]), providerController.makeProviderInvisible);
router.put('/:id/registration/approve', authMiddleware, authorize([UserRole.ADMIN]), providerController.approveRegistration);
router.put('/:id/registration/reject', authMiddleware, authorize([UserRole.ADMIN]), providerController.rejectRegistration);
router.put('/me', authMiddleware, authorize([UserRole.PROV]), providerController.updateMyProvider);
router.put('/me/change-password', authMiddleware, authorize([UserRole.PROV]), providerController.changeMyPassword);
router.put('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProvider);
//router.put('/:id/change-password', authMiddleware, authorize([UserRole.ADMIN), providerController.changePassword); // check
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

// filtros
// GET /providers?status=PENDING
// GET /providers?status=REJECTED
// GET /providers?status=APPROVED

export default router;
