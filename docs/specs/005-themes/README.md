# Spec 005: Display Theme Support

## Purpose

Enable per-display theme selection in the admin dashboard while preserving full
module parity across themes.

This spec ensures every theme renders the same functional content currently
provided by the default display experience:

- Substitution plan
- Weather
- Transportation departures
- Calendar events
- Upcoming holidays
- Existing sidebar/support modules (for example credits/footer/time context)

## Why This Spec Exists

The current display pipeline has one visual implementation (`DashboardPage`),
which limits flexibility for different display locations and branding needs.
Theme support should:

- Keep behavior/data identical across visual variants.
- Allow admins to assign a theme per display without redeploying code.
- Make new themes addable by future AI agents with a clear, repeatable process.

## Scope

In scope:

- Backend persistence and API contracts for display theme assignment.
- Admin UI for setting theme per display.
- Frontend theme rendering architecture.
- A first additional theme based on provided HTML references in
  `examples/*.html.example`.
- Testing, rollout, fallback, and operational safety.
- Explicit instructions for creating future themes from HTML examples.

Out of scope for this iteration:

- Per-module enable/disable toggles by theme.
- Runtime theme editing in admin.
- Tenant-specific theme package loading from external sources.

## Spec Set

1. [01-product-spec.md](./01-product-spec.md)
2. [02-technical-architecture.md](./02-technical-architecture.md)
3. [03-api-and-data-contracts.md](./03-api-and-data-contracts.md)
4. [04-theme-authoring-guide.md](./04-theme-authoring-guide.md)
5. [05-implementation-plan.md](./05-implementation-plan.md)
6. [06-testing-rollout-risk.md](./06-testing-rollout-risk.md)
7. [07-agent-implementation-prompt.md](./07-agent-implementation-prompt.md)

## Inputs Used

- Existing monorepo architecture and display enrollment/admin flow.
- Current display shell in `Frontend/src/components/DashboardPage.tsx`.
- Admin display detail page in `Frontend/src/routes/admin.displays.$displayId.tsx`.
- Theme concept references:
  - `examples/1.html.example`
  - `examples/2.html.example`
  - `examples/3.html.example`
- Sample substitution API payload provided by product owner.
