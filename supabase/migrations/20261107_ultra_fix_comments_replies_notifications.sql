-- 20261107_ultra_fix_comments_replies_notifications.sql
-- PLAiNSYT Production Migration: Comments, Replies, Notifications & Reactions RLS Fix

-- 1. Ensure comments table supports hierarchical parent replies
alter table if exists public.comments
  add column if not exists parent_id text default null;

create index if not exists idx_comments_parent on public.comments (parent_id);

-- 2. Open up RLS on public.comments so ALL authenticated visitors and local sessions can comment and reply
alter table public.comments enable row level security;

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public" on public.comments
  for select using (true);

drop policy if exists "comments_insert_auth" on public.comments;
drop policy if exists "comments_insert_all" on public.comments;
create policy "comments_insert_all" on public.comments
  for insert with check (true);

drop policy if exists "comments_modify_author_or_admin" on public.comments;
drop policy if exists "comments_modify_all" on public.comments;
create policy "comments_modify_all" on public.comments
  for update using (true) with check (true);

drop policy if exists "comments_delete_author_or_admin" on public.comments;
drop policy if exists "comments_delete_all" on public.comments;
create policy "comments_delete_all" on public.comments
  for delete using (true);

-- 3. Open up RLS on public.posts so community posts are saved and visible across devices
alter table public.posts enable row level security;

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public" on public.posts
  for select using (true);

drop policy if exists "posts_insert_auth" on public.posts;
drop policy if exists "posts_insert_all" on public.posts;
create policy "posts_insert_all" on public.posts
  for insert with check (true);

drop policy if exists "posts_modify_author_or_admin" on public.posts;
drop policy if exists "posts_modify_all" on public.posts;
create policy "posts_modify_all" on public.posts
  for update using (true) with check (true);

-- 4. Ensure public.notifications receives like & comment reply alerts
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_recipient" on public.notifications;
drop policy if exists "notifications_select_public" on public.notifications;
create policy "notifications_select_public" on public.notifications
  for select using (true);

drop policy if exists "notifications_insert_all" on public.notifications;
create policy "notifications_insert_all" on public.notifications
  for insert with check (true);

drop policy if exists "notifications_modify_all" on public.notifications;
create policy "notifications_modify_all" on public.notifications
  for update using (true) with check (true);

-- 5. Ensure public.reactions allows like/bulb reactions on posts, articles, comments, and reels
alter table public.reactions enable row level security;

drop policy if exists "reactions_select_public" on public.reactions;
create policy "reactions_select_public" on public.reactions
  for select using (true);

drop policy if exists "reactions_insert_auth" on public.reactions;
drop policy if exists "reactions_insert_all" on public.reactions;
create policy "reactions_insert_all" on public.reactions
  for insert with check (true);

drop policy if exists "reactions_modify_all" on public.reactions;
create policy "reactions_modify_all" on public.reactions
  for update using (true) with check (true);

drop policy if exists "reactions_delete_all" on public.reactions;
create policy "reactions_delete_all" on public.reactions
  for delete using (true);

