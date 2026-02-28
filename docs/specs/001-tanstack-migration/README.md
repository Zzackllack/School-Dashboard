# Spec 001: TanStack Start Migration

## Purpose

Define a full frontend migration from the current React + Vite app to TanStack Start (including TanStack Router), while keeping the Java Spring Boot backend unchanged and preserving current feature parity only.

## Scope Boundary

- In scope:
  - Frontend framework migration to TanStack Start.
  - Frontend routing migration to TanStack Router.
  - Frontend build/deploy updates needed for TanStack Start runtime.
  - Regression-safe feature parity with the current dashboard behavior.
- Out of scope:
  - New product features (device enrollment, admin approval, per-display assignment).
  - Any backend Java code changes in `Backend/`.
  - Any database schema changes on the backend.
  - Rewriting DSB mobile integration logic.

## Specification Set

1. [01-product-spec.md](./01-product-spec.md)
2. [02-technical-spec.md](./02-technical-spec.md)
3. [03-implementation-plan.md](./03-implementation-plan.md)
4. [04-testing-and-quality-gates.md](./04-testing-and-quality-gates.md)
5. [05-risk-rollout-and-rollback.md](./05-risk-rollout-and-rollback.md)

## Non-Negotiable Constraint

The Spring Boot backend remains functionally and structurally untouched for this migration.

## Follow-Up

All new product features intentionally deferred from this migration are specified in:
`docs/specs/002-display-enrollment-and-admin-approval/`.
