import { Router } from 'express';
import { IssueController } from '@/controllers/issueController';
import { IssueService } from '@/services/issueService';
import { authMiddleware, authorize } from '../../middleware/auth';
import { UserRole } from '@/types/user.types';

const router = Router();
const issueServiceInstance = new IssueService();
const issueControllerInstance = new IssueController(issueServiceInstance);

// Get all issues (admin only)
router.get('/', authMiddleware, authorize([UserRole.ADMIN]), issueControllerInstance.getAllIssues);

// Get issues by provider (admin and provider)
router.get('/provider/:providerId', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), issueControllerInstance.getProviderIssues);

// Resolve an issue
router.patch('/:id/resolve', authMiddleware, authorize([UserRole.ADMIN, UserRole.PROV]), issueControllerInstance.resolveIssue);

// Escalate an issue to admin
router.patch('/:id/escalate', authMiddleware, authorize([UserRole.PROV]), issueControllerInstance.escalateIssue);

export default router;
