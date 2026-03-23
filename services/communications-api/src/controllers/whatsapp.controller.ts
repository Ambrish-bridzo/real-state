import { Request, Response } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';
import { Message, CommunicationConfig } from '../../../../shared/src/models/communication';
import { Conversation } from '../../../../shared/src/models/conversation';
import { encrypt } from '../../../../shared/src/encryption';

export class WhatsAppController {
    static async handleWebhook(req: Request, res: Response) {
        const { body, method, query } = req;
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'leadflow_secret_2024';

        console.log(`[WhatsAppWebhook] Received ${method} request at ${new Date().toISOString()}`);

        // 1. Handle Verification (GET)
        if (method === 'GET') {
            const mode = query['hub.mode'];
            const token = query['hub.verify_token'];
            const challenge = query['hub.challenge'];

            console.log(`[WhatsAppWebhook] Verification Attempt: mode=${mode}, token=${token}`);

            if (mode === 'subscribe' && token === verifyToken) {
                console.log('[WhatsAppWebhook] Verification SUCCESS');
                return res.status(200).send(challenge);
            } else {
                console.warn('[WhatsAppWebhook] Verification FAILED');
                return res.sendStatus(403);
            }
        }

        // 2. Handle Events (POST)
        // Send 200 OK immediately to Meta to prevent retries
        res.sendStatus(200);

        // From here on, we process asynchronously to keep response fast
        try {
            console.log('[WhatsAppWebhook] Payload:', JSON.stringify(body, null, 2));

            if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value) {
                return;
            }

            const changes = body.entry[0].changes[0].value;
            const metadata = changes.metadata;
            const phoneNumberId = metadata?.phone_number_id;

            // A. Handle Status Updates
            if (changes.statuses && changes.statuses.length > 0) {
                const statusUpdate = changes.statuses[0];
                const externalId = statusUpdate.id;
                const status = statusUpdate.status; // delivered, read, failed
                const recipient = statusUpdate.recipient_id;

                console.log(`[WhatsAppWebhook] Status Update: ID=${externalId}, Status=${status}, To=${recipient}`);

                await Message.findOneAndUpdate(
                    { external_message_id: externalId },
                    {
                        status: status,
                        metadata: { ...body } // Store raw status payload too
                    }
                );

                return;
            }

            // B. Handle Incoming Messages
            if (changes.messages && changes.messages.length > 0) {
                const message = changes.messages[0];
                const from = message.from;
                const externalMessageId = message.id;
                const msgType = message.type; // text, image, document, sticker, location, etc.

                let content = '';
                let mediaUrl = null;
                let mediaType = null;
                let location = null;

                if (msgType === 'text') {
                    content = message.text?.body || '';
                } else if (msgType === 'image') {
                    content = message.image?.caption || 'Image received';
                    mediaType = 'image/jpeg';
                    // We'll need to fetch the actual URL using the media ID if we want direct display
                    // For now, we store the ID or placeholder
                    mediaUrl = message.image?.id;
                } else if (msgType === 'document') {
                    content = message.document?.caption || message.document?.filename || 'Document received';
                    mediaType = message.document?.mime_type;
                    mediaUrl = message.document?.id;
                } else if (msgType === 'sticker') {
                    content = 'Sticker received';
                    mediaType = 'image/webp';
                    mediaUrl = message.sticker?.id;
                } else if (msgType === 'location') {
                    content = `Location: ${message.location?.name || 'Shared Location'}`;
                    location = {
                        latitude: message.location?.latitude,
                        longitude: message.location?.longitude,
                        name: message.location?.name,
                        address: message.location?.address
                    };
                } else if (msgType === 'video') {
                    content = message.video?.caption || 'Video received';
                    mediaType = message.video?.mime_type;
                    mediaUrl = message.video?.id;
                } else if (msgType === 'audio') {
                    content = 'Audio received';
                    mediaType = message.audio?.mime_type;
                    mediaUrl = message.audio?.id;
                }

                console.log(`[WhatsAppWebhook] New Message (${msgType}): From=${from}, ID=${externalMessageId}`);

                // 1. Find the broker/company
                const config = await CommunicationConfig.findOne({
                    type: 'whatsapp',
                    'config.phone_number_id': phoneNumberId
                });

                if (!config) {
                    console.warn(`[WhatsAppWebhook] No account found for phone_number_id: ${phoneNumberId}`);
                    return;
                }

                const companyId = config.company_id;

                // 2. Upsert conversation
                const conversation = await Conversation.findOneAndUpdate(
                    {
                        company_id: companyId,
                        channel: 'whatsapp',
                        customer_identifier: from,
                    },
                    {
                        last_message: content,
                        last_message_at: new Date()
                    },
                    { upsert: true, new: true }
                );

                if (!conversation) {
                    console.error('[WhatsAppWebhook] Error finding/creating conversation');
                    return;
                }

                // 3. BROADCAST via Socket.io (Internal request to core-engine)
                // We do this BEFORE DB insert for maximum speed as requested
                const messagePayload = {
                    id: `temp-${Date.now()}`, // Temporary ID for GUI until DB confirms
                    company_id: companyId,
                    broker_id: companyId,
                    conversation_id: conversation._id.toString(),
                    channel: 'whatsapp',
                    direction: 'inbound',
                    sender: from,
                    receiver: metadata.display_phone_number,
                    content: content,
                    external_message_id: externalMessageId,
                    status: 'received',
                    media_url: mediaUrl,
                    media_type: mediaType,
                    metadata: location ? { location } : null,
                    createdAt: new Date().toISOString()
                };

                const coreUrl = process.env.CORE_ENGINE_URL || 'http://localhost:8082';
                const axios = require('axios');
                axios.post(`${coreUrl}/core/internal/broadcast`, {
                    event: 'NEW_MESSAGE',
                    payload: messagePayload
                }).catch((err: any) => console.error('[WhatsAppWebhook] Broadcast Error:', err.message));

                console.log(`[WhatsAppWebhook] Broadcasted NEW_MESSAGE for ${from}`);

                // 4. Store message in DB
                await Message.create({
                    company_id: companyId,
                    user_id: companyId, // Default to company owner for inbound
                    conversation_id: conversation._id.toString(),
                    channel: 'whatsapp',
                    direction: 'inbound',
                    sender: from,
                    receiver: metadata.display_phone_number,
                    content: content,
                    external_message_id: externalMessageId,
                    status: 'received',
                    metadata: { raw_payload: body, ...(location ? { location } : {}) },
                    media_url: mediaUrl,
                    media_type: mediaType,
                });

                // 4. Proactively resolve media URLs if they are just IDs
                if (mediaUrl && !mediaUrl.startsWith('http')) {
                    WhatsAppService.resolveAndStoreMediaUrl(externalMessageId, mediaUrl, companyId);
                }
            }
        } catch (error: any) {
            console.error('[WhatsAppWebhook] Critical Processing Error:', error);
        }
    }

    static async sendMessage(req: Request, res: Response) {
        const { companyId } = (req as any).context;
        const { to, content, type, mediaData } = req.body;

        try {
            const result = await WhatsAppService.sendMessage(companyId, to, content, type, mediaData);

            console.log(result);
            res.json(result);
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        const companyId = (req as any).context.companyId as string;
        const messageId = req.params.messageId as string;
        try {
            await WhatsAppService.markAsRead(companyId, messageId);

            res.json({ success: true });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async setTypingIndicator(req: Request, res: Response) {
        const companyId = (req as any).context.companyId as string;
        const to = req.body.to as string;
        const isTyping = req.body.isTyping as boolean;
        try {
            await WhatsAppService.sendTypingStatus(companyId, to, isTyping);

            console.log({ success: true });
            res.json({ success: true });
        } catch (error: any) {
            console.log(error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getConversations(req: Request, res: Response) {
        const companyId = req.query.companyId as string;
        try {
            const conversations = await Conversation.find({
                company_id: companyId,
                channel: 'whatsapp'
            }).sort({ last_message_at: -1 });

            res.json(conversations);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getMessages(req: Request, res: Response) {
        const conversationId = req.params.conversationId as string;
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
        const companyId = ((req as any).context?.companyId || req.query.companyId) as string;
        try {
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'whatsapp'
            });

            if (config && config.config?.access_token) {
                // Mask the token for safety
                config.config.access_token = '••••' + config.config.access_token.slice(-4);
            }

            res.json(config ? {
                ...config.config,
                broker_id: config.company_id,
            } : null);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async saveConfig(req: Request, res: Response) {
        const { companyId } = (req as any).context;
        const { phone_number, phone_number_id, access_token, webhook_verify_token } = req.body;

        try {
            const configData: any = {
                phone_number,
                phone_number_id,
                webhook_verify_token,
            };

            if (access_token && !access_token.startsWith('••••')) {
                configData.access_token = encrypt(access_token);
            }

            const config = await CommunicationConfig.findOneAndUpdate(
                { company_id: companyId, type: 'whatsapp' },
                {
                    provider: 'meta',
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
