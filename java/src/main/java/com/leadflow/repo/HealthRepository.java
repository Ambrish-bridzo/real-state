package com.leadflow.repo;

import com.leadflow.module.health.HealthStatus;

public interface HealthRepository {
    HealthStatus getStatus();
}
