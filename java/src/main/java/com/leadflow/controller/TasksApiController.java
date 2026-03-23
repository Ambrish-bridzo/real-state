package com.leadflow.controller;

import com.leadflow.service.TasksApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TasksApiController {

    private final TasksApiService service;

    public TasksApiController(TasksApiService service) {
        this.service = service;
    }

    @GetMapping("/tasks-api")
    public Map<String, Object> getTasksapi1(HttpServletRequest request) {
        return service.getTasksapi1(request.getRequestURI());
    }

    @GetMapping("/tasks-api/{id}")
    public Map<String, Object> getTasksapiId2(HttpServletRequest request) {
        return service.getTasksapiId2(request.getRequestURI());
    }

    @PostMapping("/tasks-api")
    public Map<String, Object> postTasksapi3(HttpServletRequest request) {
        return service.postTasksapi3(request.getRequestURI());
    }

    @PatchMapping("/tasks-api/{id}")
    public Map<String, Object> patchTasksapiId4(HttpServletRequest request) {
        return service.patchTasksapiId4(request.getRequestURI());
    }

    @DeleteMapping("/tasks-api/{id}")
    public Map<String, Object> deleteTasksapiId5(HttpServletRequest request) {
        return service.deleteTasksapiId5(request.getRequestURI());
    }

}
