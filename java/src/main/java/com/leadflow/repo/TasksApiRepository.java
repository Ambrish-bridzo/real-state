package com.leadflow.repo;

import java.util.Map;

public interface TasksApiRepository {
    Map<String, Object> execute(String method, String path);
}
