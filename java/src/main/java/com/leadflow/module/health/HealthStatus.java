package com.leadflow.module.health;

import java.util.Map;

public record HealthStatus(
    String status,
    String version,
    String environment,
    Map<String, String> services
) {
}
