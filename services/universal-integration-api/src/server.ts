import 'dotenv/config';
import express from 'express';
import { connectDB } from '../../../shared/src/mongodb';
import { Integration } from '../../../shared/src/models/integration';
import { IntegrationService } from './modules/integrations/integration.service';
import { LeadService } from './modules/leads/lead.service';
import { EmailParserService } from './modules/emailParser/emailParser.service';
import { WhatsAppController } from './modules/whatsapp/whatsapp.controller';

const app = express();
app.use(express.json());

connectDB();

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'universal-integration-api' }));

// ─── Universal Lead Ingestion API ───
app.post('/api/leads/ingest/:integrationId', async (req, res) => {
    const { integrationId } = req.params;
    const rawPayload = req.body;

    try {
        const integration = await Integration.findById(integrationId);
        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        if (integration.status !== 'active') {
            return res.status(403).json({ error: 'Integration is inactive' });
        }

        // Apply Transform / Mapping
        const transformedLead = IntegrationService.transformPayload(rawPayload, integration.field_mapping || {});

        // Always include campaign if present in raw payload (manual override or specific field)
        if (rawPayload.campaign) transformedLead.source_campaign = rawPayload.campaign;
        if (!transformedLead.source) transformedLead.source = integration.key || 'universal-api';

        // Process Lead
        const lead = await LeadService.handleIngestedLead(integration.company_id, transformedLead, integration._id.toString());

        return res.status(201).json({ success: true, lead_id: lead._id });
    } catch (err: any) {
        console.error('[ingest] Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// ─── WhatsApp Webhook ───
app.post('/api/integrations/whatsapp/webhook', WhatsAppController.handleWebhook);
app.get('/api/integrations/whatsapp/webhook', (req, res) => {
    // Meta verification challenge
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    return res.status(200).send(challenge);
});

// ─── Start Polling (Email) ───
setInterval(() => {
    EmailParserService.pollEmails().catch(console.error);
}, 30000); // 30 seconds poll

const port = Number(process.env.UNIVERSAL_INTEGRATION_API_PORT || 8099);
app.listen(port, () => console.log(`[universal-integration-api] listening on ${port}`));
