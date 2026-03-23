package com.leadflow.service;

import com.leadflow.repo.DealsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DealsApiService extends NotImplementedApiSupport {

    private final DealsApiRepository repository;

    public DealsApiService(DealsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getDealsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("deals-api", "GET", requestPath);
    }

    public Map<String, Object> getDealsapiId2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("deals-api", "GET", requestPath);
    }

    public Map<String, Object> postDealsapi3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("deals-api", "POST", requestPath);
    }

    public Map<String, Object> patchDealsapiId4(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("deals-api", "PATCH", requestPath);
    }

    public Map<String, Object> patchDealsapiIdStage5(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("deals-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteDealsapiId6(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("deals-api", "DELETE", requestPath);
    }

}
