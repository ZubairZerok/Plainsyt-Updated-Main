-- 20261107_newsletter_and_editorial.sql
-- Newsletter audience and editorial dashboard permissions

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "newsletter_insert_public" on public.newsletter_subscribers;
create policy "newsletter_insert_public" on public.newsletter_subscribers
  for insert with check (true);

drop policy if exists "newsletter_select_editorial" on public.newsletter_subscribers;
create policy "newsletter_select_editorial" on public.newsletter_subscribers
  for select using (true);
