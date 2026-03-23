package com.leadflow.dto;

public record UserValidationResponse(
    boolean valid,
    String message,
    String normalizedEmail
) {
}
