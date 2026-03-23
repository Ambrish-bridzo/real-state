package com.leadflow.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadflow.config.LeadflowProperties;
import com.leadflow.dto.ApiErrorResponse;
import com.leadflow.exception.AppException;
import com.leadflow.exception.ErrorCode;
import com.leadflow.service.UserAuthValidationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UserValidationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(UserValidationFilter.class);

    private final LeadflowProperties properties;
    private final UserAuthValidationService userAuthValidationService;
    private final ObjectMapper objectMapper;

    public UserValidationFilter(
        LeadflowProperties properties,
        UserAuthValidationService userAuthValidationService,
        ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.userAuthValidationService = userAuthValidationService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        List<String> publicPaths = properties.getSecurity().getPublicPaths();
        if (publicPaths == null || publicPaths.isEmpty()) {
            return false;
        }
        return publicPaths.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String path = request.getRequestURI();
        String userHeader = properties.getSecurity().getUserHeader();
        String userId = request.getHeader(userHeader);

        try {
            userAuthValidationService.validateUserOrThrow(userId, path);
            log.info("User validated successfully userId={} path={}", userId, path);
            filterChain.doFilter(request, response);
        } catch (AppException ex) {
            log.warn("User validation failed userId={} path={} message={}", userId, path, ex.getMessage());
            ApiErrorResponse error = new ApiErrorResponse(
                ErrorCode.USER_NOT_FOUND.name(),
                "user not found",
                HttpStatus.UNAUTHORIZED.value(),
                Instant.now(),
                path
            );
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(error));
        }
    }
}
