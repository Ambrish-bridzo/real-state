package com.leadflow.controller;

import com.leadflow.service.AttendanceApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AttendanceApiController {

    private final AttendanceApiService service;

    public AttendanceApiController(AttendanceApiService service) {
        this.service = service;
    }

    @GetMapping("/attendance-api")
    public Map<String, Object> getAttendanceapi1(HttpServletRequest request) {
        return service.getAttendanceapi1(request.getRequestURI());
    }

    @PostMapping("/attendance-api")
    public Map<String, Object> postAttendanceapi2(HttpServletRequest request) {
        return service.postAttendanceapi2(request.getRequestURI());
    }

    @PatchMapping("/attendance-api/{id}")
    public Map<String, Object> patchAttendanceapiId3(HttpServletRequest request) {
        return service.patchAttendanceapiId3(request.getRequestURI());
    }

    @GetMapping("/attendance-api/site-visits")
    public Map<String, Object> getAttendanceapiSitevisits4(HttpServletRequest request) {
        return service.getAttendanceapiSitevisits4(request.getRequestURI());
    }

    @PostMapping("/attendance-api/site-visits")
    public Map<String, Object> postAttendanceapiSitevisits5(HttpServletRequest request) {
        return service.postAttendanceapiSitevisits5(request.getRequestURI());
    }

}
