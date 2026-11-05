-- ==============================================================================
-- PLAiNSYT AUTOMATED GOOGLE OAUTH PROFILE CREATION & RLS REPAIR MIGRATION
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fycghkjzodjrqornkton/sql
-- ==============================================================================

-- 1. Ensure public.profiles table exists with all standard columns
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  name_bn text not null default '',
  handle text unique not null,
  role text not null default 'সদস্য',
  organization text not null default 'PLAiNSYT Platform',
  location text not null default 'বাংলাদেশ',
  bio text not null default 'PLAiNSYT কমিউনিটি সদস্য।',
  avatar text not null default '',
  cover_gradient text not null default 'linear-gradient(135deg, #061621 0%, #03EF62 100%)',
  is_verified boolean not null default false,
  focus_area text not null default 'কৃষি ও প্রযুক্তি',
  website text default '',
  email text default '',
  publications_count integer not null default 0,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 3. Bulletproof RLS Policies for Profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_owner" on public.profiles;
create policy "profiles_insert_owner" on public.profiles
  for insert with check (
    auth.uid() is not null and (auth.uid()::text = id or public.is_admin())
  );

drop policy if exists "profiles_update_owner" on public.profiles;
create policy "profiles_update_owner" on public.profiles
  for update using (
    auth.uid() is not null and (auth.uid()::text = id or public.is_admin())
  ) with check (
    auth.uid() is not null and (auth.uid()::text = id or public.is_admin())
  );

-- 4. Automatic User Profile Creator Trigger on auth.users
-- Whenever someone logs in or signs up via Google OAuth, this triggers in PostgreSQL
-- with SECURITY DEFINER to immediately create their profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_name text;
  raw_avatar text;
  email_prefix text;
  generated_handle text;
begin
  -- Extract Google / OAuth metadata
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    split_part(coalesce(new.email, 'member'), '@', 1)
  );

  raw_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text
  );

  email_prefix := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'user'), '[^a-z0-9_]', '_', 'g'));
  generated_handle := email_prefix || '_' || substr(replace(new.id::text, '-', ''), 1, 4);

  insert into public.profiles (
    id,
    name,
    name_bn,
    handle,
    role,
    organization,
    location,
    bio,
    avatar,
    email,
    is_verified,
    publications_count,
    followers_count,
    following_count
  ) values (
    new.id::text,
    raw_name,
    raw_name,
    generated_handle,
    'সদস্য',
    'PLAiNSYT Platform',
    'বাংলাদেশ',
    'PLAiNSYT কমিউনিটি সদস্য।',
    raw_avatar,
    coalesce(new.email, ''),
    false,
    0,
    0,
    0
  )
  on conflict (id) do update set
    name = coalesce(excluded.name, profiles.name),
    avatar = case when excluded.avatar is not null and excluded.avatar <> '' then excluded.avatar else profiles.avatar end,
    email = coalesce(excluded.email, profiles.email);

  return new;
end;
$$;

-- 5. Attach Trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also ensure any existing auth.users without a profile get one created retroactively
insert into public.profiles (
  id, name, name_bn, handle, role, organization, location, bio, avatar, email, is_verified, publications_count, followers_count, following_count
)
select
  u.id::text,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email, 'member'), '@', 1)),
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(coalesce(u.email, 'member'), '@', 1)),
  lower(regexp_replace(coalesce(split_part(u.email, '@', 1), 'user'), '[^a-z0-9_]', '_', 'g')) || '_' || substr(replace(u.id::text, '-', ''), 1, 4),
  'সদস্য',
  'PLAiNSYT Platform',
  'বাংলাদেশ',
  'PLAiNSYT কমিউনিটি সদস্য।',
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || u.id::text),
  coalesce(u.email, ''),
  false,
  0,
  0,
  0
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id::text)
on conflict (id) do nothing;

