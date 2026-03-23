package com.leadflow.controller;

import com.leadflow.service.TeamApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TeamApiController {

    private final TeamApiService service;

    public TeamApiController(TeamApiService service) {
        this.service = service;
    }

    @GetMapping("/team-api")
    public Map<String, Object> getTeamapi1(HttpServletRequest request) {
        return service.getTeamapi1(request.getRequestURI());
    }

    @PostMapping("/team-api/invite")
    public Map<String, Object> postTeamapiInvite2(HttpServletRequest request) {
        return service.postTeamapiInvite2(request.getRequestURI());
    }

    @PatchMapping("/team-api/{id}")
    public Map<String, Object> patchTeamapiId3(HttpServletRequest request) {
        return service.patchTeamapiId3(request.getRequestURI());
    }

}
