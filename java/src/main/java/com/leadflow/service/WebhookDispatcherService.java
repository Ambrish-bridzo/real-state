package com.leadflow.service;

import com.leadflow.repo.WebhookDispatcherRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class WebhookDispatcherService extends NotImplementedApiSupport {

    private final WebhookDispatcherRepository repository;

    public WebhookDispatcherService(WebhookDispatcherRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postWebhookdispatcherDispatch1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("webhook-dispatcher", "POST", requestPath);
    }

}
