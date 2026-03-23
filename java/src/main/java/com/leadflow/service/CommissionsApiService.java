package com.leadflow.service;

import com.leadflow.repo.CommissionsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CommissionsApiService extends NotImplementedApiSupport {

    private final CommissionsApiRepository repository;

    public CommissionsApiService(CommissionsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getCommissionsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("commissions-api", "GET", requestPath);
    }

    public Map<String, Object> postCommissionsapi2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("commissions-api", "POST", requestPath);
    }

}
