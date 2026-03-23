package com.leadflow.service;

import com.leadflow.exception.AppException;
import com.leadflow.exception.ErrorCode;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

public abstract class NotImplementedApiSupport {
    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected Map<String, Object> notImplemented(String domain, String method, String path) {
        log.info("{} endpoint hit: {} {}", domain, method, path);
        throw new AppException(
            ErrorCode.FEATURE_NOT_IMPLEMENTED,
            "Endpoint is registered for migration but business logic is not implemented yet: " + method + " " + path,
            HttpStatus.NOT_IMPLEMENTED
        );
    }
}
