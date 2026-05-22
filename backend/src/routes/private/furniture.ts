import { Router } from 'express';
import { FurnitureController } from '../../controllers/furnitureController';
import { IssueController } from '@/controllers/issueController';
import { IssueService } from '@/services/issueService';
import { ReviewController } from '@/controllers/reviewController';
import { ReviewService } from '@/services/reviewService';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';
import { uploadFurnitureFiles } from '@/middleware/uploadFurniture';

const router = Router();
const furnitureController = new FurnitureController();
const issueServiceInstance = new IssueService();
const issueControllerInstance = new IssueController(issueServiceInstance);
const reviewServiceInstance = new ReviewService();
const reviewControllerInstance = new ReviewController(reviewServiceInstance);

// router.get('/', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), furnitureController.getAllPrivateFurniture); // no funciona, hay que mirar
router.post('/', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), uploadFurnitureFiles, furnitureController.createFurniture);
router.put('/:id', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), furnitureController.updateFurniture); // revisar
router.delete('/:id', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), furnitureController.deleteFurniture); // revisar

// filtrado de la parte privada, permite filtrar por todas las propiedades de furniture y paginación, también muestra los no visibles
router.post("/filter", authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), furnitureController.filterAllFurniture);

export default router; 