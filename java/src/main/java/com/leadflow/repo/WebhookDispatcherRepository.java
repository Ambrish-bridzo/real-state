package com.leadflow.repo;

import java.util.Map;

public interface WebhookDispatcherRepository {
    Map<String, Object> execute(String method, String path);
}
