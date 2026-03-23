package com.leadflow.controller;

import com.leadflow.service.SyncWorkerService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SyncWorkerController {

    private final SyncWorkerService service;

    public SyncWorkerController(SyncWorkerService service) {
        this.service = service;
    }

    @PostMapping("/sync-worker/process")
    public Map<String, Object> postSyncworkerProcess1(HttpServletRequest request) {
        return service.postSyncworkerProcess1(request.getRequestURI());
    }

}
