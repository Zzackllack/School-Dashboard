# Contribution Workflow

- Create a new branch for changes.
- Ensure builds succeed before a PR:
  - Backend: `cd Backend && mvn -q package -DskipTests` (or `mvn clean package -DskipTests` for a clean build)
  - Frontend: `cd Frontend && npm install && npm run build`
- Open a pull request with a clear title/description and a short summary of commands executed and results.
- Reference any files you changed in the PR description.
- Keep commit messages concise: one sentence summary with optional details.
- Match existing code style in each language.
