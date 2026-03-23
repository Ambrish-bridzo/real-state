package com.leadflow.repo;

import java.util.Map;

public interface SettingsApiRepository {
    Map<String, Object> execute(String method, String path);
}
