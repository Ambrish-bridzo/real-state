package com.leadflow.module.webhook_dispatcher;

import java.util.Map;

public record WebhookDispatcherResponse(Map<String, Object> payload) {
}
