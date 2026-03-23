package com.leadflow.controller;

import com.leadflow.service.ApiKeysApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiKeysApiController {

    private final ApiKeysApiService service;

    public ApiKeysApiController(ApiKeysApiService service) {
        this.service = service;
    }

    @GetMapping("/api-keys-api")
    public Map<String, Object> getApikeysapi1(HttpServletRequest request) {
        return service.getApikeysapi1(request.getRequestURI());
    }

    @PostMapping("/api-keys-api")
    public Map<String, Object> postApikeysapi2(HttpServletRequest request) {
        return service.postApikeysapi2(request.getRequestURI());
    }

}
