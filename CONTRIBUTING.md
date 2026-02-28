# Contributing

Thanks for contributing to School Dashboard.

## Workflow

1. Create a branch from `main`.
2. Make your changes with matching style and conventions.
3. Run checks locally before opening a PR.

## Local checks

Backend:

- `mvn -f Backend/pom.xml spotless:check`
- `mvn -f Backend/pom.xml test`
- `mvn -f Backend/pom.xml -DskipTests package`

Frontend:

- `pnpm --dir Frontend run format:check`
- `pnpm --dir Frontend run lint`
- `pnpm --dir Frontend run build`

Monorepo helpers (from repo root):

- `pnpm run format:check`
- `pnpm run lint`
- `pnpm run test`
- `pnpm run build`

## Pull requests

- Include a clear summary of changes.
- Reference any files you touched.
- Ensure CI passes before requesting review.
