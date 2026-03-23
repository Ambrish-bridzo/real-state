import { Profile } from '../../../../../shared/src/models/company_profile';

export class AssignmentService {
    static async assignAgent(companyId: string): Promise<string | undefined> {
        // Simple Round Robin base implementation
        // In a real app, this would use a counter or Redis to track last assigned
        const activeAgents = await Profile.find({
            company_id: companyId,
            role: 'agent',
            status: 'active'
        });

        if (activeAgents.length === 0) return undefined;

        // For demo/prototype, pick a random active agent or the first one
        // Ideally we'd keep track of 'last_assigned_index' in Company Settings
        const randomIndex = Math.floor(Math.random() * activeAgents.length);
        return activeAgents[randomIndex].user_id;
    }
}
