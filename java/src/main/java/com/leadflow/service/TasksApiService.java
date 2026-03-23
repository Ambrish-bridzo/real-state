package com.leadflow.service;

import com.leadflow.repo.TasksApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TasksApiService extends NotImplementedApiSupport {

    private final TasksApiRepository repository;

    public TasksApiService(TasksApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getTasksapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("tasks-api", "GET", requestPath);
    }

    public Map<String, Object> getTasksapiId2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("tasks-api", "GET", requestPath);
    }

    public Map<String, Object> postTasksapi3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("tasks-api", "POST", requestPath);
    }

    public Map<String, Object> patchTasksapiId4(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("tasks-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteTasksapiId5(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("tasks-api", "DELETE", requestPath);
    }

}
