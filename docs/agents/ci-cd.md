# CI/CD

This repository uses GitHub Actions for CI and CD.

## Workflows

### CI (`.github/workflows/ci.yml`)

- Backend: Spotless format check, unit tests, package build.
- Frontend: Prettier format check, ESLint, unit tests, integration tests, web tests.

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
- `pnpm run build`
