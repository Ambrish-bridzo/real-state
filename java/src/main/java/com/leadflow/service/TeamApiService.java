package com.leadflow.service;

import com.leadflow.repo.TeamApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class TeamApiService extends NotImplementedApiSupport {

    private final TeamApiRepository repository;

    public TeamApiService(TeamApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getTeamapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("team-api", "GET", requestPath);
    }

    public Map<String, Object> postTeamapiInvite2(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("team-api", "POST", requestPath);
    }

    public Map<String, Object> patchTeamapiId3(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("team-api", "PATCH", requestPath);
    }

}
