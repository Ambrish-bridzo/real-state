package com.leadflow.repo;

import com.leadflow.config.LeadflowProperties;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class ConfigUserValidationRepository implements UserValidationRepository {

    private final LeadflowProperties properties;

    public ConfigUserValidationRepository(LeadflowProperties properties) {
        this.properties = properties;
    }

    @Override
    public boolean isBlockedDomain(String domain) {
        List<String> blocked = properties.getValidation().getBlockedDomains();
        if (blocked == null) {
            return false;
        }
        return blocked.stream().anyMatch(item -> item.equalsIgnoreCase(domain));
    }
}
