import { Router } from 'express';
import { FurnitureController } from '../../controllers/furnitureController';
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

router.get('/',furnitureController.getAllFurniture);
router.get('/:id',furnitureController.getFurnitureById);
router.get('/:id/issues',issueControllerInstance.getFurnitureIssues);
router.get('/:id/reviews',reviewControllerInstance.getFurnitureReviews);
router.get('/:id/assembly',furnitureController.getFurnitureAssembly);

router.post("/filter", furnitureController.filterFurniture);
router.post('/:id/issues', issueControllerInstance.postIssue);
router.post('/:id/reviews', reviewControllerInstance.createFurnitureReview);

export default router;