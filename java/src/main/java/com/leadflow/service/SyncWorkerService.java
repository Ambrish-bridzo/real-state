package com.leadflow.service;

import com.leadflow.repo.SyncWorkerRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SyncWorkerService extends NotImplementedApiSupport {

    private final SyncWorkerRepository repository;

    public SyncWorkerService(SyncWorkerRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> postSyncworkerProcess1(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("sync-worker", "POST", requestPath);
    }

}
