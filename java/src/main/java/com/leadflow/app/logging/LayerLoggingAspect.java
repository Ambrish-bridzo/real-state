package com.leadflow.app.logging;

import java.util.Arrays;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LayerLoggingAspect {
    private static final Logger log = LoggerFactory.getLogger(LayerLoggingAspect.class);

    @Around("execution(* com.leadflow.controller..*(..)) || execution(* com.leadflow.service..*(..)) || execution(* com.leadflow.repo..*(..))")
    public Object logLayers(ProceedingJoinPoint joinPoint) throws Throwable {
        String signature = joinPoint.getSignature().toShortString();
        log.debug("ENTER {} args={}", signature, Arrays.toString(joinPoint.getArgs()));
        try {
            Object result = joinPoint.proceed();
            log.debug("EXIT {} result={}", signature, result);
            return result;
        } catch (Throwable ex) {
            log.error("THROW {} message={}", signature, ex.getMessage(), ex);
            throw ex;
        }
    }
}
