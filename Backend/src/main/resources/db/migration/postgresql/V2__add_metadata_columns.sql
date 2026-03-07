ALTER TABLE substitution_plan_documents ADD COLUMN IF NOT EXISTS source_date VARCHAR(255);
ALTER TABLE substitution_plan_documents ADD COLUMN IF NOT EXISTS source_title VARCHAR(512);
ALTER TABLE substitution_plan_documents ADD COLUMN IF NOT EXISTS page_number INTEGER;
ALTER TABLE substitution_plan_documents ADD COLUMN IF NOT EXISTS page_count INTEGER;

UPDATE substitution_plan_documents
SET title = COALESCE(title, REGEXP_REPLACE(detail_url, '^.*/', ''));
