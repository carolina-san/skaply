import { Router } from 'express';
import { ChatbotController } from '@/controllers/chatbotController';

const router = Router();
const chatbotController = new ChatbotController();

router.post('/webhook',chatbotController.handleWebhook);

export default router;