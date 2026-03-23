package com.leadflow.repo;

import java.util.Map;

public interface AttendanceApiRepository {
    Map<String, Object> execute(String method, String path);
}
