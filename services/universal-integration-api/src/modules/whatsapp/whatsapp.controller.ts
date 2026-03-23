import express from 'express';
import { Integration } from '../../../../../shared/src/models/integration';
import { LeadService } from '../leads/lead.service';

export class WhatsAppController {
    static async handleWebhook(req: express.Request, res: express.Response) {
        const body = req.body;
        console.log('[whatsapp] Incoming webhook payload:', JSON.stringify(body));

        // Basic WhatsApp Business API payload parsing
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const change = entry?.changes?.[0];
            const message = change?.value?.messages?.[0];

            if (message) {
                const phone = message.from;
                const text = message.text?.body || '';

                // Note: We'd need to identify the company/integration by the business_phone_number_id
                // For now, let's assume we find it via meta-data in Integration settings
                const integration = await Integration.findOne({
                    type: 'whatsapp',
                    'settings.phone_number_id': change.value.metadata.phone_number_id
                });

                if (integration) {
                    const leadData = {
                        name: `WA: ${phone}`,
                        phone: phone,
                        source: 'whatsapp',
                        notes: `WhatsApp Message: ${text}`,
                        tags: ['whatsapp']
                    };

                    await LeadService.handleIngestedLead(integration.company_id, leadData, integration._id.toString());
                }
            }
        }

        return res.status(200).send('OK');
    }
}
