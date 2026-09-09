create table if not exists app_profile (
  id text primary key,
  display_name text not null default 'pixel200p',
  cover_data text,
  avatar_data text,
  updated_at timestamptz not null default now()
);

insert into app_profile (id, display_name)
values ('default', 'pixel200p')
on conflict (id) do nothing;

create table if not exists price_snapshots (
  asset_id text not null references assets(id) on delete cascade,
  as_of date not null,
  price numeric not null,
  primary key (asset_id, as_of)
);

create table if not exists fx_snapshots (
  as_of date primary key,
  usd_vnd numeric not null
);