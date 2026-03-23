import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

const router = Router();

router.post('/send', EmailController.sendEmail);
router.get('/inbox', EmailController.getInbox);
router.get('/conversations', EmailController.getConversations);
router.get('/messages/:conversationId', EmailController.getMessages);

export default router;
