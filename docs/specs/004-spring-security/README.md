# Spec 004: Spring Security Migration

## Purpose

Migrate backend security from custom controller-level header checks to a
centralized Spring Security architecture that is secure, maintainable, and
practical for this application.

This spec focuses on:

- Clean authentication and authorization architecture.
- Long-term maintainability with clear security boundaries.
- Safe rollout with realistic operational controls.
- Strong automated test coverage.

## Why this spec exists

Current security behavior works, but the structure is fragile:

- Auth checks are custom and repeated at controller/service boundaries.
- No unified policy engine for endpoint authorization.
- No standard login/session lifecycle for admin users.
- Hard to evolve safely over time.

Spring Security provides a standard foundation while preserving current
admin/display workflows.

## Scope

In scope:

- Backend security architecture and migration plan.
- Admin authentication model integration with current frontend/backend flows.
- Authorization model, auditability, and practical hardening.
- Test strategy and rollout/rollback plan.

Out of scope for this spec iteration:

- External identity provider integration.
- Multi-tenant authorization models.
- Advanced fine-grained policy engines.

## Spec Set

1. [01-product-spec.md](./01-product-spec.md)
2. [02-security-architecture.md](./02-security-architecture.md)
3. [03-implementation-plan.md](./03-implementation-plan.md)
4. [04-testing-and-verification.md](./04-testing-and-verification.md)
5. [05-rollout-risk-operations.md](./05-rollout-risk-operations.md)
6. [06-decisions-and-open-questions.md](./06-decisions-and-open-questions.md)

## Reference Baseline

This spec is aligned with:

- Spring Security reference architecture (`SecurityFilterChain`, lambda DSL,
  method security).
- Spring Boot config/profile conventions.
- Spring Boot actuator security conventions.
