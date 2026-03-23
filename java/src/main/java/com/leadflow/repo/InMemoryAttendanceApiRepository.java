package com.leadflow.repo;

import java.util.Map;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryAttendanceApiRepository implements AttendanceApiRepository {
    @Override
    public Map<String, Object> execute(String method, String path) {
        return Map.of("method", method, "path", path);
    }
}
