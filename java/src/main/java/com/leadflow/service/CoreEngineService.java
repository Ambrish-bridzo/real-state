package com.leadflow.service;

import com.leadflow.repo.CoreEngineRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CoreEngineService extends NotImplementedApiSupport {

    private final CoreEngineRepository repository;

    public CoreEngineService(CoreEngineRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getCoreProfile1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("core-engine", "GET", requestPath);
    }

    public Map<String, Object> postCoreFeaturesCheck2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("core-engine", "POST", requestPath);
    }

    public Map<String, Object> getCoreAuditlogs3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("core-engine", "GET", requestPath);
    }

    public Map<String, Object> getCoreNotifications4(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("core-engine", "GET", requestPath);
    }

    public Map<String, Object> getCoreNotificationsStream5(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("core-engine", "GET", requestPath);
    }

    public Map<String, Object> postCoreNotificationsReadall6(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("core-engine", "POST", requestPath);
    }

    public Map<String, Object> postCoreInternalNotify7(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("core-engine", "POST", requestPath);
    }

    public Map<String, Object> postCoreInternalBroadcast8(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("core-engine", "POST", requestPath);
    }

}
