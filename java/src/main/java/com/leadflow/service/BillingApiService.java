package com.leadflow.service;

import com.leadflow.repo.BillingApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class BillingApiService extends NotImplementedApiSupport {

    private final BillingApiRepository repository;

    public BillingApiService(BillingApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getBillingapiOverview1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("billing-api", "GET", requestPath);
    }

    public Map<String, Object> getBillingapiInvoices2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("billing-api", "GET", requestPath);
    }

    public Map<String, Object> getBillingapiCoupons3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("billing-api", "GET", requestPath);
    }

    public Map<String, Object> postBillingapiCreateorder4(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("billing-api", "POST", requestPath);
    }

    public Map<String, Object> postBillingapiVerifypayment5(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("billing-api", "POST", requestPath);
    }

    public Map<String, Object> getBillingapiAdminTransactions6(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("billing-api", "GET", requestPath);
    }

}
