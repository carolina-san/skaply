/*
put     /me                         -> [PROV] actualiza los datos del provider autenticado (company_name, telephone, tax_address)
put     /me/change-password         -> [PROV] cambia la contraseña del provider autenticado validando la contraseña actual (currentPassword, newPassword)
get     /                           -> devuelve todos los providers
get     /:id                        -> devuelve un provider por ID
patch   /:id/approve                -> aprueba la solicitud de registro de un provider                                  
patch   /:id/reject                 -> rechaza la solicitud de registro de un provider
patch   /:id/enabled                -> habilita o deshabilita un provider
patch   /:id/visibility             -> hace visible (publico, solo si está enabled) o invisible (no publico) un provider
patch   /:id                        -> [ADMIN] actualiza los datos de un provider por ID (company_name, telephone, tax_address, email, cif, image_url)
patch   /:id/change-password        -> [ADMIN] cambia la contraseña de un provider por ID (newPassword)
delete  /:id                        -> elimina un provider por ID

filtros
GET /providers
GET /providers?enabled=true
GET /providers?visible=false
GET /providers?enabled=false&visible=false
GET /providers?registration_status=pending
etc.

Importante en el frontend: si se selecciona visible en el selector de visiblidad, se tiene que bloquear el otro selector con la opcion de enabled (activo o como lo querais llamar) y no dejar que se pueda cambiar.

*/

import { Router } from 'express';
import { ProviderController } from '../../controllers/ProviderController';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const providerController = new ProviderController();

// ==========================================================
// RUTAS DEL PROVEEDOR AUTENTICADO (/me) 
// Tienen que ir antes de las que tienen parámetros dinámicos
// ==========================================================
router.put('/me', authMiddleware, authorize([UserRole.PROV]), providerController.updateMyProvider);
router.put('/me/change-password', authMiddleware, authorize([UserRole.PROV]), providerController.changeMyPassword);

// ==========================================================
// RUTAS DE ADMIN
// ==========================================================
router.get('/', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviders);
router.get('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.getProviderById);

// Las rutas de registro pueden estar en 2 endpoints porque son 2 botones diferentes en el frontend
router.patch('/:id/approve', authMiddleware, authorize([UserRole.ADMIN]), providerController.approveRegistration);
router.patch('/:id/reject', authMiddleware, authorize([UserRole.ADMIN]), providerController.rejectRegistration);

// Endpoint para habilitar/deshabilitar, recibe un booleano
router.patch('/:id/enabled', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProviderEnabled);

// Endpoint para actualizar visibilidad, recibe un booleano
router.patch('/:id/visibility', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProviderVisibility);

// Update genérico
router.patch('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.updateProvider);

// Update solo de contraseña
router.patch('/:id/change-password', authMiddleware, authorize([UserRole.ADMIN]), providerController.changePassword);

// Delete
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN]), providerController.deleteProvider);

export default router;
