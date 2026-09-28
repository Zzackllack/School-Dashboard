# CI/CD

This repository uses GitHub Actions for CI and CD.

## Workflows

### CI (`.github/workflows/ci.yml`)

- Lockfile: `pnpm install --frozen-lockfile` plus the repository script tests. Runs on
  every pull request, with no path filter, because a manifest and lockfile that
  disagree is the failure mode that is otherwise easiest to miss.
- Detect changed areas: decides whether the backend and frontend jobs run.
- Backend: Spotless format check, unit tests, package build.
- Frontend: Prettier format check, ESLint, unit tests, integration tests, web tests.
- Dependency pull requests are not skipped. `Dependabot` PRs run the same jobs as
  anyone else's, so a breaking dependency upgrade fails here rather than in review.

### Dependabot (`.github/dependabot.yml`)

- The npm job runs at the repository root (`directory: "/"`), not `/Frontend`.
  `pnpm-lock.yaml` and `pnpm-workspace.yaml` live at the root, and Dependabot can
  only update a lockfile it fetched from its own job directory or a parent of it.
  Scoping the job to a workspace subdirectory makes Dependabot silently skip the
  lockfile updater, so every frontend dependency PR arrives touching only
  `Frontend/package.json` and fails `pnpm install --frozen-lockfile`.
- `scripts/dependabot-config.test.mjs` pins that invariant and runs in the
  `lockfile` CI job.

### Auto Format (`.github/workflows/format.yml`)

- Applies formatting on push and commits changes via `github-actions[bot]`.
- Uses Prettier for the frontend and Spotless for the backend.
- Skips runs triggered by the bot to avoid loops.

### CodeQL (`.github/workflows/codeql.yml`)

- Static analysis for Java and TypeScript/JavaScript.
- Runs on push, pull requests, and a weekly schedule.

### CD (`.github/workflows/cd.yml`)

- Builds and publishes Docker images to GHCR on `main` and version tags.
- Images:
  - `ghcr.io/<owner>/<repo>-backend`
  - `ghcr.io/<owner>/<repo>-frontend`

## Local equivalents

- Backend:
  - `mvn -f Backend/pom.xml spotless:check`
  - `mvn -f Backend/pom.xml test`
  - `mvn -f Backend/pom.xml -DskipTests package`
- Frontend:
  - `pnpm --dir Frontend run format:check`
  - `pnpm --dir Frontend run lint`
  - `pnpm --dir Frontend run test:unit`
  - `pnpm --dir Frontend run test:integration`
  - `pnpm --dir Frontend run test:web`

## Monorepo helpers

At the repo root:

- `pnpm run format:check`
- `pnpm run format`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run test:scripts`
- `pnpm run build`
