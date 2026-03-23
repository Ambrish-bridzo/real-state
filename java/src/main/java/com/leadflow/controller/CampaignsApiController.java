package com.leadflow.controller;

import com.leadflow.service.CampaignsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CampaignsApiController {

    private final CampaignsApiService service;

    public CampaignsApiController(CampaignsApiService service) {
        this.service = service;
    }

    @GetMapping("/campaigns-api")
    public Map<String, Object> getCampaignsapi1(HttpServletRequest request) {
        return service.getCampaignsapi1(request.getRequestURI());
    }

    @PostMapping("/campaigns-api")
    public Map<String, Object> postCampaignsapi2(HttpServletRequest request) {
        return service.postCampaignsapi2(request.getRequestURI());
    }

    @GetMapping("/campaigns-api/{id}/metrics")
    public Map<String, Object> getCampaignsapiIdMetrics3(HttpServletRequest request) {
        return service.getCampaignsapiIdMetrics3(request.getRequestURI());
    }

}
