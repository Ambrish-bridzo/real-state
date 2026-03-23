package com.leadflow.controller;

import com.leadflow.service.AdsManagerApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdsManagerApiController {

    private final AdsManagerApiService service;

    public AdsManagerApiController(AdsManagerApiService service) {
        this.service = service;
    }

    @PostMapping("/ads-manager-api/api/ads/settings")
    public Map<String, Object> postAdsmanagerapiApiAdsSettings1(HttpServletRequest request) {
        return service.postAdsmanagerapiApiAdsSettings1(request.getRequestURI());
    }

    @GetMapping("/ads-manager-api/api/ads/campaigns")
    public Map<String, Object> getAdsmanagerapiApiAdsCampaigns2(HttpServletRequest request) {
        return service.getAdsmanagerapiApiAdsCampaigns2(request.getRequestURI());
    }

    @PostMapping("/ads-manager-api/api/ads/create")
    public Map<String, Object> postAdsmanagerapiApiAdsCreate3(HttpServletRequest request) {
        return service.postAdsmanagerapiApiAdsCreate3(request.getRequestURI());
    }

    @PostMapping("/ads-manager-api/api/ads/status")
    public Map<String, Object> postAdsmanagerapiApiAdsStatus4(HttpServletRequest request) {
        return service.postAdsmanagerapiApiAdsStatus4(request.getRequestURI());
    }

    @GetMapping("/ads-manager-api/api/ads/analytics")
    public Map<String, Object> getAdsmanagerapiApiAdsAnalytics5(HttpServletRequest request) {
        return service.getAdsmanagerapiApiAdsAnalytics5(request.getRequestURI());
    }

    @GetMapping("/ads-manager-api/api/ads/adsets")
    public Map<String, Object> getAdsmanagerapiApiAdsAdsets6(HttpServletRequest request) {
        return service.getAdsmanagerapiApiAdsAdsets6(request.getRequestURI());
    }

    @PostMapping("/ads-manager-api/api/ads/ad/create")
    public Map<String, Object> postAdsmanagerapiApiAdsAdCreate7(HttpServletRequest request) {
        return service.postAdsmanagerapiApiAdsAdCreate7(request.getRequestURI());
    }

    @PostMapping("/ads-manager-api/api/ads/internal/sync")
    public Map<String, Object> postAdsmanagerapiApiAdsInternalSync8(HttpServletRequest request) {
        return service.postAdsmanagerapiApiAdsInternalSync8(request.getRequestURI());
    }

}
