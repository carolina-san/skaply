import { Router } from 'express';
import { StepController } from '../../controllers/stepController';


const router = Router();
const stepController = new StepController();

//router.get('/',stepController.getStepParts);
//router.get('/:id',stepController.getStepId);

export default router;