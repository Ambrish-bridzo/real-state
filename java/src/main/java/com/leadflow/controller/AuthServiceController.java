package com.leadflow.controller;

import com.leadflow.service.AuthServiceService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthServiceController {

    private final AuthServiceService service;

    public AuthServiceController(AuthServiceService service) {
        this.service = service;
    }

    @PostMapping("/auth/onboard")
    public Map<String, Object> postAuthOnboard1(HttpServletRequest request) {
        return service.postAuthOnboard1(request.getRequestURI());
    }

    @PostMapping("/auth/login")
    public Map<String, Object> postAuthLogin2(HttpServletRequest request) {
        return service.postAuthLogin2(request.getRequestURI());
    }

    @PostMapping("/auth/signup")
    public Map<String, Object> postAuthSignup3(HttpServletRequest request) {
        return service.postAuthSignup3(request.getRequestURI());
    }

    @PostMapping("/auth/forgot-password")
    public Map<String, Object> postAuthForgotpassword4(HttpServletRequest request) {
        return service.postAuthForgotpassword4(request.getRequestURI());
    }

    @PostMapping("/auth/reset-password")
    public Map<String, Object> postAuthResetpassword5(HttpServletRequest request) {
        return service.postAuthResetpassword5(request.getRequestURI());
    }

    @PostMapping("/auth/verify-2fa")
    public Map<String, Object> postAuthVerify2fa6(HttpServletRequest request) {
        return service.postAuthVerify2fa6(request.getRequestURI());
    }

    @GetMapping("/auth/session")
    public Map<String, Object> getAuthSession7(HttpServletRequest request) {
        return service.getAuthSession7(request.getRequestURI());
    }

    @PostMapping("/auth/logout")
    public Map<String, Object> postAuthLogout8(HttpServletRequest request) {
        return service.postAuthLogout8(request.getRequestURI());
    }

}
