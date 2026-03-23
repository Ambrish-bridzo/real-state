package com.leadflow.module.validation;

public record UserValidationResult(
    boolean valid,
    String message,
    String normalizedEmail
) {
}
