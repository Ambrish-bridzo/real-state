package com.leadflow.controller;

import com.leadflow.service.DealsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DealsApiController {

    private final DealsApiService service;

    public DealsApiController(DealsApiService service) {
        this.service = service;
    }

    @GetMapping("/deals-api")
    public Map<String, Object> getDealsapi1(HttpServletRequest request) {
        return service.getDealsapi1(request.getRequestURI());
    }

    @GetMapping("/deals-api/{id}")
    public Map<String, Object> getDealsapiId2(HttpServletRequest request) {
        return service.getDealsapiId2(request.getRequestURI());
    }

    @PostMapping("/deals-api")
    public Map<String, Object> postDealsapi3(HttpServletRequest request) {
        return service.postDealsapi3(request.getRequestURI());
    }

    @PatchMapping("/deals-api/{id}")
    public Map<String, Object> patchDealsapiId4(HttpServletRequest request) {
        return service.patchDealsapiId4(request.getRequestURI());
    }

    @PatchMapping("/deals-api/{id}/stage")
    public Map<String, Object> patchDealsapiIdStage5(HttpServletRequest request) {
        return service.patchDealsapiIdStage5(request.getRequestURI());
    }

    @DeleteMapping("/deals-api/{id}")
    public Map<String, Object> deleteDealsapiId6(HttpServletRequest request) {
        return service.deleteDealsapiId6(request.getRequestURI());
    }

}
