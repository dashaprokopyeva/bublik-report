-- Выполнить в Supabase SQL Editor.
create table if not exists public.allowed_users (
 telegram_id bigint primary key,
 display_name text,
 role text not null default 'viewer' check (role in ('admin','viewer')),
 is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.excel_uploads (
 id uuid primary key default gen_random_uuid(),
 storage_path text not null unique,
 original_name text not null,
 sha256 text not null,
 uploaded_by text not null,
 source text not null check(source in ('web','telegram')),
 created_at timestamptz not null default now()
);
alter table public.allowed_users enable row level security;
alter table public.excel_uploads enable row level security;
-- Без публичных RLS policies: доступ только через сервер с service_role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('excel-uploads','excel-uploads',false,10485760,array['application/octet-stream'])
on conflict(id) do update set public=false;
-- Замените ID и имя на свои; роль admin нужна для загрузки Excel.
-- insert into public.allowed_users(telegram_id,display_name,role) values (123456789,'Администратор','admin');
