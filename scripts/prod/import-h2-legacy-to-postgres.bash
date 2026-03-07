#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BACKUP_DIR="${1:-$REPO_ROOT/Backend/data/backup/20260307-181933}"
H2_JAR="${H2_JAR:-$BACKUP_DIR/h2.jar}"
H2_DB_PATH="${H2_DB_PATH:-$BACKUP_DIR/substitution-plans}"
H2_USER="${H2_USER:-sa}"
H2_PASSWORD="${H2_PASSWORD:-}"

PG_URL="${PG_URL:-}"
PG_USER="${PG_USER:-}"
PG_PASSWORD="${PG_PASSWORD:-}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install PostgreSQL client tools first." >&2
  exit 1
fi

if [ -z "$PG_URL" ] || [ -z "$PG_USER" ] || [ -z "$PG_PASSWORD" ]; then
  echo "Set PG_URL, PG_USER and PG_PASSWORD before running this script." >&2
  exit 1
fi

if [ ! -f "$H2_JAR" ]; then
  echo "H2 jar not found at: $H2_JAR" >&2
  exit 1
fi

if [ ! -f "${H2_DB_PATH}.mv.db" ]; then
  echo "H2 DB file not found at: ${H2_DB_PATH}.mv.db" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

echo "Exporting legacy H2 data from $H2_DB_PATH ..."
java -cp "$H2_JAR" org.h2.tools.Shell \
  -url "jdbc:h2:file:${H2_DB_PATH};DB_CLOSE_DELAY=-1" \
  -user "$H2_USER" \
  -password "$H2_PASSWORD" \
  -sql "CALL CSVWRITE('${TMP_DIR}/substitution_plan_documents.csv', 'SELECT ID, PLAN_UUID, GROUP_NAME, PLAN_DATE, TITLE, DETAIL_URL, RAW_HTML, CONTENT_HASH, FETCHED_AT, UPDATED_AT, SOURCE_DATE, SOURCE_TITLE, PAGE_NUMBER, PAGE_COUNT FROM SUBSTITUTION_PLAN_DOCUMENTS ORDER BY ID')"

if java -cp "$H2_JAR" org.h2.tools.Shell \
  -url "jdbc:h2:file:${H2_DB_PATH};DB_CLOSE_DELAY=-1" \
  -user "$H2_USER" \
  -password "$H2_PASSWORD" \
  -sql "CALL CSVWRITE('${TMP_DIR}/api_response_cache.csv', 'SELECT CACHE_KEY, JSON_BODY, CONTENT_HASH, UPDATED_AT, 0 AS VERSION FROM API_RESPONSE_CACHE ORDER BY CACHE_KEY')" >/dev/null 2>&1; then
  HAS_CACHE_EXPORT=1
else
  HAS_CACHE_EXPORT=0
fi

echo "Importing into PostgreSQL ..."
export PGPASSWORD="$PG_PASSWORD"

psql "$PG_URL" -U "$PG_USER" -v ON_ERROR_STOP=1 <<SQL
CREATE TEMP TABLE import_substitution_plan_documents (
  id BIGINT,
  plan_uuid VARCHAR(36),
  group_name VARCHAR(255),
  plan_date VARCHAR(255),
  title VARCHAR(512),
  detail_url VARCHAR(1024),
  raw_html TEXT,
  content_hash VARCHAR(64),
  fetched_at TIMESTAMP,
  updated_at TIMESTAMP,
  source_date VARCHAR(255),
  source_title VARCHAR(512),
  page_number INTEGER,
  page_count INTEGER
);
\copy import_substitution_plan_documents FROM '${TMP_DIR}/substitution_plan_documents.csv' WITH (FORMAT csv)

INSERT INTO substitution_plan_documents (
  id, plan_uuid, group_name, plan_date, title, detail_url, raw_html, content_hash,
  fetched_at, updated_at, source_date, source_title, page_number, page_count
)
SELECT
  id, plan_uuid, group_name, plan_date, title, detail_url, raw_html, content_hash,
  fetched_at, updated_at, source_date, source_title, page_number, page_count
FROM import_substitution_plan_documents
ON CONFLICT (id) DO UPDATE SET
  plan_uuid = EXCLUDED.plan_uuid,
  group_name = EXCLUDED.group_name,
  plan_date = EXCLUDED.plan_date,
  title = EXCLUDED.title,
  detail_url = EXCLUDED.detail_url,
  raw_html = EXCLUDED.raw_html,
  content_hash = EXCLUDED.content_hash,
  fetched_at = EXCLUDED.fetched_at,
  updated_at = EXCLUDED.updated_at,
  source_date = EXCLUDED.source_date,
  source_title = EXCLUDED.source_title,
  page_number = EXCLUDED.page_number,
  page_count = EXCLUDED.page_count;

SELECT setval(
  pg_get_serial_sequence('substitution_plan_documents', 'id'),
  COALESCE((SELECT MAX(id) FROM substitution_plan_documents), 1),
  true
);
SQL

if [ "$HAS_CACHE_EXPORT" -eq 1 ]; then
  psql "$PG_URL" -U "$PG_USER" -v ON_ERROR_STOP=1 <<SQL
CREATE TEMP TABLE import_api_response_cache (
  cache_key VARCHAR(128),
  json_body TEXT,
  content_hash VARCHAR(64),
  updated_at TIMESTAMP,
  version BIGINT
);
\copy import_api_response_cache FROM '${TMP_DIR}/api_response_cache.csv' WITH (FORMAT csv)

INSERT INTO api_response_cache (cache_key, json_body, content_hash, updated_at, version)
SELECT cache_key, json_body, content_hash, updated_at, version
FROM import_api_response_cache
ON CONFLICT (cache_key) DO UPDATE SET
  json_body = EXCLUDED.json_body,
  content_hash = EXCLUDED.content_hash,
  updated_at = EXCLUDED.updated_at,
  version = EXCLUDED.version;
SQL
fi

echo "Legacy H2 import completed."
