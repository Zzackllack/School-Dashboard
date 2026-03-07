CREATE TABLE IF NOT EXISTS display (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    location_label VARCHAR(160),
    status VARCHAR(32) NOT NULL,
    assigned_profile_id VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_display_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS display_enrollment_code (
    id VARCHAR(36) PRIMARY KEY,
    code_hash VARCHAR(128) NOT NULL,
    created_by_admin_id VARCHAR(120),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    max_uses INT NOT NULL,
    uses_count INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_display_enrollment_code_hash ON display_enrollment_code (code_hash);

CREATE TABLE IF NOT EXISTS display_enrollment_request (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_code_id VARCHAR(36) NOT NULL,
    proposed_display_name VARCHAR(160) NOT NULL,
    device_info_json TEXT,
    status VARCHAR(32) NOT NULL,
    display_id VARCHAR(36),
    issued_session_token VARCHAR(256),
    approved_by_admin_id VARCHAR(120),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_display_enrollment_request_code FOREIGN KEY (enrollment_code_id) REFERENCES display_enrollment_code(id),
    CONSTRAINT fk_display_enrollment_request_display FOREIGN KEY (display_id) REFERENCES display(id)
);

CREATE INDEX IF NOT EXISTS idx_display_enrollment_request_status ON display_enrollment_request (status);

CREATE TABLE IF NOT EXISTS display_session (
    id VARCHAR(36) PRIMARY KEY,
    display_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by_admin_id VARCHAR(120),
    CONSTRAINT fk_display_session_display FOREIGN KEY (display_id) REFERENCES display(id),
    CONSTRAINT uq_display_session_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_display_session_display_id ON display_session (display_id);

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(120) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(120) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at);
