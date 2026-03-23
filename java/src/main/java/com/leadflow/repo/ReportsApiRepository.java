package com.leadflow.repo;

import java.util.Map;

public interface ReportsApiRepository {
    Map<String, Object> execute(String method, String path);
}
