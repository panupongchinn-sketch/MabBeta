-- ============================================================
-- License Keys table
-- Super Admin สร้าง key แจกให้ผู้ใช้เพื่อ activate บัญชี
-- ============================================================

create table if not exists public.license_keys (
  id          uuid        primary key default gen_random_uuid(),
  key         text        unique not null,          -- e.g. "ABCDE-FGHIJ-KLMNO-PQRST"
  is_used     boolean     not null default false,
  used_by     uuid        null references public.app_users(id) on delete set null,
  used_at     timestamptz null,
  created_by  uuid        null references public.app_users(id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz null,                     -- null = ไม่มีวันหมดอายุ
  note        text        null                      -- หมายเหตุของ admin
);

create index if not exists idx_license_keys_key
  on public.license_keys (key);

create index if not exists idx_license_keys_used_by
  on public.license_keys (used_by);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.license_keys enable row level security;

create policy "allow_select_license_keys"
  on public.license_keys for select
  to anon, authenticated
  using (true);

create policy "allow_insert_license_keys"
  on public.license_keys for insert
  to anon, authenticated
  with check (true);

create policy "allow_update_license_keys"
  on public.license_keys for update
  to anon, authenticated
  using (true);

create policy "allow_delete_license_keys"
  on public.license_keys for delete
  to anon, authenticated
  using (true);
