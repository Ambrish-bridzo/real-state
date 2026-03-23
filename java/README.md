# Leadflow Java single-component application

This folder contains a **single Spring Boot component** (single `pom.xml`, single `application.properties`) that replaces gateway + microservice scaffolding with a monolith package structure.

## Structure

- `app` → main application + request/response logging filter + global user-validation filter
- `config` → configuration properties binding
- `controller` → per-domain controllers for APIs from `services/*/src/server.ts`
- `service` → per-domain service classes + user auth validation service
- `repo` → per-domain repository interfaces + in-memory implementations + Mongo user repository
- `module` → per-domain POJO records (request/response models)
- `dto` → common request/response payloads
- `exception` → global exception handling and application error codes

## Runtime behavior

- All API paths from `services/*/src/server.ts` are registered in domain controllers.
- Every non-public API request is validated first using user header + Mongo user existence check.
- If user is missing in DB, API returns `401` with message: `user not found`.
- Incoming request and outgoing response are logged globally.
- AOP logs method enter/exit/error across controller/service/repo layers for debug tracing.

## Run

```bash
mvn -f java/pom.xml clean test
mvn -f java/pom.xml spring-boot:run
```
