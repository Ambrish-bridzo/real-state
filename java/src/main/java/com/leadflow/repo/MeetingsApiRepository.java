package com.leadflow.repo;

import java.util.Map;

public interface MeetingsApiRepository {
    Map<String, Object> execute(String method, String path);
}
