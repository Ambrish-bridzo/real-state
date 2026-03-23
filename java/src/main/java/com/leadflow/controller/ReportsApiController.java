package com.leadflow.controller;

import com.leadflow.service.ReportsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReportsApiController {

    private final ReportsApiService service;

    public ReportsApiController(ReportsApiService service) {
        this.service = service;
    }

    @GetMapping("/reports-api/dashboard")
    public Map<String, Object> getReportsapiDashboard1(HttpServletRequest request) {
        return service.getReportsapiDashboard1(request.getRequestURI());
    }

    @GetMapping("/reports-api/activities")
    public Map<String, Object> getReportsapiActivities2(HttpServletRequest request) {
        return service.getReportsapiActivities2(request.getRequestURI());
    }

    @PostMapping("/reports-api/activities")
    public Map<String, Object> postReportsapiActivities3(HttpServletRequest request) {
        return service.postReportsapiActivities3(request.getRequestURI());
    }

}
