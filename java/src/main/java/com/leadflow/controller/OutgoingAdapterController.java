package com.leadflow.controller;

import com.leadflow.service.OutgoingAdapterService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OutgoingAdapterController {

    private final OutgoingAdapterService service;

    public OutgoingAdapterController(OutgoingAdapterService service) {
        this.service = service;
    }

    @PostMapping("/outgoing/dispatch")
    public Map<String, Object> postOutgoingDispatch1(HttpServletRequest request) {
        return service.postOutgoingDispatch1(request.getRequestURI());
    }

}
