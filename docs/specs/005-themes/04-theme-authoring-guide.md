# 04 Theme Authoring Guide

## Objective

Provide deterministic instructions for any AI agent to implement additional
themes while preserving full functional parity.

## Input References

Use these visual references:

1. `examples/1.html.example` (high-density brutalist baseline)
2. `examples/2.html.example` (column flip/animated state)
3. `examples/3.html.example` (sidebar scroll-focused state)

These files define style and layout direction, not data logic.

## Mandatory Principles

1. Do not duplicate API calls per theme.
2. Do not fork business logic per theme.
3. Theme code only maps shared display data to visual structure.
4. Every theme must render all required modules.

## Step-by-Step Process For New Theme

1. Create a new theme component under a dedicated folder, for example:
   `Frontend/src/components/display/themes/<theme-id>/`.
2. Start from shared `DisplayThemeProps` contract.
3. Translate HTML reference into React + Tailwind structure.
4. Replace static mock text with mapped data from props.
5. Implement graceful empty/error states for each module region.
6. Register theme in `themes/registry.ts`.
7. Add/update admin theme options.
8. Add unit + integration + e2e tests for theme selection and parity.

## Data Mapping Rules (Substitution Plan)

From payload entries like:

- `classes`, `period`, `originalSubject`, `subject`, `substitute`, `newRoom`,
  `type`, `comment`

Map to card/table primitives:

1. Primary row title: class + subject/originalSubject fallback.
2. Status badge: mapped from `type`.
3. Secondary details: period, substitute teacher, room, comment.
4. Support empty strings and placeholder values (`---`) without layout break.

Badge mapping recommendation:

1. Cancel-like (`Entfall,`, `EVA`) => alert style.
2. Substitution-like (`Vertr.`, `S. Vertr.`) => info style.
3. Room/relocation (`Raumänd.`, `Verlegung`) => neutral/accent style.
4. Special events (`Veranst.`, `findet statt`) => positive/special style.

## Animation Guidance

Allowed:

1. Entry/exit transitions via transform/opacity.
2. Page flip simulation for substitution columns.
3. Sidebar module reveal/stagger for scrolling contexts.

Avoid:

1. Expensive layout thrashing.
2. Constant high-frequency animations that reduce legibility.

## Accessibility and Legibility

Even for TV kiosk use:

1. Maintain high contrast for text and badges.
2. Keep key values readable at distance (period, class, room, departure time).
3. Use semantic grouping and heading hierarchy.

## Theme Quality Checklist (Must Pass)

1. Renders all required modules.
2. Handles empty substitution entry rows safely.
3. Handles long comments without clipping critical info.
4. Supports multi-page/date substitution groups.
5. Preserves auto-refresh/clock behavior.
6. Does not introduce additional uncached network dependencies.
7. Works at target display resolution (1920x1080) and degrades cleanly for
   smaller preview viewports.

## Add-Another-Theme Recipe (For Future Agents)

When asked to add another theme:

1. Reuse existing shared data contracts and hooks.
2. Copy an existing theme folder as starter, not the whole dashboard logic.
3. Swap visual tokens/layout based on new HTML reference.
4. Add one registry entry.
5. Add one admin selector option.
6. Add tests proving full module parity and selection behavior.
7. Never modify API payload schema for purely visual changes.
