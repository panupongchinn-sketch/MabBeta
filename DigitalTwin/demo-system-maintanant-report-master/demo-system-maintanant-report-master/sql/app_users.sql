-- ============================================================
-- Custom Auth: app_users table
-- ใช้ระบบ Auth เองโดยไม่ผ่าน Supabase Auth
-- ============================================================

create table if not exists public.app_users (
  id              uuid        primary key default gen_random_uuid(),
  full_name       text        not null,
  email           text        unique not null,
  organization    text        null,                     -- บริษัท / หน่วยงาน
  password_hash   text        not null,
  role            text        not null default 'user',  -- 'user' | 'super_admin'
  is_active       boolean     not null default false,   -- ต้องใช้ license key ก่อน
  license_key_id  uuid        null,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz null
);

-- ถ้า table มีอยู่แล้ว ให้เพิ่ม column organization:
-- alter table public.app_users add column if not exists organization text null;

-- Index สำหรับค้นหาตาม email (ใช้ตอน login)
create index if not exists idx_app_users_email
  on public.app_users (email);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.app_users enable row level security;

-- อนุญาตให้ anon ดูข้อมูลได้ (จำเป็นสำหรับ client-side auth)
create policy "allow_select_app_users"
  on public.app_users for select
  to anon, authenticated
  using (true);

-- อนุญาตให้ anon สมัครสมาชิกได้
create policy "allow_insert_app_users"
  on public.app_users for insert
  to anon, authenticated
  with check (true);

-- อนุญาตให้ anon อัปเดตได้ (login timestamp, activate)
create policy "allow_update_app_users"
  on public.app_users for update
  to anon, authenticated
  using (true);

-- อนุญาตให้ anon ลบได้ (super admin จัดการ)
create policy "allow_delete_app_users"
  on public.app_users for delete
  to anon, authenticated
  using (true);

-- ============================================================
-- Seed: Super Admin
-- Super Admin หลักของระบบ: panupong.chinn@gmail.com
--
-- วิธีที่ 1: สมัครผ่านหน้า /admin/setup ด้วยอีเมล panupong.chinn@gmail.com
--
-- วิธีที่ 2: หลังจาก register ผ่าน /signup แล้ว รัน SQL นี้:
--   UPDATE public.app_users
--   SET role = 'super_admin', is_active = true
--   WHERE email = 'panupong.chinn@gmail.com';
-- ============================================================
