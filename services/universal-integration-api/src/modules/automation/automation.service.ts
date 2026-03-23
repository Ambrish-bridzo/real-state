import { ILead } from '../../../../../shared/src/models/lead_plan';

export class AutomationService {
    static async triggerPostIngestion(lead: ILead) {
        console.log(`[automation] Triggering post-ingestion for lead ${lead._id}`);

        // Example: Add tag based on source
        if (lead.source && !lead.tags.includes(lead.source)) {
            lead.tags.push(lead.source);
        }

        // Set next follow up (e.g., in 24 hours)
        const nextFollowUp = new Date();
        nextFollowUp.setHours(nextFollowUp.getHours() + 24);
        lead.next_follow_up = nextFollowUp;

        await lead.save();

        // Emit Socket Event (placeholder)
        // In real app, emit to Socket.IO
    }
}
