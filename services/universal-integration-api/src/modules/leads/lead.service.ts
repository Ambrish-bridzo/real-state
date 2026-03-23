import mongoose from 'mongoose';
import { Lead, ILead } from '../../../../../shared/src/models/lead_plan';
import { AssignmentService } from '../automation/assignment.service';
import { AutomationService } from '../automation/automation.service';

export class LeadService {
    static async handleIngestedLead(companyId: string, leadData: any, integrationId: string) {
        // 1. Check Duplicates
        const duplicate = await this.checkDuplicate(companyId, leadData);
        
        let lead;
        if (duplicate) {
            lead = await Lead.create({
                ...leadData,
                company_id: companyId,
                is_duplicate: true,
                duplicate_of: duplicate._id,
                status: 'duplicate'
            });
        } else {
            // 2. Assign Agent
            const agentId = await AssignmentService.assignAgent(companyId);
            
            // 3. Save Lead
            lead = await Lead.create({
                ...leadData,
                company_id: companyId,
                assigned_to: agentId,
                status: 'new'
            });
        }

        // 4. Trigger Automation
        await AutomationService.triggerPostIngestion(lead);

        return lead;
    }

    private static async checkDuplicate(companyId: string, data: any) {
        const { email, phone, external_id } = data;
        const filter: any = { company_id: companyId };
        
        const conditions = [];
        if (email) conditions.push({ email });
        if (phone) conditions.push({ phone });
        if (external_id) conditions.push({ external_id });

        if (conditions.length === 0) return null;

        return await Lead.findOne({ 
            company_id: companyId,
            $or: conditions 
        });
    }
}
