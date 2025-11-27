import { Router } from 'express';
import { ChatbotController } from '@/controllers/chatbotController';

const router = Router();
const chatbotController = new ChatbotController();

router.post('/',chatbotController.handleChatbot);
router.post('/webhook', chatbotController.handleWebhook);
router.post('/start', chatbotController.inicioMontaje);
router.post('/reset', chatbotController.resetMontaje);

export default router;