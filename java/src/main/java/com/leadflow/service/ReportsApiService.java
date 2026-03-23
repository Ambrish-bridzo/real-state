package com.leadflow.service;

import com.leadflow.repo.ReportsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ReportsApiService extends NotImplementedApiSupport {

    private final ReportsApiRepository repository;

    public ReportsApiService(ReportsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getReportsapiDashboard1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("reports-api", "GET", requestPath);
    }

    public Map<String, Object> getReportsapiActivities2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("reports-api", "GET", requestPath);
    }

    public Map<String, Object> postReportsapiActivities3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("reports-api", "POST", requestPath);
    }

}
