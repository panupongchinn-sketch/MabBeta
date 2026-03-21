-- Run this in Supabase SQL Editor to prepare Storage for project model files
-- NOTE: Policies below are permissive for quick development/testing.
-- Tighten them before production use.

insert into storage.buckets (id, name, public)
values ('digital-twin-project-files', 'digital-twin-project-files', false)
on conflict (id) do nothing;

drop policy if exists "dtwin_file_read" on storage.objects;
create policy "dtwin_file_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'digital-twin-project-files');

drop policy if exists "dtwin_file_insert" on storage.objects;
create policy "dtwin_file_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'digital-twin-project-files');

drop policy if exists "dtwin_file_update" on storage.objects;
create policy "dtwin_file_update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'digital-twin-project-files')
with check (bucket_id = 'digital-twin-project-files');

drop policy if exists "dtwin_file_delete" on storage.objects;
create policy "dtwin_file_delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'digital-twin-project-files');

