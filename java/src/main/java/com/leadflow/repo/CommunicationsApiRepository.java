package com.leadflow.repo;

import java.util.Map;

public interface CommunicationsApiRepository {
    Map<String, Object> execute(String method, String path);
}
