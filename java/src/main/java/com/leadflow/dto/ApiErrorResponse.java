package com.leadflow.dto;

import java.time.Instant;

public record ApiErrorResponse(
    String errorCode,
    String message,
    int status,
    Instant timestamp,
    String path
) {
}
