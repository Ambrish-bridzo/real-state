package com.leadflow.controller;

import com.leadflow.service.IntegrationManagerService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IntegrationManagerController {

    private final IntegrationManagerService service;

    public IntegrationManagerController(IntegrationManagerService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, Object> getHealth1(HttpServletRequest request) {
        return service.getHealth1(request.getRequestURI());
    }

    @GetMapping("/integration-manager")
    public Map<String, Object> getIntegrationmanager2(HttpServletRequest request) {
        return service.getIntegrationmanager2(request.getRequestURI());
    }

    @GetMapping("/integration-manager/{key}/status")
    public Map<String, Object> getIntegrationmanagerKeyStatus3(HttpServletRequest request) {
        return service.getIntegrationmanagerKeyStatus3(request.getRequestURI());
    }

    @PostMapping("/integration-manager")
    public Map<String, Object> postIntegrationmanager4(HttpServletRequest request) {
        return service.postIntegrationmanager4(request.getRequestURI());
    }

    @PatchMapping("/integration-manager/{id}")
    public Map<String, Object> patchIntegrationmanagerId5(HttpServletRequest request) {
        return service.patchIntegrationmanagerId5(request.getRequestURI());
    }

    @DeleteMapping("/integration-manager/{id}")
    public Map<String, Object> deleteIntegrationmanagerId6(HttpServletRequest request) {
        return service.deleteIntegrationmanagerId6(request.getRequestURI());
    }

    @PostMapping("/integration-manager/{key}/sync")
    public Map<String, Object> postIntegrationmanagerKeySync7(HttpServletRequest request) {
        return service.postIntegrationmanagerKeySync7(request.getRequestURI());
    }

}
