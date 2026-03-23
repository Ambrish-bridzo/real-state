package com.leadflow.service;

import com.leadflow.exception.AppException;
import com.leadflow.exception.ErrorCode;
import com.leadflow.repo.UserAuthRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserAuthValidationService {
    private static final Logger log = LoggerFactory.getLogger(UserAuthValidationService.class);

    private final UserAuthRepository userAuthRepository;

    public UserAuthValidationService(UserAuthRepository userAuthRepository) {
        this.userAuthRepository = userAuthRepository;
    }

    public void validateUserOrThrow(String userId, String path) {
        log.info("Validating user for path={} userId={}", path, userId);
        if (userId == null || userId.isBlank()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND, "user not found", HttpStatus.UNAUTHORIZED);
        }

        boolean exists = userAuthRepository.existsUser(userId.trim());
        if (!exists) {
            throw new AppException(ErrorCode.USER_NOT_FOUND, "user not found", HttpStatus.UNAUTHORIZED);
        }
    }
}
