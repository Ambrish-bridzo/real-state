package com.leadflow.repo;

import java.util.Map;

public interface AdsManagerApiRepository {
    Map<String, Object> execute(String method, String path);
}
