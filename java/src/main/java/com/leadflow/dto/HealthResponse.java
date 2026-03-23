package com.leadflow.dto;

import java.time.Instant;
import java.util.Map;

public record HealthResponse(
    String status,
    String version,
    Instant timestamp,
    String environment,
    Map<String, String> services
) {
}
