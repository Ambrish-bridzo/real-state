package com.leadflow.repo;

import java.util.Map;

public interface CampaignsApiRepository {
    Map<String, Object> execute(String method, String path);
}
