package com.leadflow.service;

import com.leadflow.config.LeadflowProperties;
import com.leadflow.dto.UserValidationRequest;
import com.leadflow.exception.AppException;
import com.leadflow.exception.ErrorCode;
import com.leadflow.module.validation.UserValidationResult;
import com.leadflow.repo.UserValidationRepository;
import java.util.Locale;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserValidationService {
    private static final Logger log = LoggerFactory.getLogger(UserValidationService.class);

    private final LeadflowProperties properties;
    private final UserValidationRepository userValidationRepository;

    public UserValidationService(LeadflowProperties properties, UserValidationRepository userValidationRepository) {
        this.properties = properties;
        this.userValidationRepository = userValidationRepository;
    }

    public UserValidationResult validate(UserValidationRequest request) {
        log.info("Validating user payload for email={}", request.email());
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        String regex = properties.getValidation().getAllowedEmailRegex();
        if (regex != null && !Pattern.compile(regex).matcher(normalizedEmail).matches()) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Email does not match allowed format", HttpStatus.BAD_REQUEST);
        }

        String[] emailParts = normalizedEmail.split("@");
        if (emailParts.length != 2) {
            throw new AppException(ErrorCode.VALIDATION_FAILED, "Email is malformed", HttpStatus.BAD_REQUEST);
        }

        String domain = emailParts[1];
        if (userValidationRepository.isBlockedDomain(domain)) {
            throw new AppException(ErrorCode.BLOCKED_DOMAIN, "Email domain is blocked", HttpStatus.BAD_REQUEST);
        }

        return new UserValidationResult(true, "User validation successful", normalizedEmail);
    }
}
