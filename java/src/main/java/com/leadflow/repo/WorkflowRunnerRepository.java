package com.leadflow.repo;

import java.util.Map;

public interface WorkflowRunnerRepository {
    Map<String, Object> execute(String method, String path);
}
