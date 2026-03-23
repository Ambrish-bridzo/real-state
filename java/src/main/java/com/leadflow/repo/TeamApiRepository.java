package com.leadflow.repo;

import java.util.Map;

public interface TeamApiRepository {
    Map<String, Object> execute(String method, String path);
}
