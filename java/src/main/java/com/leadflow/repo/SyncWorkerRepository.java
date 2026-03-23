package com.leadflow.repo;

import java.util.Map;

public interface SyncWorkerRepository {
    Map<String, Object> execute(String method, String path);
}
