package com.leadflow.service;

import com.leadflow.repo.CampaignsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CampaignsApiService extends NotImplementedApiSupport {

    private final CampaignsApiRepository repository;

    public CampaignsApiService(CampaignsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getCampaignsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("campaigns-api", "GET", requestPath);
    }

    public Map<String, Object> postCampaignsapi2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("campaigns-api", "POST", requestPath);
    }

    public Map<String, Object> getCampaignsapiIdMetrics3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("campaigns-api", "GET", requestPath);
    }

}
