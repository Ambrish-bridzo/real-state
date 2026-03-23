package com.leadflow.repo;

import java.util.Map;

public interface DealsApiRepository {
    Map<String, Object> execute(String method, String path);
}
