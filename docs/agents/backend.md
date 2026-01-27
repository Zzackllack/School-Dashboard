# Backend-Specific Notes

- Data persistence uses on-disk H2 at `Backend/data/substitution-plans`.
- Flyway migrations live in `Backend/src/main/resources/db/migration`; add `V{next}__description.sql` and restart the backend to migrate.
- Reuse `SubstitutionPlanPersistenceService` for substitution-plan storage to keep hash/metadata logic consistent and avoid duplicate inserts.
