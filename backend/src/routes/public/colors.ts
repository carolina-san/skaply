import { Router } from 'express';
import { ColorController } from '@/controllers/colorController';

const router = Router();
const colorController = new ColorController();

router.get('/',colorController.getColors); // devuelve los colores de los muebles, no los colores de la tabla "Color"
router.get('/name/:name', colorController.getColorByName); // devuelve un color por su nombre
export default router;