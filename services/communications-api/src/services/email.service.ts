import nodemailer from 'nodemailer';
const imap = require('imap-simple');
import { simpleParser } from 'mailparser';
import { Message, CommunicationConfig } from '../../../../shared/src/models/communication';
import { Conversation } from '../../../../shared/src/models/conversation';
import { decrypt } from '../../../../shared/src/encryption';

export class EmailService {
    static async sendEmail(companyId: string, to: string, subject: string, body: string, attachments?: any[]) {
        console.log(`[EmailService] Starting sendEmail for company: ${companyId} to: ${to} with ${attachments?.length || 0} attachments`);
        try {
            // 1. Get Email config
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'email'
            });

            if (!config || !config.config) {
                console.error(`[EmailService] Config not found for company ${companyId}`);
                throw new Error('Email integration not configured for this company');
            }

            // 2. Decrypt passwords
            const smtpPassword = decrypt(config.config.smtp_password);

            // 3. Create transporter
            const transporter = nodemailer.createTransport({
                host: config.config.smtp_host,
                port: config.config.smtp_port,
                secure: config.config.smtp_port === 465,
                auth: {
                    user: config.config.smtp_user,
                    pass: smtpPassword,
                },
            });

            // 4. Send email
            const mailOptions: any = {
                from: config.config.email,
                to: to,
                subject: subject,
                text: body,
                attachments: attachments?.map(att => ({
                    filename: att.filename,
                    content: Buffer.from(att.content, 'base64'),
                    contentType: att.contentType
                }))
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`[EmailService] Email sent successfully. MessageID: ${info.messageId}`);

            // 5. Upsert conversation
            const conversation = await Conversation.findOneAndUpdate(
                {
                    company_id: companyId,
                    channel: 'email',
                    customer_identifier: to,
                },
                {
                    last_message: body,
                    last_message_at: new Date()
                },
                { upsert: true, new: true }
            );

            if (!conversation) throw new Error('Error finding/creating conversation');

            // 6. Handle Outbound Storage for Attachments (UI display)
            // Simplified: Keeping Supabase Storage logic if it works, or assuming it needs migration.
            // For now, focusing on DB migration as requested.
            const attachmentData: any[] = [];
            let firstImageUrl: string | null = null;
            let firstImageMime: string | null = null;

            // 1. BROADCAST via Socket.io BEFORE DB insert
            const axios = require('axios');
            const coreUrl = process.env.CORE_ENGINE_URL || 'http://localhost:8082';

            const messagePayload = {
                id: `temp-out-${Date.now()}`,
                company_id: companyId,
                broker_id: companyId,
                conversation_id: conversation._id.toString(),
                channel: 'email',
                direction: 'outbound',
                sender: config.config.email,
                receiver: to,
                content: body,
                media_url: firstImageUrl,
                media_type: firstImageMime,
                metadata: {
                    attachments: attachmentData
                },
                external_message_id: info.messageId,
                status: 'sent',
                created_at: new Date().toISOString()
            };

            axios.post(`${coreUrl}/core/internal/broadcast`, {
                event: 'NEW_MESSAGE',
                payload: messagePayload
            }).catch((err: any) => console.error(`[EmailService] Broadcast Error (outbound):`, err.message));

