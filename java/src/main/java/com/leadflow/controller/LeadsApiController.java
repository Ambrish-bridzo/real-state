package com.leadflow.controller;

import com.leadflow.service.LeadsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LeadsApiController {

    private final LeadsApiService service;

    public LeadsApiController(LeadsApiService service) {
        this.service = service;
    }

    @GetMapping("/leads-api")
    public Map<String, Object> getLeadsapi1(HttpServletRequest request) {
        return service.getLeadsapi1(request.getRequestURI());
    }

    @GetMapping("/leads-api/{id}")
    public Map<String, Object> getLeadsapiId2(HttpServletRequest request) {
        return service.getLeadsapiId2(request.getRequestURI());
    }

    @PostMapping("/leads-api")
    public Map<String, Object> postLeadsapi3(HttpServletRequest request) {
        return service.postLeadsapi3(request.getRequestURI());
    }

    @PatchMapping("/leads-api/{id}")
    public Map<String, Object> patchLeadsapiId4(HttpServletRequest request) {
        return service.patchLeadsapiId4(request.getRequestURI());
    }

    @DeleteMapping("/leads-api/{id}")
    public Map<String, Object> deleteLeadsapiId5(HttpServletRequest request) {
        return service.deleteLeadsapiId5(request.getRequestURI());
    }

}
