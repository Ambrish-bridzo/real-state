package com.leadflow.app;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String requestId = UUID.randomUUID().toString();
        long start = System.currentTimeMillis();

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        log.info("[{}] INCOMING method={} path={} query={}",
            requestId, request.getMethod(), request.getRequestURI(), request.getQueryString());

        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            long duration = System.currentTimeMillis() - start;
            String responseBody = new String(wrappedResponse.getContentAsByteArray(), StandardCharsets.UTF_8);
            if (responseBody.length() > 500) {
                responseBody = responseBody.substring(0, 500) + "...(truncated)";
            }
            log.info("[{}] RESPONSE status={} durationMs={} body={}",
                requestId, wrappedResponse.getStatus(), duration, responseBody);
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - start;
            log.error("[{}] ERROR method={} path={} durationMs={} message={}",
                requestId, request.getMethod(), request.getRequestURI(), duration, ex.getMessage(), ex);
            throw ex;
        } finally {
            wrappedResponse.copyBodyToResponse();
        }
    }
}
