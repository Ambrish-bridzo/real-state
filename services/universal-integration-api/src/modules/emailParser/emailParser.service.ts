import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { Integration } from '../../../../../shared/src/models/integration';
import { LeadService } from '../leads/lead.service';

export class EmailParserService {
    static async pollEmails() {
        // This would be called by a cron job or interval
        const integrations = await Integration.find({ type: 'email', status: 'active' });

        for (const integration of integrations) {
            try {
                await this.processIntegration(integration);
            } catch (err) {
                console.error(`[email-parser] Failed for ${integration._id}:`, err);
            }
        }
    }

    private static async processIntegration(integration: any) {
        const { host, user, password, port } = integration.settings;
        if (!host || !user || !password) return;

        const config = {
            imap: {
                user,
                password,
                host,
                port: port || 993,
                tls: true,
                authTimeout: 3000
            }
        };

        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true };

        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const message of messages) {
            const all = message.parts.find(p => p.which === 'TEXT');
            const id = message.attributes.uid;
            const idHeader = `Imap-Id: ${id}\r\n`;

            const parsed = await simpleParser(idHeader + all?.body);
            const body = parsed.text || '';
            const source = this.detectPortal(body);

            if (source) {
                const leadData = this.parseLead(body, source);
                if (leadData) {
                    await LeadService.handleIngestedLead(integration.company_id, leadData, integration._id);
                }
            }
        }

        connection.end();
    }

    private static detectPortal(body: string): string | null {
        if (body.toLowerCase().includes('magicbricks')) return 'magicbricks';
        if (body.toLowerCase().includes('nobroker')) return 'nobroker';
        if (body.toLowerCase().includes('99acres')) return '99acres';
        return null;
    }

    private static parseLead(body: string, source: string): any {
        // Simple regex patterns
        const patterns: Record<string, { name: RegExp, phone: RegExp, email: RegExp }> = {
            'magicbricks': {
                name: /Name:\s*(.*)/i,
                phone: /Phone:\s*(\d+)/i,
                email: /Email:\s*([\w\.-]+@[\w\.-]+\.\w+)/i
            },
            'nobroker': {
                name: /Lead Name:\s*(.*)/i,
                phone: /Contact:\s*(\d+)/i,
                email: /Email ID:\s*([\w\.-]+@[\w\.-]+\.\w+)/i
            },
            '99acres': {
                name: /Inquiry from\s*(.*)/i,
                phone: /Mobile:\s*(\d+)/i,
                email: /Email:\s*([\w\.-]+@[\w\.-]+\.\w+)/i
            }
        };

        const p = patterns[source];
        if (!p) return null;

        return {
            name: body.match(p.name)?.[1]?.trim() || 'Portal Lead',
            phone: body.match(p.phone)?.[1],
            email: body.match(p.email)?.[1],
            source: source
        };
    }
}
