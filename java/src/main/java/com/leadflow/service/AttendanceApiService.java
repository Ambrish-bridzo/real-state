package com.leadflow.service;

import com.leadflow.repo.AttendanceApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AttendanceApiService extends NotImplementedApiSupport {

    private final AttendanceApiRepository repository;

    public AttendanceApiService(AttendanceApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getAttendanceapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("attendance-api", "GET", requestPath);
    }

    public Map<String, Object> postAttendanceapi2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("attendance-api", "POST", requestPath);
    }

    public Map<String, Object> patchAttendanceapiId3(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("attendance-api", "PATCH", requestPath);
    }

    public Map<String, Object> getAttendanceapiSitevisits4(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("attendance-api", "GET", requestPath);
    }

    public Map<String, Object> postAttendanceapiSitevisits5(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("attendance-api", "POST", requestPath);
    }

}
