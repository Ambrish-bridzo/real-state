package com.leadflow.service;

import com.leadflow.repo.WebhooksApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WebhooksApiService extends NotImplementedApiSupport {

    private final WebhooksApiRepository repository;

    public WebhooksApiService(WebhooksApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getWebhooksapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("webhooks-api", "GET", requestPath);
    }

    public Map<String, Object> postWebhooksapi2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("webhooks-api", "POST", requestPath);
    }

    public Map<String, Object> patchWebhooksapiId3(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("webhooks-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteWebhooksapiId4(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("webhooks-api", "DELETE", requestPath);
    }

    public Map<String, Object> getWebhooksapiIdEvents5(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("webhooks-api", "GET", requestPath);
    }

}
