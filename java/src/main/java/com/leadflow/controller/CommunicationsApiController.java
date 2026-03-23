package com.leadflow.controller;

import com.leadflow.service.CommunicationsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommunicationsApiController {

    private final CommunicationsApiService service;

    public CommunicationsApiController(CommunicationsApiService service) {
        this.service = service;
    }

    @GetMapping("/communications-api/api/whatsapp/config")
    public Map<String, Object> getCommunicationsapiApiWhatsappConfig1(HttpServletRequest request) {
        return service.getCommunicationsapiApiWhatsappConfig1(request.getRequestURI());
    }

    @PostMapping("/communications-api/api/whatsapp/config")
    public Map<String, Object> postCommunicationsapiApiWhatsappConfig2(HttpServletRequest request) {
        return service.postCommunicationsapiApiWhatsappConfig2(request.getRequestURI());
    }

    @GetMapping("/communications-api/api/email/config")
    public Map<String, Object> getCommunicationsapiApiEmailConfig3(HttpServletRequest request) {
        return service.getCommunicationsapiApiEmailConfig3(request.getRequestURI());
    }

    @PostMapping("/communications-api/api/email/config")
    public Map<String, Object> postCommunicationsapiApiEmailConfig4(HttpServletRequest request) {
        return service.postCommunicationsapiApiEmailConfig4(request.getRequestURI());
    }

    @PostMapping("/communications-api/media/upload")
    public Map<String, Object> postCommunicationsapiMediaUpload5(HttpServletRequest request) {
        return service.postCommunicationsapiMediaUpload5(request.getRequestURI());
    }

    @PostMapping("/communications-api/send")
    public Map<String, Object> postCommunicationsapiSend6(HttpServletRequest request) {
        return service.postCommunicationsapiSend6(request.getRequestURI());
    }

    @GetMapping("/communications-api/messages")
    public Map<String, Object> getCommunicationsapiMessages7(HttpServletRequest request) {
        return service.getCommunicationsapiMessages7(request.getRequestURI());
    }

}
