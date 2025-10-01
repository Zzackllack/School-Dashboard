CREATE TABLE IF NOT EXISTS substitution_plan_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_uuid VARCHAR(36) NOT NULL,
    group_name VARCHAR(255),
    plan_date VARCHAR(255),
    title VARCHAR(512),
    detail_url VARCHAR(1024) NOT NULL,
    raw_html CLOB NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    fetched_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    source_date VARCHAR(255),
    source_title VARCHAR(512),
    page_number INTEGER,
    page_count INTEGER,
    CONSTRAINT uk_plan_unique UNIQUE (plan_uuid, detail_url)
);
