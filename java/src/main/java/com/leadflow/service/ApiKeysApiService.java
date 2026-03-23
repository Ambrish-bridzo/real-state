package com.leadflow.service;

import com.leadflow.repo.ApiKeysApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ApiKeysApiService extends NotImplementedApiSupport {

    private final ApiKeysApiRepository repository;

    public ApiKeysApiService(ApiKeysApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getApikeysapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("api-keys-api", "GET", requestPath);
    }

    public Map<String, Object> postApikeysapi2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("api-keys-api", "POST", requestPath);
    }

}
