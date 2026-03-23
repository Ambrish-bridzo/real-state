package com.leadflow.repo;

import java.util.Map;

public interface UniversalIntegrationApiRepository {
    Map<String, Object> execute(String method, String path);
}
