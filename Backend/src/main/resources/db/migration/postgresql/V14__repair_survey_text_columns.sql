DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'survey_submissions'
          AND column_name = 'message'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE survey_submissions
            ALTER COLUMN message TYPE TEXT
            USING convert_from(message, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'survey_submissions'
          AND column_name = 'submitter_name'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE survey_submissions
            ALTER COLUMN submitter_name TYPE VARCHAR(160)
            USING convert_from(submitter_name, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'survey_submissions'
          AND column_name = 'school_class'
          AND data_type = 'bytea'
    ) THEN
        ALTER TABLE survey_submissions
            ALTER COLUMN school_class TYPE VARCHAR(40)
            USING convert_from(school_class, 'UTF8');
    END IF;
END $$;
