package com.leadflow.service;

import com.leadflow.repo.MeetingsApiRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MeetingsApiService extends NotImplementedApiSupport {

    private final MeetingsApiRepository repository;

    public MeetingsApiService(MeetingsApiRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getMeetingsapi1(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("meetings-api", "GET", requestPath);
    }

    public Map<String, Object> getMeetingsapiStats2(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("meetings-api", "GET", requestPath);
    }

    public Map<String, Object> getMeetingsapiId3(String requestPath) {
        repository.execute("GET", requestPath);
        return notImplemented("meetings-api", "GET", requestPath);
    }

    public Map<String, Object> postMeetingsapi4(String requestPath) {
        repository.execute("POST", requestPath);
        return notImplemented("meetings-api", "POST", requestPath);
    }

    public Map<String, Object> patchMeetingsapiId5(String requestPath) {
        repository.execute("PATCH", requestPath);
        return notImplemented("meetings-api", "PATCH", requestPath);
    }

    public Map<String, Object> deleteMeetingsapiId6(String requestPath) {
        repository.execute("DELETE", requestPath);
        return notImplemented("meetings-api", "DELETE", requestPath);
    }

}
