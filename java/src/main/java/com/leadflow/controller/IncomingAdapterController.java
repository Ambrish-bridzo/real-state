package com.leadflow.controller;

import com.leadflow.service.IncomingAdapterService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class IncomingAdapterController {

    private final IncomingAdapterService service;

    public IncomingAdapterController(IncomingAdapterService service) {
        this.service = service;
    }

    @PostMapping("/incoming/webhooks/{provider}")
    public Map<String, Object> postIncomingWebhooksProvider1(HttpServletRequest request) {
        return service.postIncomingWebhooksProvider1(request.getRequestURI());
    }

}
