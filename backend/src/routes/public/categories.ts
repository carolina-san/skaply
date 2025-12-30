import { Router } from 'express';
import { CategoryController } from '@/controllers/categoryController';

const router = Router();
const categoryController = new CategoryController();

router.get('/',categoryController.getCategories);

export default router;