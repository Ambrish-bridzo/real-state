package com.leadflow.controller;

import com.leadflow.service.BillingApiService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BillingApiController {

    private final BillingApiService service;

    public BillingApiController(BillingApiService service) {
        this.service = service;
    }

    @GetMapping("/billing-api/overview")
    public Map<String, Object> getBillingapiOverview1(HttpServletRequest request) {
        return service.getBillingapiOverview1(request.getRequestURI());
    }

    @GetMapping("/billing-api/invoices")
    public Map<String, Object> getBillingapiInvoices2(HttpServletRequest request) {
        return service.getBillingapiInvoices2(request.getRequestURI());
    }

    @GetMapping("/billing-api/coupons")
    public Map<String, Object> getBillingapiCoupons3(HttpServletRequest request) {
        return service.getBillingapiCoupons3(request.getRequestURI());
    }

    @PostMapping("/billing-api/create-order")
    public Map<String, Object> postBillingapiCreateorder4(HttpServletRequest request) {
        return service.postBillingapiCreateorder4(request.getRequestURI());
    }

    @PostMapping("/billing-api/verify-payment")
    public Map<String, Object> postBillingapiVerifypayment5(HttpServletRequest request) {
        return service.postBillingapiVerifypayment5(request.getRequestURI());
    }

    @GetMapping("/billing-api/admin/transactions")
    public Map<String, Object> getBillingapiAdminTransactions6(HttpServletRequest request) {
        return service.getBillingapiAdminTransactions6(request.getRequestURI());
    }

}
