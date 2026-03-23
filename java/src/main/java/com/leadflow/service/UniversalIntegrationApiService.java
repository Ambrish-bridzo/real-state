package com.leadflow.service;

import com.leadflow.repo.UniversalIntegrationApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class UniversalIntegrationApiService extends NotImplementedApiSupport {

    private final UniversalIntegrationApiRepository repository;

    public UniversalIntegrationApiService(UniversalIntegrationApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postApiLeadsIngestIntegrationid1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("universal-integration-api", "POST", requestPath);
    }

    public Map<String, Object> postApiIntegrationsWhatsappWebhook2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("universal-integration-api", "POST", requestPath);
    }

    public Map<String, Object> getApiIntegrationsWhatsappWebhook3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("universal-integration-api", "GET", requestPath);
    }

}
