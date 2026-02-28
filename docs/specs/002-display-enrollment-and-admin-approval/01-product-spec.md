# 01 Product Specification

## Problem Statement

Kiosk mini PCs always open the same root URL on restart. Today, there is no built-in way to identify a physical display, assign it to a location, and enforce admin approval before activation.

## Product Objective

Add a controlled display enrollment flow so each kiosk device can be registered once, approved by an admin, and automatically routed to the correct display view on every restart.

## Goals

- G1: Keep kiosk startup URL fixed at `/`.
- G2: Support first-time setup on unregistered displays.
- G3: Require admin approval before a display becomes active.
- G4: Persist display identity in browser storage for auto-reconnect.
- G5: Support display assignment (example: main hall vs lobby) without changing kiosk URL.
- G6: Keep operational workflow simple for school staff.

## Non-Goals

- NG1: Full role model or enterprise IAM in this phase.
- NG2: Multi-school tenancy.
- NG3: Mobile app management.

## User Roles

- Display Operator:
  - Physical access to kiosk screen/device.
  - Can start first-time setup and enter enrollment code.
- Admin:
  - Uses admin dashboard.
  - Approves/rejects pending display enrollments.
  - Assigns a display profile/layout.

## Core User Flows

## F1: Bootstrapping from Root URL

1. Kiosk opens `/`.
2. App checks for persisted `display_session_token`.
3. If token is valid, app routes to assigned display view.
4. If token is missing/invalid, app routes to setup flow.

## F2: First-Time Setup (Unregistered Device)

1. Operator opens `/setup` (or is redirected there from `/`).
2. Operator enters:

- Admin-generated enrollment code.
- Display name (for identification).

3. Enrollment request is created in `PENDING` state.
4. Display shows waiting screen and polls for approval status.

## F3: Admin Approval

1. Admin opens `/admin/displays/pending`.
2. Admin reviews pending request metadata.
3. Admin approves and assigns display profile/layout.
4. Backend issues a display session token.
5. Kiosk receives approval, persists token, and routes to assigned display view.

## F4: Reboot Behavior

1. Kiosk restarts and opens `/`.
2. Existing token is validated.
3. If valid, kiosk auto-routes without manual intervention.

## F5: Revoke / Re-Enroll

1. Admin can revoke a display token.
2. Revoked display falls back to setup flow on next validation.

## Route Requirements

- Public/kiosk:
  - `/` (bootstrap resolver)
  - `/setup`
  - `/setup/pending`
  - `/display/$displayId` (or `/display/$slug`)
- Admin:
  - `/admin/displays`
  - `/admin/displays/pending`
  - `/admin/displays/$displayId`

## Success Criteria

- SC1: No kiosk URL edits needed after deployment.
- SC2: New displays cannot activate without admin approval.
- SC3: Approved displays auto-reconnect after reboot.
- SC4: Admin can revoke or reassign displays safely.
