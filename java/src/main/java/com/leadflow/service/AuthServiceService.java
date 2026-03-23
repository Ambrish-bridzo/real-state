package com.leadflow.service;

import com.leadflow.repo.AuthServiceRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceService extends NotImplementedApiSupport {

    private final AuthServiceRepository repository;

    public AuthServiceService(AuthServiceRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postAuthOnboard1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> postAuthLogin2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> postAuthSignup3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> postAuthForgotpassword4(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> postAuthResetpassword5(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> postAuthVerify2fa6(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

    public Map<String, Object> getAuthSession7(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("auth-service", "GET", requestPath);
    }

    public Map<String, Object> postAuthLogout8(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("auth-service", "POST", requestPath);
    }

}
