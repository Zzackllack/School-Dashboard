ALTER TABLE display_enrollment_request
    ADD COLUMN IF NOT EXISTS issued_session_token_hash VARCHAR(128);

ALTER TABLE display_enrollment_request
    DROP COLUMN IF EXISTS issued_session_token;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_max_uses_non_negative') THEN
        ALTER TABLE display_enrollment_code
            ADD CONSTRAINT chk_max_uses_non_negative CHECK (max_uses >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_uses_count_non_negative') THEN
        ALTER TABLE display_enrollment_code
            ADD CONSTRAINT chk_uses_count_non_negative CHECK (uses_count >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_uses_count_le_max_uses') THEN
        ALTER TABLE display_enrollment_code
            ADD CONSTRAINT chk_uses_count_le_max_uses CHECK (uses_count <= max_uses);
    END IF;
END $$;
