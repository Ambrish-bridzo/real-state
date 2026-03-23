package com.leadflow.repo;

import java.util.Map;

public interface AdminApiRepository {
    Map<String, Object> execute(String method, String path);
}
