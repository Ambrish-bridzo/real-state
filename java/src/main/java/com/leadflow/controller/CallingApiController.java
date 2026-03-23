package com.leadflow.controller;

import com.leadflow.service.CallingApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CallingApiController {

    private final CallingApiService service;

    public CallingApiController(CallingApiService service) {
        this.service = service;
    }

    @GetMapping("/calling-api/calls")
    public Map<String, Object> getCallingapiCalls1(HttpServletRequest request) {
        return service.getCallingapiCalls1(request.getRequestURI());
    }

    @PostMapping("/calling-api/outbound/manual")
    public Map<String, Object> postCallingapiOutboundManual2(HttpServletRequest request) {
        return service.postCallingapiOutboundManual2(request.getRequestURI());
    }

}
