package com.leadflow.repo;

import java.util.Map;

public interface WorkflowsApiRepository {
    Map<String, Object> execute(String method, String path);
}
