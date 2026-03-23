package com.leadflow.repo;

import java.util.Map;

public interface ApiKeysApiRepository {
    Map<String, Object> execute(String method, String path);
}
