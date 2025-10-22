import { Router } from 'express';
import { FurnitureController } from '../controllers/furnitureController';


const router = Router();
const furnitureController = new FurnitureController();

router.get('/',furnitureController.Furnitures);


export default router;
