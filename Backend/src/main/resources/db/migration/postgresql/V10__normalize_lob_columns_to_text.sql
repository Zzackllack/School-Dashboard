DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'substitution_plan_documents'
          AND column_name = 'raw_html'
          AND udt_name = 'oid'
    ) THEN
        ALTER TABLE substitution_plan_documents
            ADD COLUMN raw_html_text TEXT;

        UPDATE substitution_plan_documents
        SET raw_html_text = convert_from(lo_get(raw_html), 'UTF8');

        ALTER TABLE substitution_plan_documents
            DROP COLUMN raw_html;

        ALTER TABLE substitution_plan_documents
            RENAME COLUMN raw_html_text TO raw_html;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'api_response_cache'
          AND column_name = 'json_body'
          AND udt_name = 'oid'
    ) THEN
        ALTER TABLE api_response_cache
            ADD COLUMN json_body_text TEXT;

        UPDATE api_response_cache
        SET json_body_text = convert_from(lo_get(json_body), 'UTF8');

        ALTER TABLE api_response_cache
            DROP COLUMN json_body;

        ALTER TABLE api_response_cache
            RENAME COLUMN json_body_text TO json_body;
    END IF;
END $$;
