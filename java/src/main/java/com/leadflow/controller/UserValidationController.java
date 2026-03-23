package com.leadflow.controller;

import com.leadflow.dto.UserValidationRequest;
import com.leadflow.dto.UserValidationResponse;
import com.leadflow.module.validation.UserValidationResult;
import com.leadflow.service.UserValidationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/validate")
public class UserValidationController {
    private static final Logger log = LoggerFactory.getLogger(UserValidationController.class);

    private final UserValidationService userValidationService;

    public UserValidationController(UserValidationService userValidationService) {
        this.userValidationService = userValidationService;
    }

    @PostMapping("/user")
    public UserValidationResponse validateUser(@Valid @RequestBody UserValidationRequest request) {
        log.info("User validation request received for name={}", request.name());
        UserValidationResult result = userValidationService.validate(request);
        return new UserValidationResponse(result.valid(), result.message(), result.normalizedEmail());
    }
}
