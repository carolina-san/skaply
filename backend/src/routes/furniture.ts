import { Router } from 'express';
import { FurnitureController } from '../controllers/furnitureController';


const router = Router();
const furnitureController = new FurnitureController();

router.get('/',furnitureController.getFurnitures);
router.get('/:id',furnitureController.getFurnitureById);
router.get('/category/:cat',furnitureController.getFurnitureByCategory);
router.get('/ref/:ref',furnitureController.getFurnitureByReference);
router.get('/provider/:prov',furnitureController.getFurnitureByProvider);
router.get('/parts/:id',furnitureController.getFurnitureWithParts)
export default router;
