import { Router } from 'express';
import { getVisits, getDashboardStats } from '../../controllers/statsController';

const router = Router();

router.get('/visits', getVisits);
router.get('/dashboard', getDashboardStats);

export default router;