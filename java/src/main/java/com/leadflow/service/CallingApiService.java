package com.leadflow.service;

import com.leadflow.repo.CallingApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CallingApiService extends NotImplementedApiSupport {

    private final CallingApiRepository repository;

    public CallingApiService(CallingApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getCallingapiCalls1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("calling-api", "GET", requestPath);
    }

    public Map<String, Object> postCallingapiOutboundManual2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("calling-api", "POST", requestPath);
    }

}
