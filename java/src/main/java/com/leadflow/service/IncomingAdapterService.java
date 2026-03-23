package com.leadflow.service;

import com.leadflow.repo.IncomingAdapterRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class IncomingAdapterService extends NotImplementedApiSupport {

    private final IncomingAdapterRepository repository;

    public IncomingAdapterService(IncomingAdapterRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postIncomingWebhooksProvider1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("incoming-adapter", "POST", requestPath);
    }

}
