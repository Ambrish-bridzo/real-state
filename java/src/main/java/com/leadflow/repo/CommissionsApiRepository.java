package com.leadflow.repo;

import java.util.Map;

public interface CommissionsApiRepository {
    Map<String, Object> execute(String method, String path);
}
