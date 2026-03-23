package com.leadflow.repo;

import java.util.Map;

public interface CallingApiRepository {
    Map<String, Object> execute(String method, String path);
}
