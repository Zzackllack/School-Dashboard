ALTER TABLE display_enrollment_request
    ADD COLUMN IF NOT EXISTS issued_session_token_hash VARCHAR(128);

ALTER TABLE display_enrollment_request
    DROP COLUMN IF EXISTS issued_session_token;

ALTER TABLE display_enrollment_code
    ADD CONSTRAINT IF NOT EXISTS chk_max_uses_non_negative CHECK (max_uses >= 0);

ALTER TABLE display_enrollment_code
    ADD CONSTRAINT IF NOT EXISTS chk_uses_count_non_negative CHECK (uses_count >= 0);

ALTER TABLE display_enrollment_code
    ADD CONSTRAINT IF NOT EXISTS chk_uses_count_le_max_uses CHECK (uses_count <= max_uses);
