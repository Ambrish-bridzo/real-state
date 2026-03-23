package com.leadflow.service;

import com.leadflow.dto.HealthResponse;
import com.leadflow.module.health.HealthStatus;
import com.leadflow.repo.HealthRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class HealthService {
    private static final Logger log = LoggerFactory.getLogger(HealthService.class);
    private final HealthRepository healthRepository;

    public HealthService(HealthRepository healthRepository) {
        this.healthRepository = healthRepository;
    }

    public HealthResponse health() {
        log.info("Building health response");
        HealthStatus status = healthRepository.getStatus();
        return new HealthResponse(
            status.status(),
            status.version(),
            Instant.now(),
            status.environment(),
            status.services()
        );
    }
}
