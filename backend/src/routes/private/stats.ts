import { Router } from 'express';
import { getAnalyticsData, getDashboardStats, getProviderStats } from '../../controllers/statsController';

const router = Router();

router.get('/analytics', getAnalyticsData);
router.get('/dashboard', getDashboardStats);
router.get('/provider/:id', getProviderStats);

export default router;