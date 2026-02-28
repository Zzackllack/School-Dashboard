# Code Quality

This project enforces consistent formatting and linting across the backend and frontend.

## Formatting

- Backend (Java): Spotless with google-java-format.
  - Check: `mvn -f Backend/pom.xml spotless:check`
  - Apply: `mvn -f Backend/pom.xml spotless:apply`

- Frontend (TypeScript/React): Prettier.
  - Check: `pnpm --dir Frontend run format:check`
  - Apply: `pnpm --dir Frontend run format`

## Linting

- Frontend: ESLint.
  - `pnpm --dir Frontend run lint`

## Static analysis

- CodeQL runs in CI for Java and TypeScript/JavaScript.
