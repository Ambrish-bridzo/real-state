import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';

const router = Router();

// Public webhook route (must bypass auth middleware)
router.all('/webhook', WhatsAppController.handleWebhook);

// Protected routes (will be prefixed with /api/whatsapp in server.ts)
router.post('/send', WhatsAppController.sendMessage);
router.get('/conversations', WhatsAppController.getConversations);
router.get('/messages/:conversationId', WhatsAppController.getMessages);
router.post('/messages/:messageId/read', WhatsAppController.markAsRead);
router.post('/typing', WhatsAppController.setTypingIndicator);

export default router;
