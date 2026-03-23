package com.leadflow.repo;

import java.util.Map;

public interface IntegrationManagerRepository {
    Map<String, Object> execute(String method, String path);
}
