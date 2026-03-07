ALTER TABLE display_enrollment_request
    ADD COLUMN IF NOT EXISTS one_time_handoff_token_hash VARCHAR(128);
