package com.leadflow.repo;

public interface UserValidationRepository {
    boolean isBlockedDomain(String domain);
}
