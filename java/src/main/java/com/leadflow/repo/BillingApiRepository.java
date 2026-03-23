package com.leadflow.repo;

import java.util.Map;

public interface BillingApiRepository {
    Map<String, Object> execute(String method, String path);
}
