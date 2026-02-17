import { Router } from 'express';
import { CategoryController } from '@/controllers/categoryController';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.getCategories);
router.get('/name/:name', categoryController.getCategoryByName);
router.get('/:id', categoryController.getCategoryById);

export default router;