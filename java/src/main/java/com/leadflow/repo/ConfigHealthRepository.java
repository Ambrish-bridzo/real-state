package com.leadflow.repo;

import com.leadflow.config.LeadflowProperties;
import com.leadflow.module.health.HealthStatus;
import java.util.Map;
import org.springframework.stereotype.Repository;

@Repository
public class ConfigHealthRepository implements HealthRepository {

    private final LeadflowProperties properties;

    public ConfigHealthRepository(LeadflowProperties properties) {
        this.properties = properties;
    }

    @Override
    public HealthStatus getStatus() {
        return new HealthStatus(
            "ok",
            properties.getApi().getVersion(),
            properties.getApi().getEnvironment(),
            Map.of(
                "database", properties.getServices().getDatabase(),
                "local_gateway", properties.getServices().getLocalGateway()
            )
        );
    }
}
