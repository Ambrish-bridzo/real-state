package com.leadflow.service;

import com.leadflow.repo.LeadsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class LeadsApiService extends NotImplementedApiSupport {

    private final LeadsApiRepository repository;

    public LeadsApiService(LeadsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getLeadsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("leads-api", "GET", requestPath);
    }

    public Map<String, Object> getLeadsapiId2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("leads-api", "GET", requestPath);
    }

    public Map<String, Object> postLeadsapi3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("leads-api", "POST", requestPath);
    }

    public Map<String, Object> patchLeadsapiId4(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("leads-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteLeadsapiId5(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("leads-api", "DELETE", requestPath);
    }

}
