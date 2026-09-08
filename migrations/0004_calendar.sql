create table if not exists calendar_events (
  id text primary key,
  title text not null,
  event_date date not null,
  yearly boolean not null default false,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists calendar_events_active_date_idx
  on calendar_events (event_date)
  where deleted_at is null;