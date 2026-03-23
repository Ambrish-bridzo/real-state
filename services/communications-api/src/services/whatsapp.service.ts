import axios from 'axios';
import { Message, CommunicationConfig } from '../../../../shared/src/models/communication';
import { Conversation } from '../../../../shared/src/models/conversation';
import { decrypt } from '../../../../shared/src/encryption';

const META_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export class WhatsAppService {
    static async sendMessage(companyId: string, to: string, content: string, type: 'text' | 'image' | 'document' | 'sticker' | 'location' = 'text', mediaData?: any) {
        try {
            // 0. Normalize phone number (Remove non-digits)
            const normalizedTo = to.replace(/\D/g, '');
            console.log(`[WhatsAppService] Sending message to ${normalizedTo} (original: ${to})`);

            // 1. Get WhatsApp config for this company
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'whatsapp'
            });

            if (!config || !config.config) {
                throw new Error('WhatsApp integration not configured for this company');
            }

            const { phone_number_id, access_token: encryptedToken } = config.config;
            const access_token = decrypt(encryptedToken);

            // 2. Prepare payload based on type
            let messagePayload: any = {
                messaging_product: 'whatsapp',
                to: normalizedTo,
                type: type
            };

            if (type === 'text') {
                messagePayload.text = { body: content };
            } else if (type === 'image') {
                messagePayload.image = { link: mediaData.url, caption: content };
            } else if (type === 'document') {
                messagePayload.document = { link: mediaData.url, caption: content, filename: mediaData.filename };
            } else if (type === 'sticker') {
                messagePayload.sticker = { link: mediaData.url };
            } else if (type === 'location') {
                messagePayload.location = {
                    latitude: mediaData.latitude,
                    longitude: mediaData.longitude,
                    name: mediaData.name,
                    address: mediaData.address
                };
            }

            // 3. Send message via Meta API
            const response = await axios.post(
                `${BASE_URL}/${phone_number_id}/messages`,
                messagePayload,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const externalMessageId = response.data.messages[0].id;

            // 3. Upsert conversation
            const conversation = await Conversation.findOneAndUpdate(
                {
                    company_id: companyId,
                    channel: 'whatsapp',
                    customer_identifier: normalizedTo,
                },
                {
                    last_message: content,
                    last_message_at: new Date()
                },
                { upsert: true, new: true }
            );

            if (!conversation) throw new Error('Error finding/creating conversation');

            // 4. Store message in DB
            await Message.create({
                company_id: companyId,
                user_id: companyId, // Default to company owner for outbound
                conversation_id: conversation._id.toString(),
                channel: 'whatsapp',
                direction: 'outbound',
                sender: config.config.phone_number,
                receiver: normalizedTo,
                content: content,
                external_message_id: externalMessageId,
                status: 'sent',
                media_url: type !== 'text' ? mediaData?.url : undefined,
                media_type: type !== 'text' ? type : undefined,
                metadata: type === 'location' ? { location: mediaData } : undefined
            });

            return response.data;
        } catch (error: any) {
            console.error('CRITICAL: Error sending WhatsApp message:');
            if (error.response) {
                console.error(' - Status:', error.response.status);
                console.error(' - Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error(' - Error Message:', error.message);
            }
            throw error;
        }
    }

    static async handleWebhook(payload: any) {
        // Logging only - processing is handled in the controller for speed (200 OK sent first)
        console.log('[WhatsAppService] Webhook payload logged:', JSON.stringify(payload, null, 2));
    }

    /**
     * Resolves a Meta Media ID into a temporary URL and updates the message.
     */
    static async resolveAndStoreMediaUrl(externalMessageId: string, mediaId: string, companyId: string) {
        try {
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'whatsapp'
            });

            if (!config || !config.config) return;
            const access_token = decrypt(config.config.access_token);

            // 1. Get Media URL from Meta
            const response = await axios.get(`${BASE_URL}/${mediaId}`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const mediaUrl = response.data.url;

            // 2. Update DB with the real URL
            await Message.findOneAndUpdate(
                { external_message_id: externalMessageId },
                { media_url: mediaUrl }
            );

        } catch (error: any) {
            console.error('[WhatsAppService] Error resolving media URL:', error.message);
        }
    }

    /**
     * Marks a message as read in the Meta API.
     */
    static async markAsRead(companyId: string, messageId: string) {
        try {
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'whatsapp'
            });

            if (!config || !config.config) return;
            const access_token = decrypt(config.config.access_token);

            await axios.post(
                `${BASE_URL}/${config.config.phone_number_id}/messages`,
                {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                },
                { headers: { Authorization: `Bearer ${access_token}` } }
            );
        } catch (error: any) {
            console.error('[WhatsAppService] Error marking message as read:', error.message);
        }
    }

    /**
     * Sends a typing indicator to the user.
     * Note: WhatsApp Cloud API doesn't have a direct "typing" feature like some other APIs,
     * but we'll implement it if the specific endpoint/method is available or simulated.
     * Actually, Meta DOES NOT support a "typing" indicator in the standard Cloud API yet.
     * We'll simulate it via WebSockets for the DASHBOARD side (broker typing).
     */
    static async sendTypingStatus(companyId: string, to: string, isTyping: boolean) {
        // Emit a realtime event via Socket.io bridge (handled by core-engine change streams if we update a collection)
        await Conversation.findOneAndUpdate(
            { company_id: companyId, customer_identifier: to },
            {
                $set: {
                    [`metadata.typing.${companyId}`]: isTyping,
                    'metadata.typing.updated_at': new Date()
                }
            }
        );
    }
}
