package com.leadflow.service;

import com.leadflow.repo.WorkflowsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WorkflowsApiService extends NotImplementedApiSupport {

    private final WorkflowsApiRepository repository;

    public WorkflowsApiService(WorkflowsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getWorkflowsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("workflows-api", "GET", requestPath);
    }

    public Map<String, Object> getWorkflowsapiId2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("workflows-api", "GET", requestPath);
    }

    public Map<String, Object> postWorkflowsapi3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("workflows-api", "POST", requestPath);
    }

    public Map<String, Object> patchWorkflowsapiId4(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("workflows-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteWorkflowsapiId5(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("workflows-api", "DELETE", requestPath);
    }

}
