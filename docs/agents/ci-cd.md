# CI/CD

This repository uses GitHub Actions for CI and CD.

## Workflows

### CI (`.github/workflows/ci.yml`)

- Backend: Spotless format check, unit tests, package build.
- Frontend: Prettier format check, ESLint, Vite build.

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
  - `npm --prefix Frontend run format:check`
  - `npm --prefix Frontend run lint`
  - `npm --prefix Frontend run build`

## Monorepo helpers

At the repo root:

- `npm run format:check`
- `npm run format`
- `npm run lint`
- `npm run test`
- `npm run build`
