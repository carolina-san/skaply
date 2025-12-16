import { Router } from 'express';
import { ChatbotController } from '@/controllers/chatbotController';

const router = Router();
const chatbotController = new ChatbotController();

router.post('/',chatbotController.handleChatbot);
router.post('/webhook', chatbotController.handleWebhook);
router.post('/start', chatbotController.initAssembly);
router.post('/reset', chatbotController.resetAssembly);
router.post('/welcome', chatbotController.sendWelcomeEvent);

export default router;