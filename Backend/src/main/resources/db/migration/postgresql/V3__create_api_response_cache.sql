CREATE TABLE IF NOT EXISTS api_response_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    json_body TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
