import { Router } from 'express';
import { CategoryController } from '@/controllers/categoryController';

const router = Router();
const categoryController = new CategoryController();

router.get('/',categoryController.getCategories);
router.get('/name/:name',categoryController.getCategoryByName);

export default router;