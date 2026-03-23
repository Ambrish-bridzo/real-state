package com.leadflow.repo;

import java.util.Map;

public interface IncomingAdapterRepository {
    Map<String, Object> execute(String method, String path);
}
