package com.leadflow.service;

import com.leadflow.repo.WorkflowRunnerRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WorkflowRunnerService extends NotImplementedApiSupport {

    private final WorkflowRunnerRepository repository;

    public WorkflowRunnerService(WorkflowRunnerRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postWorkflowrunnerProcesstriggers1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("workflow-runner", "POST", requestPath);
    }

    public Map<String, Object> postWorkflowrunnerRunId2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("workflow-runner", "POST", requestPath);
    }

    public Map<String, Object> getWorkflowrunnerRuns3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("workflow-runner", "GET", requestPath);
    }

}
