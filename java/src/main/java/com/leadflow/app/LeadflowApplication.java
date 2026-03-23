package com.leadflow.app;

import com.leadflow.config.LeadflowProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(scanBasePackages = "com.leadflow")
@EnableConfigurationProperties(LeadflowProperties.class)
public class LeadflowApplication {
    public static void main(String[] args) {
        SpringApplication.run(LeadflowApplication.class, args);
    }
}
