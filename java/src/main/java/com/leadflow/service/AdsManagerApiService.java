package com.leadflow.service;

import com.leadflow.repo.AdsManagerApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdsManagerApiService extends NotImplementedApiSupport {

    private final AdsManagerApiRepository repository;

    public AdsManagerApiService(AdsManagerApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postAdsmanagerapiApiAdsSettings1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("ads-manager-api", "POST", requestPath);
    }

    public Map<String, Object> getAdsmanagerapiApiAdsCampaigns2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("ads-manager-api", "GET", requestPath);
    }

    public Map<String, Object> postAdsmanagerapiApiAdsCreate3(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("ads-manager-api", "POST", requestPath);
    }

    public Map<String, Object> postAdsmanagerapiApiAdsStatus4(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("ads-manager-api", "POST", requestPath);
    }

    public Map<String, Object> getAdsmanagerapiApiAdsAnalytics5(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("ads-manager-api", "GET", requestPath);
    }

    public Map<String, Object> getAdsmanagerapiApiAdsAdsets6(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("ads-manager-api", "GET", requestPath);
    }

    public Map<String, Object> postAdsmanagerapiApiAdsAdCreate7(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("ads-manager-api", "POST", requestPath);
    }

    public Map<String, Object> postAdsmanagerapiApiAdsInternalSync8(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("ads-manager-api", "POST", requestPath);
    }

}
