package com.leadflow.controller;

import com.leadflow.service.MeetingsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeetingsApiController {

    private final MeetingsApiService service;

    public MeetingsApiController(MeetingsApiService service) {
        this.service = service;
    }

    @GetMapping("/meetings-api")
    public Map<String, Object> getMeetingsapi1(HttpServletRequest request) {
        return service.getMeetingsapi1(request.getRequestURI());
    }

    @GetMapping("/meetings-api/stats")
    public Map<String, Object> getMeetingsapiStats2(HttpServletRequest request) {
        return service.getMeetingsapiStats2(request.getRequestURI());
    }

    @GetMapping("/meetings-api/{id}")
    public Map<String, Object> getMeetingsapiId3(HttpServletRequest request) {
        return service.getMeetingsapiId3(request.getRequestURI());
    }

    @PostMapping("/meetings-api")
    public Map<String, Object> postMeetingsapi4(HttpServletRequest request) {
        return service.postMeetingsapi4(request.getRequestURI());
    }

    @PatchMapping("/meetings-api/{id}")
    public Map<String, Object> patchMeetingsapiId5(HttpServletRequest request) {
        return service.patchMeetingsapiId5(request.getRequestURI());
    }

    @DeleteMapping("/meetings-api/{id}")
    public Map<String, Object> deleteMeetingsapiId6(HttpServletRequest request) {
        return service.deleteMeetingsapiId6(request.getRequestURI());
    }

}
