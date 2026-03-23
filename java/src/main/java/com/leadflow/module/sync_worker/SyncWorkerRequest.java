package com.leadflow.module.sync_worker;

import java.util.Map;

public record SyncWorkerRequest(Map<String, Object> payload) {
}
