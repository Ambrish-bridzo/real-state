package com.leadflow.controller;

import com.leadflow.service.CoreEngineService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CoreEngineController {

    private final CoreEngineService service;

    public CoreEngineController(CoreEngineService service) {
        this.service = service;
    }

    @GetMapping("/core/profile")
    public Map<String, Object> getCoreProfile1(HttpServletRequest request) {
        return service.getCoreProfile1(request.getRequestURI());
    }

    @PostMapping("/core/features/check")
    public Map<String, Object> postCoreFeaturesCheck2(HttpServletRequest request) {
        return service.postCoreFeaturesCheck2(request.getRequestURI());
    }

    @GetMapping("/core/audit-logs")
    public Map<String, Object> getCoreAuditlogs3(HttpServletRequest request) {
        return service.getCoreAuditlogs3(request.getRequestURI());
    }

    @GetMapping("/core/notifications")
    public Map<String, Object> getCoreNotifications4(HttpServletRequest request) {
        return service.getCoreNotifications4(request.getRequestURI());
    }

    @GetMapping("/core/notifications/stream")
    public Map<String, Object> getCoreNotificationsStream5(HttpServletRequest request) {
        return service.getCoreNotificationsStream5(request.getRequestURI());
    }

    @PostMapping("/core/notifications/read-all")
    public Map<String, Object> postCoreNotificationsReadall6(HttpServletRequest request) {
        return service.postCoreNotificationsReadall6(request.getRequestURI());
    }

    @PostMapping("/core/internal/notify")
    public Map<String, Object> postCoreInternalNotify7(HttpServletRequest request) {
        return service.postCoreInternalNotify7(request.getRequestURI());
    }

    @PostMapping("/core/internal/broadcast")
    public Map<String, Object> postCoreInternalBroadcast8(HttpServletRequest request) {
        return service.postCoreInternalBroadcast8(request.getRequestURI());
    }

}
