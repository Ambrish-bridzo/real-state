package com.leadflow.repo;

import java.util.Map;

public interface CoreEngineRepository {
    Map<String, Object> execute(String method, String path);
}
