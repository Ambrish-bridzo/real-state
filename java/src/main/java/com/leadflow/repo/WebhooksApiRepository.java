package com.leadflow.repo;

import java.util.Map;

public interface WebhooksApiRepository {
    Map<String, Object> execute(String method, String path);
}
