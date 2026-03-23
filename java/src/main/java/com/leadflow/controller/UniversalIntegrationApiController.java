package com.leadflow.controller;

import com.leadflow.service.UniversalIntegrationApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UniversalIntegrationApiController {

    private final UniversalIntegrationApiService service;

    public UniversalIntegrationApiController(UniversalIntegrationApiService service) {
        this.service = service;
    }

    @PostMapping("/api/leads/ingest/{integrationId}")
    public Map<String, Object> postApiLeadsIngestIntegrationid1(HttpServletRequest request) {
        return service.postApiLeadsIngestIntegrationid1(request.getRequestURI());
    }

    @PostMapping("/api/integrations/whatsapp/webhook")
    public Map<String, Object> postApiIntegrationsWhatsappWebhook2(HttpServletRequest request) {
        return service.postApiIntegrationsWhatsappWebhook2(request.getRequestURI());
    }

    @GetMapping("/api/integrations/whatsapp/webhook")
    public Map<String, Object> getApiIntegrationsWhatsappWebhook3(HttpServletRequest request) {
        return service.getApiIntegrationsWhatsappWebhook3(request.getRequestURI());
    }

}
