package com.leadflow.controller;

import com.leadflow.service.WebhooksApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebhooksApiController {

    private final WebhooksApiService service;

    public WebhooksApiController(WebhooksApiService service) {
        this.service = service;
    }

    @GetMapping("/webhooks-api")
    public Map<String, Object> getWebhooksapi1(HttpServletRequest request) {
        return service.getWebhooksapi1(request.getRequestURI());
    }

    @PostMapping("/webhooks-api")
    public Map<String, Object> postWebhooksapi2(HttpServletRequest request) {
        return service.postWebhooksapi2(request.getRequestURI());
    }

    @PatchMapping("/webhooks-api/{id}")
    public Map<String, Object> patchWebhooksapiId3(HttpServletRequest request) {
        return service.patchWebhooksapiId3(request.getRequestURI());
    }

    @DeleteMapping("/webhooks-api/{id}")
    public Map<String, Object> deleteWebhooksapiId4(HttpServletRequest request) {
        return service.deleteWebhooksapiId4(request.getRequestURI());
    }

    @GetMapping("/webhooks-api/{id}/events")
    public Map<String, Object> getWebhooksapiIdEvents5(HttpServletRequest request) {
        return service.getWebhooksapiIdEvents5(request.getRequestURI());
    }

}
