-- AI Reports table
-- เก็บรายงานที่ AI สร้างไว้ สำหรับดูย้อนหลัง

create table if not exists ai_reports (
  id           uuid primary key default gen_random_uuid(),
  report_type  text not null default 'daily',   -- daily | incident | weekly
  location     text,
  content      text not null,                   -- รายงาน AI (Thai text)
  kpi_snapshot jsonb,                           -- KPI ที่ส่งเข้า AI
  incidents    jsonb,                           -- incidents ที่ Rule Engine พบ
  created_by   uuid references app_users(id),
  created_at   timestamptz not null default now()
);

create index if not exists ai_reports_created_at_idx on ai_reports(created_at desc);
create index if not exists ai_reports_created_by_idx on ai_reports(created_by);

-- RLS
alter table ai_reports enable row level security;

create policy "ai_reports_select" on ai_reports
  for select using (true);

create policy "ai_reports_insert" on ai_reports
  for insert with check (true);
