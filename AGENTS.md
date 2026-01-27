# Agent Guidelines

A modern, intuitive dashboard designed originally for Goethe Gymnasium Lichterfelde (GGL) to transform the lobby information display into a comprehensive school information hub.

## Essentials

- Builds/typechecks:
  - Backend: `cd Backend && mvn -q package -DskipTests` (use `mvn clean package -DskipTests` for a clean build)
  - Frontend: `cd Frontend && npm install && npm run build`
- Testing: Every code change must include automated tests covering unit, integration, and web layers. See [Testing](docs/agents/testing.md).
- Security: Do not commit credentials or secrets; use environment variables per `README.md` and `SECURITY.md`. See [Security](docs/agents/security.md).

## More Guidance

- [Overview](docs/agents/overview.md)
- [Workflow](docs/agents/workflow.md)
- [Backend](docs/agents/backend.md)
- [Testing](docs/agents/testing.md)
- [Security](docs/agents/security.md)