package com.leadflow.controller;

import com.leadflow.service.SettingsApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SettingsApiController {

    private final SettingsApiService service;

    public SettingsApiController(SettingsApiService service) {
        this.service = service;
    }

    @GetMapping("/settings-api/profile")
    public Map<String, Object> getSettingsapiProfile1(HttpServletRequest request) {
        return service.getSettingsapiProfile1(request.getRequestURI());
    }

    @PatchMapping("/settings-api/profile")
    public Map<String, Object> patchSettingsapiProfile2(HttpServletRequest request) {
        return service.patchSettingsapiProfile2(request.getRequestURI());
    }

    @GetMapping("/settings-api/company")
    public Map<String, Object> getSettingsapiCompany3(HttpServletRequest request) {
        return service.getSettingsapiCompany3(request.getRequestURI());
    }

    @PatchMapping("/settings-api/company")
    public Map<String, Object> patchSettingsapiCompany4(HttpServletRequest request) {
        return service.patchSettingsapiCompany4(request.getRequestURI());
    }

    @PostMapping("/settings-api/change-password")
    public Map<String, Object> postSettingsapiChangepassword5(HttpServletRequest request) {
        return service.postSettingsapiChangepassword5(request.getRequestURI());
    }

    @GetMapping("/settings-api/security")
    public Map<String, Object> getSettingsapiSecurity6(HttpServletRequest request) {
        return service.getSettingsapiSecurity6(request.getRequestURI());
    }

    @PatchMapping("/settings-api/security")
    public Map<String, Object> patchSettingsapiSecurity7(HttpServletRequest request) {
        return service.patchSettingsapiSecurity7(request.getRequestURI());
    }

    @PostMapping("/settings-api/security/2fa/setup")
    public Map<String, Object> postSettingsapiSecurity2faSetup8(HttpServletRequest request) {
        return service.postSettingsapiSecurity2faSetup8(request.getRequestURI());
    }

    @PostMapping("/settings-api/security/2fa/verify")
    public Map<String, Object> postSettingsapiSecurity2faVerify9(HttpServletRequest request) {
        return service.postSettingsapiSecurity2faVerify9(request.getRequestURI());
    }

    @PostMapping("/settings-api/security/2fa/disable")
    public Map<String, Object> postSettingsapiSecurity2faDisable10(HttpServletRequest request) {
        return service.postSettingsapiSecurity2faDisable10(request.getRequestURI());
    }

    @PostMapping("/settings-api/security/recovery-codes/regenerate")
    public Map<String, Object> postSettingsapiSecurityRecoverycodesRegenerate11(HttpServletRequest request) {
        return service.postSettingsapiSecurityRecoverycodesRegenerate11(request.getRequestURI());
    }

    @PostMapping("/settings-api/security/trusted-devices/revoke")
    public Map<String, Object> postSettingsapiSecurityTrusteddevicesRevoke12(HttpServletRequest request) {
        return service.postSettingsapiSecurityTrusteddevicesRevoke12(request.getRequestURI());
    }

}
