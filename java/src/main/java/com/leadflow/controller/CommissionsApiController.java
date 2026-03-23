package com.leadflow.controller;

import com.leadflow.service.CommissionsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommissionsApiController {

    private final CommissionsApiService service;

    public CommissionsApiController(CommissionsApiService service) {
        this.service = service;
    }

    @GetMapping("/commissions-api")
    public Map<String, Object> getCommissionsapi1(HttpServletRequest request) {
        return service.getCommissionsapi1(request.getRequestURI());
    }

    @PostMapping("/commissions-api")
    public Map<String, Object> postCommissionsapi2(HttpServletRequest request) {
        return service.postCommissionsapi2(request.getRequestURI());
    }

}
