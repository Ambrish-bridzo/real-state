package com.leadflow.repo;

import java.util.Map;

public interface AuthServiceRepository {
    Map<String, Object> execute(String method, String path);
}
