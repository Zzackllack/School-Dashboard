# 01 Product Specification

## Problem Statement

The current frontend is a single-page, fixed-layout React + Vite application with no route-level architecture. Planned features (admin dashboard, per-screen configuration, modular UI composition) require stronger routing, layout composition, and long-term maintainability.

## Migration Objective

Migrate the frontend fully to TanStack Start (including TanStack Router) without modifying backend Java code, while preserving current runtime behavior for existing public dashboard functionality.

## Goals

- G1: Deliver full framework migration from Vite app structure to TanStack Start app structure.
- G2: Preserve all existing user-visible dashboard features and API behavior.
- G3: Keep deployment operational on kiosk TVs with minimal operational overhead.
- G4: Keep Spring Boot backend unchanged.

## Non-Goals

- NG1: Implementing admin CRUD features in this migration.
- NG2: Introducing first-time display setup, pairing, or device enrollment.
- NG3: Introducing backend authentication/authorization changes.
- NG4: Replacing or refactoring DSBmobile Java integration.
- NG5: Introducing multi-tenant or multi-school backend capabilities.

## Success Criteria

- SC1: Frontend compiles and runs under TanStack Start in development and production modes.
- SC2: Existing dashboard modules render correctly with parity to current implementation.
- SC3: Existing backend API endpoints are consumed without contract changes.
- SC4: Kiosk deployment remains single URL entry and full-screen capable.
- SC5: Unit, integration, and web tests pass per repository testing policy.

## Functional Requirements

- FR-001: The root route (`/`) must render the dashboard equivalent to the current app.
- FR-002: Application routing must be powered by TanStack Router.
- FR-003: Route-level data loading must be supported for dashboard data sources.
- FR-004: Frontend HTTP calls to backend must continue to use `/api/*` paths behind reverse proxy in production.
- FR-005: Existing visual modules must remain componentized and reusable.
- FR-006: Error and loading states must remain visible and understandable to users.

## Non-Functional Requirements

- NFR-001: No backend Java source files are modified.
- NFR-002: Cold boot in kiosk environment must stay within acceptable current behavior (no significant startup regression).
- NFR-003: Frontend bundle/runtime changes must not break Firefox kiosk compatibility.
- NFR-004: Migration must include a rollback path to the previous frontend build.
- NFR-005: Developer workflow must remain straightforward (`install`, `dev`, `build`, `test`).

## Assumptions

- A1: Backend endpoint paths and response formats remain stable during migration.
- A2: Deployment can host a TanStack Start runtime (Node-based frontend container), or equivalent adapter output.
- A3: Kiosk clients access the frontend through the existing production URL and reverse proxy.

## Constraints

- C1: Spring Boot backend and DSB integration remain untouched.
- C2: Existing school production environment remains the primary target.
- C3: Migration should prioritize reliability over feature expansion.

## Stakeholder Outcomes

- Maintainers get a route-centric frontend foundation for future admin/device work.
- School operations keep current visible dashboard behavior during transition.
- Future feature delivery risk is reduced via stronger app architecture.
