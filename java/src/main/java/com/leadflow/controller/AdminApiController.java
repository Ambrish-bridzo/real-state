package com.leadflow.controller;

import com.leadflow.service.AdminApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminApiController {

    private final AdminApiService service;

    public AdminApiController(AdminApiService service) {
        this.service = service;
    }

    @GetMapping("/admin-api/tenants")
    public Map<String, Object> getAdminapiTenants1(HttpServletRequest request) {
        return service.getAdminapiTenants1(request.getRequestURI());
    }

    @PatchMapping("/admin-api/tenants/{id}")
    public Map<String, Object> patchAdminapiTenantsId2(HttpServletRequest request) {
        return service.patchAdminapiTenantsId2(request.getRequestURI());
    }

    @GetMapping("/admin-api/onboarding")
    public Map<String, Object> getAdminapiOnboarding3(HttpServletRequest request) {
        return service.getAdminapiOnboarding3(request.getRequestURI());
    }

    @GetMapping("/admin-api/plans")
    public Map<String, Object> getAdminapiPlans4(HttpServletRequest request) {
        return service.getAdminapiPlans4(request.getRequestURI());
    }

    @PostMapping("/admin-api/plans")
    public Map<String, Object> postAdminapiPlans5(HttpServletRequest request) {
        return service.postAdminapiPlans5(request.getRequestURI());
    }

    @PatchMapping("/admin-api/plans/{id}")
    public Map<String, Object> patchAdminapiPlansId6(HttpServletRequest request) {
        return service.patchAdminapiPlansId6(request.getRequestURI());
    }

    @DeleteMapping("/admin-api/plans/{id}")
    public Map<String, Object> deleteAdminapiPlansId7(HttpServletRequest request) {
        return service.deleteAdminapiPlansId7(request.getRequestURI());
    }

    @GetMapping("/admin-api/revenue")
    public Map<String, Object> getAdminapiRevenue8(HttpServletRequest request) {
        return service.getAdminapiRevenue8(request.getRequestURI());
    }

    @GetMapping("/admin-api/profiles")
    public Map<String, Object> getAdminapiProfiles9(HttpServletRequest request) {
        return service.getAdminapiProfiles9(request.getRequestURI());
    }

    @GetMapping("/admin-api/admins")
    public Map<String, Object> getAdminapiAdmins10(HttpServletRequest request) {
        return service.getAdminapiAdmins10(request.getRequestURI());
    }

    @PostMapping("/admin-api/admins")
    public Map<String, Object> postAdminapiAdmins11(HttpServletRequest request) {
        return service.postAdminapiAdmins11(request.getRequestURI());
    }

}
