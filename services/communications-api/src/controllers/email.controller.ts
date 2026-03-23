import { Request, Response } from 'express';
import { EmailService } from '../services/email.service';
import { Message, CommunicationConfig } from '../../../../shared/src/models/communication';
import { Conversation } from '../../../../shared/src/models/conversation';
import { encrypt } from '../../../../shared/src/encryption';

export class EmailController {
    static async sendEmail(req: Request, res: Response) {
        const { companyId, to, subject, content, attachments } = req.body;

        try {
            const result = await EmailService.sendEmail(companyId, to, subject, content, attachments);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getInbox(req: Request, res: Response) {
        const { companyId } = req.query;
        console.log(`[EmailController] getInbox request for companyId: ${companyId}`);
        try {
            // Trigger sync
            console.log(`[EmailController] Triggering syncInbox for ${companyId}...`);
            const syncedCount = await EmailService.syncInbox(companyId as string);
            console.log(`[EmailController] syncInbox completed. Synced ${syncedCount} messages.`);

            const conversations = await Conversation.find({
                company_id: companyId,
                channel: 'email'
            }).sort({ last_message_at: -1 });

            // In a real app, we'd populated messages, but the query was select('*, messages(*)')
            // This is a bit different in Mongoose. We'll just return conversations for now.
            res.json(conversations);
        } catch (error: any) {
            console.error(`[EmailController] Error in getInbox:`, error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getConversations(req: Request, res: Response) {
        const { companyId } = req.query;
        try {
            const conversations = await Conversation.find({
                company_id: companyId,
            }).sort({ last_message_at: -1 });

            res.json(conversations);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMessages(req: Request, res: Response) {
        const { conversationId } = req.params;
        try {
            const messages = await Message.find({
                conversation_id: conversationId
            }).sort({ createdAt: 1 });

            res.json(messages);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getConfig(req: Request, res: Response) {
        const { companyId } = (req as any).context || req.query;
        try {
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'email'
            });

            if (config && config.config) {
                if (config.config.smtp_password) config.config.smtp_password = '••••••••';
                if (config.config.imap_password) config.config.imap_password = '••••••••';
            }

            res.json(config ? {
                ...config.config,
                broker_id: config.company_id
            } : null);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async saveConfig(req: Request, res: Response) {
        const { companyId } = (req as any).context;
        const { email, smtp_host, smtp_port, smtp_user, smtp_password, imap_host, imap_port, imap_user, imap_password } = req.body;

        try {
            const configData: any = {
                email,
                smtp_host,
                smtp_port,
                smtp_user,
                imap_host,
                imap_port,
                imap_user,
            };

            if (smtp_password && smtp_password !== '••••••••') {
                configData.smtp_password = encrypt(smtp_password);
            }
            if (imap_password && imap_password !== '••••••••') {
                configData.imap_password = encrypt(imap_password);
            }

            const config = await CommunicationConfig.findOneAndUpdate(
                { company_id: companyId, type: 'email' },
                {
                    provider: 'smtp/imap',
                    config: configData,
                    is_active: true
                },
                { upsert: true, new: true }
            );

            res.json(config);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
