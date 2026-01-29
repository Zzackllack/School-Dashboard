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

- `npm --prefix Frontend run format:check`
- `npm --prefix Frontend run lint`
- `npm --prefix Frontend run build`

Monorepo helpers (from repo root):

- `npm run format:check`
- `npm run lint`
- `npm run test`
- `npm run build`

## Pull requests

- Include a clear summary of changes.
- Reference any files you touched.
- Ensure CI passes before requesting review.
