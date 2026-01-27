# Testing Requirements

- Every code change must include automated tests covering unit, integration, and web layers.
- Use JUnit 5, Mockito, and Spring Boot Test (`@SpringBootTest`).
- Exercise HTTP endpoints via `TestRestTemplate` or `MockMvc`.
- Use embedded HTTP servers for parser tests.
- Mock external dependencies (DSBMobile network requests, Jsoup HTML fetches).
- Start lightweight web servers when testing HTML parsing logic.
- Edge cases to cover:
  - Missing HTML elements or malformed structures.
  - Malformed JSON payloads.
  - Cache eviction logic.
  - Presence of CORS headers.
  - Serving static resources correctly.
  - Substitution plan refreshes every five minutes; persistence may receive repeated data, rely on hash/metadata checks to avoid duplicates.
