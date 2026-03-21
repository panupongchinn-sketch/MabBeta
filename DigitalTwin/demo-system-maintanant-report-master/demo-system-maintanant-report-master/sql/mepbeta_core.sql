-- Ai MepBeta - minimum data platform schema
-- Recommended stack: PostgreSQL + PostGIS (+ optional TimescaleDB extension)

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- A. Data source registry
create table if not exists api_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_name text not null,
  base_url text,
  auth_type text,
  polling_interval_sec integer not null default 300,
  webhook_enabled boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists api_sources_type_idx on api_sources(source_type);

-- Core asset + location model
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  location_name text,
  district text,
  province text,
  lat double precision,
  lng double precision,
  geom geometry(Point, 4326),
  area_polygon geometry(Polygon, 4326),
  created_at timestamptz not null default now()
);
create index if not exists locations_geom_idx on locations using gist (geom);
create index if not exists locations_polygon_idx on locations using gist (area_polygon);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  asset_type text not null, -- lamp | cctv | water_sensor | air_station | traffic_sensor
  source_id uuid references api_sources(id),
  location_id uuid references locations(id),
  status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assets_type_idx on assets(asset_type);
create index if not exists assets_source_idx on assets(source_id);

-- C. Raw / normalized / analytics
create table if not exists raw_events (
  id bigserial primary key,
  source_type text not null,
  received_via text not null default 'poll', -- poll | webhook
  payload jsonb not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists raw_events_source_idx on raw_events(source_type, fetched_at desc);

create table if not exists normalized_events (
  id bigserial primary key,
  source_type text not null,
  asset_id uuid null references assets(id),
  location_id uuid null references locations(id),
  location_lat double precision,
  location_lng double precision,
  status text,
  value_numeric double precision,
  value_text text,
  unit text,
  severity text,
  event_ts timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists normalized_events_ts_idx on normalized_events(event_ts desc);
create index if not exists normalized_events_source_idx on normalized_events(source_type, event_ts desc);

create table if not exists time_series_metrics (
  id bigserial primary key,
  metric_name text not null, -- pm25_avg_hourly / water_level / traffic_volume
  zone text,
  value_numeric double precision not null,
  unit text,
  bucket_ts timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists time_series_metrics_idx on time_series_metrics(metric_name, bucket_ts desc);

-- Domain event tables (optional denormalized read models)
create table if not exists traffic_events (
  id bigserial primary key,
  asset_id uuid null references assets(id),
  congestion_level text,
  speed_kmh double precision,
  incident_flag boolean not null default false,
  event_ts timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists lighting_events (
  id bigserial primary key,
  asset_id uuid null references assets(id),
  lamp_status text,
  fault_code text,
  event_ts timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists water_events (
  id bigserial primary key,
  asset_id uuid null references assets(id),
  level_cm double precision,
  flow_rate double precision,
  risk_level text,
  event_ts timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists air_quality_events (
  id bigserial primary key,
  asset_id uuid null references assets(id),
  pm25 double precision,
  aqi double precision,
  event_ts timestamptz not null,
  metadata jsonb not null default '{}'::jsonb
);

-- D/F/G operational tables
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  severity text not null,
  status text not null default 'open',
  zone text,
  title text not null,
  detail text,
  started_at timestamptz not null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists incidents_status_idx on incidents(status, severity, started_at desc);

create table if not exists alert_logs (
  id bigserial primary key,
  incident_id uuid references incidents(id) on delete set null,
  channel text not null, -- line | email | telegram | web
  recipient text,
  message text not null,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
);
create index if not exists alert_logs_sent_idx on alert_logs(sent_at desc);

-- E. AI reports
create table if not exists ai_reports (
  id uuid primary key default gen_random_uuid(),
  report_type text not null default 'daily', -- daily | incident | weekly
  location text,
  content text not null,
  kpi_snapshot jsonb,
  incidents jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);
create index if not exists ai_reports_created_idx on ai_reports(created_at desc);

-- Access control baseline
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  role_name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);
