package com.leadflow.module.webhook_dispatcher;

import java.util.Map;

public record WebhookDispatcherRequest(Map<String, Object> payload) {
}
