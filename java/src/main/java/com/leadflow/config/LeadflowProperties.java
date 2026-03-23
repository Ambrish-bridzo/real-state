package com.leadflow.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "leadflow")
public class LeadflowProperties {
    private Api api = new Api();
    private Services services = new Services();
    private Validation validation = new Validation();
    private Security security = new Security();

    public Api getApi() {
        return api;
    }

    public void setApi(Api api) {
        this.api = api;
    }

    public Services getServices() {
        return services;
    }

    public void setServices(Services services) {
        this.services = services;
    }

    public Validation getValidation() {
        return validation;
    }

    public void setValidation(Validation validation) {
        this.validation = validation;
    }

    public Security getSecurity() {
        return security;
    }

    public void setSecurity(Security security) {
        this.security = security;
    }

    public static class Api {
        private String version;
        private String environment;

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }

        public String getEnvironment() {
            return environment;
        }

        public void setEnvironment(String environment) {
            this.environment = environment;
        }
    }

    public static class Services {
        private String database;
        private String localGateway;

        public String getDatabase() {
            return database;
        }

        public void setDatabase(String database) {
            this.database = database;
        }

        public String getLocalGateway() {
            return localGateway;
        }

        public void setLocalGateway(String localGateway) {
            this.localGateway = localGateway;
        }
    }

    public static class Validation {
        private String allowedEmailRegex;
        private List<String> blockedDomains;

        public String getAllowedEmailRegex() {
            return allowedEmailRegex;
        }

        public void setAllowedEmailRegex(String allowedEmailRegex) {
            this.allowedEmailRegex = allowedEmailRegex;
        }

        public List<String> getBlockedDomains() {
            return blockedDomains;
        }

        public void setBlockedDomains(List<String> blockedDomains) {
            this.blockedDomains = blockedDomains;
        }
    }

    public static class Security {
        private String userHeader;
        private List<String> publicPaths;

        public String getUserHeader() {
            return userHeader;
        }

        public void setUserHeader(String userHeader) {
            this.userHeader = userHeader;
        }

        public List<String> getPublicPaths() {
            return publicPaths;
        }

        public void setPublicPaths(List<String> publicPaths) {
            this.publicPaths = publicPaths;
        }
    }
}
