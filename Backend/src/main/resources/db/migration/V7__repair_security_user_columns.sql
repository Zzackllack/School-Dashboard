-- Repair drift from early V6 variants that missed lockout columns.
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS locked BOOLEAN;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS failed_login_count INT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

UPDATE app_user SET locked = FALSE WHERE locked IS NULL;
UPDATE app_user SET failed_login_count = 0 WHERE failed_login_count IS NULL;

ALTER TABLE app_user ALTER COLUMN locked SET DEFAULT FALSE;
ALTER TABLE app_user ALTER COLUMN failed_login_count SET DEFAULT 0;

ALTER TABLE app_user ALTER COLUMN locked SET NOT NULL;
ALTER TABLE app_user ALTER COLUMN failed_login_count SET NOT NULL;
