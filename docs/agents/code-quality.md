# Code Quality

This project enforces consistent formatting and linting across the backend and frontend.

## Formatting

- Backend (Java): Spotless with google-java-format.
  - Check: `mvn -f Backend/pom.xml spotless:check`
  - Apply: `mvn -f Backend/pom.xml spotless:apply`

- Frontend (TypeScript/React): Prettier.
  - Check: `npm --prefix Frontend run format:check`
  - Apply: `npm --prefix Frontend run format`

## Linting

- Frontend: ESLint.
  - `npm --prefix Frontend run lint`

## Static analysis

- CodeQL runs in CI for Java and TypeScript/JavaScript.
