import { Router } from 'express';
import { FurnitureController } from '../controllers/furnitureController';


const router = Router();
const furnitureController = new FurnitureController();

router.get('/',furnitureController.getFurnitures);
router.get('/:id',furnitureController.getFurnitureById);

export default router;
