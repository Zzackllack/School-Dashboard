alter table survey_submissions add column if not exists school_class varchar(40);
alter table survey_submissions add column if not exists contact_allowed boolean not null default false;
