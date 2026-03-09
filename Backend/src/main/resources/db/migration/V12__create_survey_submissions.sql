create table if not exists survey_submissions (
    id varchar(36) primary key,
    display_id varchar(36) not null,
    category varchar(40) not null,
    message text not null,
    submitter_name varchar(160),
    created_at timestamp not null,
    source_ip_hash varchar(128) not null,
    constraint fk_survey_submissions_display
        foreign key (display_id) references display(id)
);

create index if not exists idx_survey_submissions_created_at
    on survey_submissions (created_at desc);

create index if not exists idx_survey_submissions_display_id
    on survey_submissions (display_id);

create index if not exists idx_survey_submissions_category_created_at
    on survey_submissions (category, created_at desc);
