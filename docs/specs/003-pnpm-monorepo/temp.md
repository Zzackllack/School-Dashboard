# pnpm Lockfile Strategy Research (School-Dashboard)

Date: 2026-03-02

## Scope

- Monorepo with:
- Backend: Java/Spring Boot (Maven)
- Frontend: `Frontend/` (React + TanStack Start + pnpm)
- Root JS tooling: scripts + `concurrently`
- Current state: both `pnpm-lock.yaml` (root) and `Frontend/pnpm-lock.yaml` exist.

## What the current repo does

- Root lockfile includes two importers (`.` and `Frontend`), so it already captures both root and frontend dependencies.
- Frontend lockfile captures only frontend dependencies.
- CI frontend job installs from `Frontend/` with `--ignore-workspace` and caches `Frontend/pnpm-lock.yaml`.
- Frontend Dockerfile copies `Frontend/package.json` + `Frontend/pnpm-lock.yaml` and installs with `--ignore-workspace`.
- `Frontend/build:workers` uses `pnpm install ... --ignore-workspace`.

This means you currently maintain two independent lockfile workflows.

## Conventions and best-practice direction (research summary)

### 1) pnpm monorepo convention: one shared workspace lockfile

- pnpm workspaces are designed around a shared dependency graph for workspace packages.
- pnpm also provides `pnpm deploy` specifically to produce a deployable package snapshot from a workspace (instead of manually maintaining separate lockfiles per package in repo).
- pnpm supports `--lockfile-dir` when you must install from a subdirectory but want to use a lockfile in a different directory.

Interpretation: for a clean, maintainable monorepo, the default convention is one lockfile at workspace root; specialized deploy outputs should be derived, not hand-maintained as a second committed lockfile.

### 2) CI convention: cache key should follow the lockfile in use

- If using one root lockfile, CI cache dependency path should point to root lockfile.
- If using per-package install/lockfile, cache should track that per-package lockfile.

Interpretation: mixed lockfile ownership increases drift risk and cache inconsistency.

### 3) Cloudflare convention in monorepos

- Workers Builds and Pages support monorepos via root directory + build/deploy commands.
- Root directory controls where commands run and where config is expected.

Interpretation: single-lockfile migration is feasible, but build commands/UI settings must match where the lockfile is read from.

## Decision options

## Option A: Keep dual lockfiles (status quo)
Pros:

- Minimal immediate change.
- Existing CI/Docker/Workers scripts continue to work.

Cons:

- Ongoing lockfile drift risk.
- Duplicate dependency truth.
- Harder maintenance and review noise.

Use when:

- You prioritize zero pipeline change now and accept maintenance overhead.

## Option B: Move to one root lockfile (recommended)
Pros:

- Single source of truth.
- Cleaner pnpm monorepo alignment.
- Simpler dependency governance and Renovate/Dependabot behavior.

Cons:

- Requires coordinated script/CI/Docker/Cloudflare config updates.
- One-time migration/testing effort.

Use when:

- You want long-term maintainability and predictable dependency management.

## Recommended approach
Adopt Option B (single root `pnpm-lock.yaml`) and update all install paths to consume it consistently.

## Required changes if you choose Option B

### 1) Repository/workspace definition

- Ensure `pnpm-workspace.yaml` explicitly defines workspace packages (at minimum `Frontend`).
- Keep root `package.json` as tooling package (`concurrently`, scripts).

### 2) Frontend scripts

- Remove `--ignore-workspace` in `Frontend/build:workers` or replace with explicit shared lock usage.
- Prefer root-driven install/build invocations, e.g. from repo root with `pnpm --dir Frontend ...` after root install.

### 3) GitHub Actions (`.github/workflows/ci.yml`)

- Change cache dependency path from `Frontend/pnpm-lock.yaml` to `pnpm-lock.yaml`.
- Install via root lockfile strategy (either root install then frontend commands, or frontend install with `--lockfile-dir ..`).
- Keep working-directory steps for frontend lint/test/build commands if desired.

### 4) Docker (`Docker/frontend.Dockerfile`)

- Stop copying `Frontend/pnpm-lock.yaml`.
- Copy `pnpm-lock.yaml` (and workspace files needed) into build context.
- Install in a way that resolves from root lockfile (root workspace install + filtered build, or subdir install with `--lockfile-dir`).

### 5) Cloudflare Workers
If deploying via Workers Builds (Cloudflare UI build pipeline):

- Update install/build commands so they use root lockfile.
- Depending on chosen command strategy, you may need to adjust Root directory in UI.

If deploying via GitHub Actions + `wrangler` (external CI):

- Usually no Cloudflare UI build-command changes are needed; migration stays in your GitHub workflow/scripts.

### 6) Cloudflare Pages (if/when used)

- Same principle: Root directory + build command must align with location of lockfile and workspace install strategy.

### 7) Cleanup

- Delete `Frontend/pnpm-lock.yaml` once all pipelines pass.
- Update docs (`README`, `docs/agents/workflow.md`) to prevent reintroduction.

## Practical migration plan (safe rollout)

1. Add explicit workspace package globs in `pnpm-workspace.yaml`.
2. Update CI to use root lockfile while keeping existing test/build steps.
3. Update Docker frontend image build to consume root lockfile.
4. Update Workers build/deploy script path (and Cloudflare UI only if needed).
5. Run full validation:

- frontend install/build/tests
- Docker frontend image build
- CI dry run
- one staging Workers deploy

6. Remove `Frontend/pnpm-lock.yaml` and update docs.

## Risk profile and rollback

- Risk: medium (pipeline config touchpoints across CI/Docker/Workers).
- Rollback: restore previous install commands and re-add `Frontend/pnpm-lock.yaml` from git history.

## What this means for your stack specifically

- Java backend is unaffected by lockfile topology directly.
- Your root JS tooling (`concurrently`) belongs naturally in root importer and fits a single root lockfile.
- Your frontend remains independently buildable, but dependency resolution becomes centrally governed.

## Sources

- pnpm workspaces: <https://pnpm.io/workspaces>
- pnpm install CLI (`--ignore-workspace`, `--lockfile-dir`): <https://pnpm.io/cli/install>
- pnpm deploy CLI (workspace deploy artifact flow): <https://pnpm.io/cli/deploy>
- pnpm working with Docker: <https://pnpm.io/docker>
- GitHub Actions setup-node dependency cache path: <https://github.com/actions/setup-node>
- Cloudflare Workers monorepos: <https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/monorepos/>
- Cloudflare Workers build configuration: <https://developers.cloudflare.com/workers/ci-cd/builds/configuration/>
- Cloudflare Pages monorepos: <https://developers.cloudflare.com/pages/configuration/monorepos/>
