package com.leadflow.service;

import com.leadflow.repo.OutgoingAdapterRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class OutgoingAdapterService extends NotImplementedApiSupport {

    private final OutgoingAdapterRepository repository;

    public OutgoingAdapterService(OutgoingAdapterRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postOutgoingDispatch1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("outgoing-adapter", "POST", requestPath);
    }

}
