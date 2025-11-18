import { Router } from 'express';
import { FurnitureController } from '../controllers/furnitureController';
import { IssueController } from '@/controllers/issueController';
import { IssueService } from '@/services/issueService';
import { ReviewController } from '@/controllers/reviewController';
import { ReviewService } from '@/services/reviewService';

const router = Router();
const furnitureController = new FurnitureController();
const issueServiceInstance = new IssueService();
const issueControllerInstance = new IssueController(issueServiceInstance);
const reviewServiceInstance = new ReviewService();
const reviewControllerInstance = new ReviewController(reviewServiceInstance);

router.get('/',furnitureController.getFurnitures);
router.post("/filter", furnitureController.filterFurniture);
router.get('/:id',furnitureController.getFurnitureById);
router.get('/:id/parts',furnitureController.getFurnitureParts);
router.get('/:id/step/:stepId/parts',furnitureController.getFurnitureStepParts);
router.get('/:id/issues',issueControllerInstance.getFurnitureIssues);
router.get('/:id/reviews',reviewControllerInstance.getFurnitureReviews);
export default router;