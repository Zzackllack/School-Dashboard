# Spec 002: Display Enrollment and Admin Approval

## Purpose

Define the post-migration feature set for kiosk-safe display onboarding:

- Root URL always works for kiosk startup.
- First-time display setup is possible without changing the kiosk systemd URL.
- New displays require admin-side approval before becoming active.
- Approved displays persist identity and auto-open assigned content on reboot.

## Dependency

This spec starts after Spec 001 (TanStack Start parity migration) is completed.

## Specification Set

1. [01-product-spec.md](./01-product-spec.md)
2. [02-technical-spec.md](./02-technical-spec.md)
3. [03-api-and-data-contracts.md](./03-api-and-data-contracts.md)
4. [04-implementation-plan.md](./04-implementation-plan.md)
5. [05-testing-risk-rollout.md](./05-testing-risk-rollout.md)

## Operational Docs

- [Display Admin Access](../../src/display-admin-access.md)
- [Display Device Enrollment Workflow](../../src/display-device-enrollment.md)

## Backend Scope

Unlike Spec 001, this spec requires backend additions (new APIs, persistence, and admin workflows).
