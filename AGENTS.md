# Agent Guidelines

A modern, intuitive dashboard designed originally for Goethe Gymnasium Lichterfelde (GGL) to transform the lobby information display into a comprehensive school information hub.

## Technology Stack

- Backend: Maven + Java 21 with Spring Boot + Flyway for migration, H2 as the embedded database for development, PostgreSQL 17 for production.
- Frontend: React 19 with TypeScript + TanStack Start (TanStack Query, TanStack Router) + Tailwind CSS + Vite + Nitro.
- Testing: Vitest + Playwright for frontend, JUnit 5 + Mockito for backend.
- Deployment: Backend via Docker, Frontend via Cloudflare Workers (see `Frontend/wrangler.toml`).

## Essentials

- This repo is a monorepo.
- ALWAYS use pnpm instead of npm, if npm is not available, give the user a clear error message with instructions to install pnpm.
- ALWAYS research and understand the existing codebase before making changes. Refer to official documentation using any of the following options:
  - `context7`
  - `web request/web fetch`
  - `tools/mcp server`
- Builds/typechecks:
  - Backend: `cd Backend && mvn -q package -DskipTests` (use `mvn clean package -DskipTests` for a clean build)
  - Frontend: `cd Frontend && pnpm install && pnpm run build`
- Testing: Every code change must include automated tests covering unit, integration, and web layers. See [Testing](docs/agents/testing.md) and existing test files.
- Security: NEVER commit credentials or secrets; use environment variables per `README.md` and `SECURITY.md`. See [Security](docs/agents/security.md).

## More Guidance

- [Overview](docs/agents/overview.md)
- [Workflow](docs/agents/workflow.md)
- [Backend](docs/agents/backend.md)
- [Testing](docs/agents/testing.md)
- [Security](docs/agents/security.md)