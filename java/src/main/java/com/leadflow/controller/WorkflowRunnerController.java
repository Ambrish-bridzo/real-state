package com.leadflow.controller;

import com.leadflow.service.WorkflowRunnerService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkflowRunnerController {

    private final WorkflowRunnerService service;

    public WorkflowRunnerController(WorkflowRunnerService service) {
        this.service = service;
    }

    @PostMapping("/workflow-runner/process-triggers")
    public Map<String, Object> postWorkflowrunnerProcesstriggers1(HttpServletRequest request) {
        return service.postWorkflowrunnerProcesstriggers1(request.getRequestURI());
    }

    @PostMapping("/workflow-runner/run/{id}")
    public Map<String, Object> postWorkflowrunnerRunId2(HttpServletRequest request) {
        return service.postWorkflowrunnerRunId2(request.getRequestURI());
    }

    @GetMapping("/workflow-runner/runs")
    public Map<String, Object> getWorkflowrunnerRuns3(HttpServletRequest request) {
        return service.getWorkflowrunnerRuns3(request.getRequestURI());
    }

}