            // 8. Store message in DB
            await Message.create({
                company_id: companyId,
                user_id: companyId, // Default
                conversation_id: conversation._id.toString(),
                channel: 'email',
                direction: 'outbound',
                sender: config.config.email,
                receiver: to,
                content: body,
                media_url: firstImageUrl || undefined,
                media_type: firstImageMime || undefined,
                metadata: {
                    attachments: attachmentData
                },
                external_message_id: info.messageId,
                status: 'sent'
            });
            return info;
        } catch (error: any) {
            console.error('[EmailService] Error in sendEmail:', error.message);
            throw error;
        }
    }

    static async syncInbox(companyId: string) {
        console.log(`[EmailService] --- Sync Starting for Company: ${companyId} ---`);
        try {
            const config = await CommunicationConfig.findOne({
                company_id: companyId,
                type: 'email'
            });

            if (!config || !config.config) {
                console.log(`[EmailService] Sync aborted: No configuration found for company ${companyId}`);
                return;
            }

            const imapPassword = decrypt(config.config.imap_password);
            console.log(`[EmailService] Decrypted IMAP password. Connecting to ${config.config.imap_host}:${config.config.imap_port}...`);

            const imapConfig = {
                imap: {
                    user: config.config.imap_user,
                    password: imapPassword,
                    host: config.config.imap_host,
                    port: config.config.imap_port,
                    tls: config.config.imap_port === 993,
                    tlsOptions: {
                        rejectUnauthorized: false // Bypass self-signed cert issues in dev
                    },
                    authTimeout: 5000
                }
            };

            const connection = await imap.connect(imapConfig);
            console.log(`[EmailService] IMAP Connection established.`);

            await connection.openBox('INBOX');
            console.log(`[EmailService] INBOX opened.`);

            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: [''], // Fetch full message body for simpleParser
                markSeen: true
            };

            const results = await connection.search(searchCriteria, fetchOptions);
            console.log(`[EmailService] Found ${results.length} unseen messages.`);

            for (const item of results) {
                try {
                    const all = item.parts.find((part: any) => part.which === '');
                    const id = item.attributes.uid;
                    const idHeader = "None";

                    if (!all) continue;

                    const parsed = await simpleParser(all.body);
                    const from = parsed.from?.text || 'Unknown';
                    const subject = parsed.subject || '(No Subject)';
                    const bodyText = parsed.text || '(No content)';
                    const messageId = parsed.messageId || `imap-${id}`;

                    console.log(`[EmailService] Processing message: From=${from}, Subject=${subject}`);

                    // Handle Attachments
                    const attachmentData: any[] = [];
                    let firstImageUrl: string | null = null;
                    let firstImageMime: string | null = null;

                    if (parsed.attachments && parsed.attachments.length > 0) {
                        console.log(`[EmailService] Found ${parsed.attachments.length} attachments. Processing...`);
                        for (const att of parsed.attachments) {
                            const fileName = att.filename || `attachment_${Date.now()}`;
                            const path = `${companyId}/${Date.now()}_${fileName}`;

                            // Assuming supabaseAdmin is defined elsewhere or needs to be imported
                            // For now, commenting out the supabase specific part as it's not in the provided context
                            // const { data: storageData, error: storageError } = await supabaseAdmin
                            //     .storage
                            //     .from('communication-attachments')
                            //     .upload(path, att.content, {
                            //         contentType: att.contentType,
                            //         cacheControl: '3600',
                            //         upsert: false
                            //     });

                            // if (storageError) {
                            //     console.error(`[EmailService] Error uploading attachment ${fileName}:`, storageError);
                            //     continue;
                            // }

                            // const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/communication-attachments/${path}`;
                            const publicUrl = `mock_url_for_${fileName}`; // Placeholder for now

                            attachmentData.push({
                                filename: fileName,
                                contentType: att.contentType,
                                size: att.size,
                                url: publicUrl
                            });

                            if (!firstImageUrl && att.contentType?.startsWith('image/')) {
                                firstImageUrl = publicUrl;
                                firstImageMime = att.contentType;
                            }
                        }
                    }

                    // Upsert conversation
                    const conversation = await Conversation.findOneAndUpdate(
                        {
                            company_id: companyId,
                            channel: 'email',
                            customer_identifier: from.split('<')[0].trim(),
                        },
                        {
                            last_message: subject,
                            last_message_at: new Date()
                        },
                        { upsert: true, new: true }
                    );

                    if (!conversation) {
                        console.error(`[EmailService] Error finding/creating conversation for ${from}`);
                        continue;
                    }

                    const axios = require('axios');
                    const coreUrl = process.env.CORE_ENGINE_URL || 'http://localhost:8082';

                    // 1. BROADCAST via Socket.io BEFORE DB insert
                    const messagePayload = {
                        id: `temp-${Date.now()}-${id}`,
                        company_id: companyId,
                        broker_id: companyId,
                        conversation_id: conversation._id.toString(),
                        channel: 'email',
                        direction: 'inbound',
                        sender: from,
                        receiver: config.config.email,
                        content: bodyText,
                        media_url: firstImageUrl,
                        media_type: firstImageMime,
                        metadata: {
                            subject: subject,
                            attachments: attachmentData
                        },
                        external_message_id: messageId,
                        status: 'received',
                        created_at: new Date().toISOString()
                    };

                    axios.post(`${coreUrl}/core/internal/broadcast`, {
                        event: 'NEW_MESSAGE',
                        payload: messagePayload
                    }).catch((err: any) => console.error(`[EmailService] Broadcast Error:`, err.message));

                    // 2. Store message
                    await Message.create({
                        company_id: companyId,
                        user_id: companyId, // Default
                        conversation_id: conversation._id.toString(),
                        channel: 'email',
                        direction: 'inbound',
                        sender: from,
                        receiver: config.config.email,
                        content: bodyText,
                        media_url: firstImageUrl || undefined,
                        media_type: firstImageMime || undefined,
                        metadata: {
                            subject: subject,
                            attachments: attachmentData
                        },
                        external_message_id: messageId,
                        status: 'received'
                    });

                    console.log(`[EmailService] Successfully synced message from ${from} with ${attachmentData.length} attachments`);
                } catch (msgParseError) {
                    console.error(`[EmailService] Error parsing Individual message:`, msgParseError);
                }
            }

            connection.end();
            console.log(`[EmailService] --- Sync Completed for Company: ${companyId} ---`);
            return results.length;
        } catch (error: any) {
            console.error('[EmailService] CRITICAL Error in syncInbox:', error);
            throw error;
        }
    }
}
