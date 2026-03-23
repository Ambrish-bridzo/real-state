package com.leadflow.controller;

import com.leadflow.service.WebhookDispatcherService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WebhookDispatcherController {

    private final WebhookDispatcherService service;

    public WebhookDispatcherController(WebhookDispatcherService service) {
        this.service = service;
    }

    @PostMapping("/webhook-dispatcher/dispatch")
    public Map<String, Object> postWebhookdispatcherDispatch1(HttpServletRequest request) {
        return service.postWebhookdispatcherDispatch1(request.getRequestURI());
    }

}
