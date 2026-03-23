package com.leadflow.service;

import com.leadflow.repo.CommunicationsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CommunicationsApiService extends NotImplementedApiSupport {

    private final CommunicationsApiRepository repository;

    public CommunicationsApiService(CommunicationsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getCommunicationsapiApiWhatsappConfig1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("communications-api", "GET", requestPath);
    }

    public Map<String, Object> postCommunicationsapiApiWhatsappConfig2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("communications-api", "POST", requestPath);
    }

    public Map<String, Object> getCommunicationsapiApiEmailConfig3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("communications-api", "GET", requestPath);
    }

    public Map<String, Object> postCommunicationsapiApiEmailConfig4(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("communications-api", "POST", requestPath);
    }

    public Map<String, Object> postCommunicationsapiMediaUpload5(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("communications-api", "POST", requestPath);
    }

    public Map<String, Object> postCommunicationsapiSend6(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("communications-api", "POST", requestPath);
    }

    public Map<String, Object> getCommunicationsapiMessages7(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("communications-api", "GET", requestPath);
    }

}
