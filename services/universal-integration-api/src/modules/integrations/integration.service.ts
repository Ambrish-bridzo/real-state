export class IntegrationService {
    static transformPayload(payload: any, mapping: Record<string, string>) {
        const result: any = {};
        for (const [externalField, crmField] of Object.entries(mapping)) {
            if (payload[externalField] !== undefined) {
                result[crmField] = payload[externalField];
            }
        }
        return result;
    }
}
