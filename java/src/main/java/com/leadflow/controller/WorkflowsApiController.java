package com.leadflow.controller;

import com.leadflow.service.WorkflowsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkflowsApiController {

    private final WorkflowsApiService service;

    public WorkflowsApiController(WorkflowsApiService service) {
        this.service = service;
    }

    @GetMapping("/workflows-api")
    public Map<String, Object> getWorkflowsapi1(HttpServletRequest request) {
        return service.getWorkflowsapi1(request.getRequestURI());
    }

    @GetMapping("/workflows-api/{id}")
    public Map<String, Object> getWorkflowsapiId2(HttpServletRequest request) {
        return service.getWorkflowsapiId2(request.getRequestURI());
    }

    @PostMapping("/workflows-api")
    public Map<String, Object> postWorkflowsapi3(HttpServletRequest request) {
        return service.postWorkflowsapi3(request.getRequestURI());
    }

    @PatchMapping("/workflows-api/{id}")
    public Map<String, Object> patchWorkflowsapiId4(HttpServletRequest request) {
        return service.patchWorkflowsapiId4(request.getRequestURI());
    }

    @DeleteMapping("/workflows-api/{id}")
    public Map<String, Object> deleteWorkflowsapiId5(HttpServletRequest request) {
        return service.deleteWorkflowsapiId5(request.getRequestURI());
    }

}
