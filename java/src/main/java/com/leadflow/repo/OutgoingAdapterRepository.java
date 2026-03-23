package com.leadflow.repo;

import java.util.Map;

public interface OutgoingAdapterRepository {
    Map<String, Object> execute(String method, String path);
}
