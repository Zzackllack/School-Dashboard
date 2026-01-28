#!/bin/sh
set -e

mkdir -p /data
chown -R app:app /data

if [ "${H2_MIGRATE_ON_STARTUP}" = "true" ]; then
  DB_PATH="/data/substitution-plans"
  DB_FILE="${DB_PATH}.mv.db"
  MIGRATED_FLAG="${DB_PATH}.migrated"
  if [ -f "$DB_FILE" ] && [ ! -f "$MIGRATED_FLAG" ]; then
    echo "[entrypoint] Migrating H2 database file for Spring Boot 3.x..."
    java -cp /opt/h2/h2-old.jar org.h2.tools.Script \
      -url "jdbc:h2:file:${DB_PATH}" \
      -user sa \
      -password "" \
      -script "${DB_PATH}.sql"
    mv "$DB_FILE" "${DB_FILE}.bak"
    if [ -f "${DB_PATH}.trace.db" ]; then
      mv "${DB_PATH}.trace.db" "${DB_PATH}.trace.db.bak"
    fi
    java -cp /opt/h2/h2-new.jar org.h2.tools.RunScript \
      -url "jdbc:h2:file:${DB_PATH}" \
      -user sa \
      -password "" \
      -script "${DB_PATH}.sql"
    touch "$MIGRATED_FLAG"
    echo "[entrypoint] H2 migration completed. Backup: ${DB_FILE}.bak"
  fi
fi

if [ "$#" -eq 0 ]; then
  set -- java -jar /app/app.jar
fi

if [ "$1" = "java" ] && [ -n "$JAVA_OPTS" ]; then
  shift
  set -- java $JAVA_OPTS "$@"
fi

exec su-exec app "$@"
