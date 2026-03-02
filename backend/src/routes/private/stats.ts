import { Router } from 'express';
import { getAnalyticsData, getDashboardStats } from '../../controllers/statsController';

const router = Router();

router.get('/analytics', getAnalyticsData);
router.get('/dashboard', getDashboardStats);

export default router;