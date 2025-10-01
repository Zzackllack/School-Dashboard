# Agent Guidelines

## Scope
These instructions apply to the entire repository `School-Dashboard` and are intended for any automated systems or AI agents contributing to this project.

## Repository Overview
- **Backend**: Java Spring Boot located in `Backend/`. Build with Maven.
- **Frontend**: React 19 + Vite with TypeScript located in `Frontend/`.
- **Docker**: Container and compose definitions in `Docker/` for production and development.
- **Documentation**: See `README.md` for build and deployment instructions. Security policy is in `SECURITY.md`.
- **Data persistence**: Backend uses an on-disk H2 database located at `Backend/data/substitution-plans`. Flyway migrations are enabled (see `Backend/src/main/resources/db/migration`).

## Contribution Workflow
1. Create a new branch and implement your changes.
2. Ensure the project builds successfully:
   - For backend updates: `cd Backend && mvn -q package -DskipTests`.
   - For frontend updates: `cd Frontend && npm install && npm run build`.
   - Flyway manages backend schema changes; add SQL scripts under `Backend/src/main/resources/db/migration` and restart the backend to migrate.
3. Open a pull request with a clear title and description. Include a short summary of commands executed and their results.
4. Keep commit messages concise: one sentence summary followed by optional details.

## Coding Guidelines
- Match the existing code style in each language.
- Do not commit credentials or secrets. Use environment variables as described in the README.
- Reference any files you changed in your pull request description.
- Backend persistence has safeguards against duplicate substitution-plan records. Reuse the existing `SubstitutionPlanPersistenceService` instead of reimplementing storage logic so HTML hashes and metadata updates remain consistent.

## Testing & Coverage
Every code change must include automated tests covering the unit, integration, and web layers.

### Tools
- **JUnit 5** for all test cases.
- **Mockito** for mocking dependencies.
- **Spring Boot Test** utilities with `@SpringBootTest`.
- **TestRestTemplate** or **MockMvc** for exercising HTTP endpoints.
- Embedded HTTP servers for parser tests.

### Guidelines
- Mock external dependencies such as DSBMobile network requests and Jsoup HTML fetches.
- Start lightweight web servers when testing HTML parsing logic.

### Edge Cases
- Missing HTML elements or malformed structures.
- Malformed JSON payloads.
- Cache eviction logic.
- Presence of CORS headers.
- Serving static resources correctly.
- Substitution plan refreshes happen every five minutes. Tests and features should assume the persistence layer may receive repeated data; rely on the hash/metadata checks already in place to avoid duplicate inserts.

## License
This project is released under the BSD 3-Clause license. By contributing you agree your code may be distributed under this license.

## Contact
For security concerns, refer to `SECURITY.md` or email security@zacklack.de.
