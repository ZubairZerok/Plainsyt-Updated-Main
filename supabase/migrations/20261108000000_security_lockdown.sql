-- ============================================================================
-- 20261108000000_security_lockdown.sql
-- PLAiNSYT: authoritative row-level-security + server-side integrity layer.
--
-- Replaces EVERY earlier policy on the public tables (earlier migrations opened
-- comments/posts/reactions/notifications/bookmarks to anonymous writes).
-- Idempotent: safe to run more than once. Apply BEFORE deploying the matching client.
--
--   supabase db push            (CLI)   -- or paste into the Supabase SQL editor
--
-- After applying, grant yourself the admin role (see bottom of file).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 0. Roles (replaces hard-coded e-mail lists). No client policies on purpose:
--    rows are managed with the service role / SQL editor only.
-- ---------------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('admin', 'editor'))
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

-- Carry over the previous e-mail based access exactly once (confirmed accounts only).
insert into public.app_admins (user_id, role)
select u.id, 'admin' from auth.users u
where lower(u.email) in ('plaiinsyt@gmail.com', 'pl@insyt.bd') and u.email_confirmed_at is not null
on conflict (user_id) do nothing;

insert into public.app_admins (user_id, role)
select u.id, 'editor' from auth.users u
where lower(u.email) in ('z65gt9@gmail.com', 'zubair.bau.01@gmail.com') and u.email_confirmed_at is not null
on conflict (user_id) do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid() and role in ('admin', 'editor'));
$$;

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.app_admins where user_id = auth.uid();
$$;

grant execute on function public.is_admin(), public.is_editor(), public.my_role() to anon, authenticated;

-- Flag set only by trusted trigger functions below (transaction-local; clients cannot call set_config).
create or replace function public._sys() returns boolean
language sql stable as $$ select coalesce(current_setting('plainsyt.sys', true), '') = '1' $$;

create or replace function public._sys_on() returns void
language sql as $$ select set_config('plainsyt.sys', '1', true) $$;

-- ---------------------------------------------------------------------------
-- 1. Schema additions
-- ---------------------------------------------------------------------------
alter table public.comments add column if not exists parent_id text default null;
alter table public.event_registrations
  add column if not exists name text not null default '',
  add column if not exists email text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists organization text not null default '';

-- Orphan replies must go before the FK can exist.
delete from public.comments c
where c.parent_id is not null and not exists (select 1 from public.comments p where p.id = c.parent_id);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'comments_parent_fk') then
    alter table public.comments
      add constraint comments_parent_fk foreign key (parent_id) references public.comments(id) on delete cascade;
  end if;
end $$;
create index if not exists idx_comments_parent on public.comments (parent_id);

-- Only http(s) links may be stored (blocks javascript:/data: URLs).
update public.posts set external_link = '' where coalesce(external_link, '') <> '' and external_link !~* '^https?://';
update public.articles set external_link = '' where coalesce(external_link, '') <> '' and external_link !~* '^https?://';
update public.profiles set website = '' where coalesce(website, '') <> '' and website !~* '^https?://';
update public.events set external_link = '' where coalesce(external_link, '') <> '' and external_link !~* '^https?://';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_link_http') then
    alter table public.posts add constraint posts_link_http check (coalesce(external_link, '') = '' or external_link ~* '^https?://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_link_http') then
    alter table public.articles add constraint articles_link_http check (coalesce(external_link, '') = '' or external_link ~* '^https?://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_website_http') then
    alter table public.profiles add constraint profiles_website_http check (coalesce(website, '') = '' or website ~* '^https?://');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_text_len') then
    alter table public.comments add constraint comments_text_len check (char_length(text) between 1 and 5000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'posts_content_len') then
    alter table public.posts add constraint posts_content_len check (char_length(content) <= 20000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reels_media_len') then
    alter table public.reels add constraint reels_media_len check (char_length(media_url) <= 2048) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stories_media_len') then
    alter table public.stories add constraint stories_media_len check (char_length(image_url) <= 2048) not valid;
  end if;
end $$;

create unique index if not exists newsletter_email_lower_uq on public.newsletter_subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- 2. Drop EVERY existing policy on our tables (names drifted between migrations)
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','profile_login_aliases','articles','posts','comments','reactions','reels',
                        'stories','events','event_registrations','bookmarks','follows','notifications',
                        'newsletter_subscribers','orders','ideas','research_papers','store_products')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','profile_login_aliases','articles','posts','comments','reactions','reels',
                           'stories','events','event_registrations','bookmarks','follows','notifications',
                           'newsletter_subscribers','orders','ideas','research_papers','store_products']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Removed features (store, ideas, papers, aliases): no client access at all. Data is kept, not dropped.
revoke all on public.orders, public.store_products, public.ideas, public.research_papers, public.profile_login_aliases
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Policies
-- ---------------------------------------------------------------------------
-- Public content is readable by everyone.
create policy profiles_read   on public.profiles for select using (true);
create policy articles_read   on public.articles for select using (true);
create policy posts_read      on public.posts    for select using (true);
create policy comments_read   on public.comments for select using (true);
create policy reactions_read  on public.reactions for select using (true);
create policy reels_read      on public.reels    for select using (true);
create policy events_read     on public.events   for select using (true);
create policy follows_read    on public.follows  for select using (true);
create policy stories_read    on public.stories  for select using (expires_at is null or expires_at > now() or public.is_editor());

-- Profiles: own row only. Privileged columns are protected by trigger below.
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = (select auth.uid())::text);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())::text or public.is_admin())
  with check (id = (select auth.uid())::text or public.is_admin());

-- Articles / posts: authors only (author_id must be the caller).
create policy articles_insert_own on public.articles for insert to authenticated
  with check (author_id = (select auth.uid())::text);
create policy articles_update_own on public.articles for update to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin())
  with check (author_id = (select auth.uid())::text or public.is_admin());
create policy articles_delete_own on public.articles for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

create policy posts_insert_own on public.posts for insert to authenticated
  with check (author_id = (select auth.uid())::text);
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin())
  with check (author_id = (select auth.uid())::text or public.is_admin());
create policy posts_delete_own on public.posts for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

-- Comments: own only (admins may delete for moderation).
create policy comments_insert_own on public.comments for insert to authenticated
  with check (author_id = (select auth.uid())::text);
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid())::text) with check (author_id = (select auth.uid())::text);
create policy comments_delete_own on public.comments for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

-- Reactions: own rows only.
create policy reactions_insert_own on public.reactions for insert to authenticated
  with check (user_id = (select auth.uid())::text);
create policy reactions_update_own on public.reactions for update to authenticated
  using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
create policy reactions_delete_own on public.reactions for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- Bookmarks: private to the owner.
create policy bookmarks_own on public.bookmarks for all to authenticated
  using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);

-- Follows: public graph, you can only change your own edges.
create policy follows_insert_own on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid())::text and following_id <> follower_id);
create policy follows_delete_own on public.follows for delete to authenticated
  using (follower_id = (select auth.uid())::text);

-- Notifications: recipient only. NO insert policy: they are created by triggers.
create policy notifications_read_own on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid())::text);
create policy notifications_update_own on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())::text) with check (recipient_id = (select auth.uid())::text);
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (recipient_id = (select auth.uid())::text);

-- Reels: owner; Stories: editors publish, owner manages; Events: admin.
create policy reels_insert_own on public.reels for insert to authenticated
  with check (creator_id = (select auth.uid())::text);
create policy reels_update_own on public.reels for update to authenticated
  using (creator_id = (select auth.uid())::text or public.is_admin())
  with check (creator_id = (select auth.uid())::text or public.is_admin());
create policy reels_delete_own on public.reels for delete to authenticated
  using (creator_id = (select auth.uid())::text or public.is_admin());

create policy stories_insert_editor on public.stories for insert to authenticated
  with check (author_id = (select auth.uid())::text and public.is_editor());
create policy stories_update_own on public.stories for update to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin())
  with check (author_id = (select auth.uid())::text or public.is_admin());
create policy stories_delete_own on public.stories for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

create policy events_write_admin on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Event registrations: private to the registrant (and admins).
create policy registrations_read on public.event_registrations for select to authenticated
  using (user_id = (select auth.uid())::text or public.is_admin());
create policy registrations_insert_own on public.event_registrations for insert to authenticated
  with check (user_id = (select auth.uid())::text);
create policy registrations_update_own on public.event_registrations for update to authenticated
  using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
create policy registrations_delete_own on public.event_registrations for delete to authenticated
  using (user_id = (select auth.uid())::text);

-- Newsletter: anyone may subscribe (valid e-mail only); only editors may read the list.
create policy newsletter_insert on public.newsletter_subscribers for insert to anon, authenticated
  with check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create policy newsletter_read_editor on public.newsletter_subscribers for select to authenticated
  using (public.is_editor());

-- ---------------------------------------------------------------------------
-- 4. E-mail privacy: public profile reads exclude the e-mail column.
-- ---------------------------------------------------------------------------
revoke select on public.profiles from anon, authenticated;
grant select (id, name, name_bn, handle, role, organization, location, bio, avatar, cover_gradient,
              is_verified, focus_area, website, publications_count, followers_count, following_count, created_at)
  on public.profiles to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Integrity triggers
-- ---------------------------------------------------------------------------
-- 5a. Profiles: users cannot grant themselves verification or edit counters.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public._sys() and not public.is_admin() then
    new.id := old.id;
    new.email := old.email;
    new.created_at := old.created_at;
    new.is_verified := old.is_verified;
    new.followers_count := old.followers_count;
    new.following_count := old.following_count;
    new.publications_count := old.publications_count;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 5b. Server-controlled values on insert, and display fields copied from the real profile
--     (so nobody can post under another person's name/avatar or fake counters).
create or replace function public.sanitize_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if tg_table_name = 'comments' then
    select * into p from public.profiles where id = new.author_id;
    if found then
      new.author := p.name; new.avatar := p.avatar;
      new.role := p.role || case when p.organization <> '' then ' · ' || p.organization else '' end;
    end if;
    new.likes := 0; new.reaction_counts := '{}'::jsonb;
  elsif tg_table_name = 'posts' then
    select * into p from public.profiles where id = new.author_id;
    if found then
      new.author_json := jsonb_build_object('id', p.id, 'name', p.name, 'avatar', p.avatar,
        'role', p.role || case when p.organization <> '' then ' · ' || p.organization else '' end,
        'isVerified', p.is_verified);
    end if;
    new.reaction_counts := '{}'::jsonb;
    new.stats := '{"likes":0,"commentsCount":0,"shares":0}'::jsonb;
  elsif tg_table_name = 'articles' then
    select * into p from public.profiles where id = new.author_id;
    if found then
      new.author_json := jsonb_build_object('id', p.id, 'name', coalesce(nullif(p.name_bn, ''), p.name),
        'nameBn', coalesce(nullif(p.name_bn, ''), p.name), 'designation', p.role,
        'organization', p.organization, 'avatar', p.avatar, 'isVerified', p.is_verified);
    end if;
    if not public.is_editor() then new.featured := false; end if;
    new.reaction_counts := '{}'::jsonb;
    new.stats := '{"views":0,"likes":0,"commentsCount":0,"shares":0}'::jsonb;
  elsif tg_table_name = 'reels' then
    select * into p from public.profiles where id = new.creator_id;
    if found then new.creator := p.name; new.creator_avatar := p.avatar; end if;
    new.likes := 0; new.views := 0; new.reaction_counts := '{}'::jsonb;
  elsif tg_table_name = 'stories' then
    select * into p from public.profiles where id = new.author_id;
    if found then new.author_name := p.name; new.author_avatar := p.avatar; end if;
  elsif tg_table_name = 'reactions' then
    select * into p from public.profiles where id = new.user_id;
    if found then
      new.user_name := p.name; new.user_avatar := p.avatar;
      new.user_role := p.role || case when p.organization <> '' then ' · ' || p.organization else '' end;
    end if;
    new.id := 'rx-' || new.target_type || '-' || new.target_id || '-' || new.user_id;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['comments','posts','articles','reels','stories','reactions'] loop
    execute format('drop trigger if exists trg_sanitize_insert on public.%I', t);
    execute format('create trigger trg_sanitize_insert before insert on public.%I for each row execute function public.sanitize_insert()', t);
  end loop;
end $$;

-- 5c. Derived columns cannot be edited by clients (only by the trusted triggers below).
create or replace function public.lock_derived_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public._sys() then return new; end if;
  if tg_table_name = 'comments' then
    new.id := old.id; new.target_type := old.target_type; new.target_id := old.target_id;
    new.author_id := old.author_id; new.author := old.author; new.avatar := old.avatar; new.role := old.role;
    new.parent_id := old.parent_id; new.likes := old.likes; new.reaction_counts := old.reaction_counts;
  elsif tg_table_name = 'posts' then
    new.id := old.id; new.author_id := old.author_id; new.author_json := old.author_json;
    new.stats := old.stats; new.reaction_counts := old.reaction_counts;
  elsif tg_table_name = 'articles' then
    new.id := old.id; new.author_id := old.author_id; new.author_json := old.author_json;
    new.stats := old.stats; new.reaction_counts := old.reaction_counts;
    if not public.is_editor() then new.featured := old.featured; end if;
  elsif tg_table_name = 'reels' then
    new.id := old.id; new.creator_id := old.creator_id; new.creator := old.creator; new.creator_avatar := old.creator_avatar;
    new.likes := old.likes; new.views := old.views; new.reaction_counts := old.reaction_counts;
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['comments','posts','articles','reels'] loop
    execute format('drop trigger if exists trg_lock_derived on public.%I', t);
    execute format('create trigger trg_lock_derived before update on public.%I for each row execute function public.lock_derived_columns()', t);
  end loop;
end $$;

-- 5d. Reaction counters are derived from the reactions table.
create or replace function public.recount_reactions() returns trigger
language plpgsql security definer set search_path = public as $$
declare t_type text := coalesce(new.target_type, old.target_type);
        t_id   text := coalesce(new.target_id,   old.target_id);
        counts jsonb; total int;
begin
  perform public._sys_on();
  select coalesce(jsonb_object_agg(type, n), '{}'::jsonb), coalesce(sum(n), 0)::int
    into counts, total
    from (select type, count(*)::int as n from public.reactions where target_type = t_type and target_id = t_id group by type) s;
  if t_type = 'article' then update public.articles set reaction_counts = counts where id = t_id;
  elsif t_type = 'post' then update public.posts set reaction_counts = counts where id = t_id;
  elsif t_type = 'reel' then update public.reels set reaction_counts = counts, likes = total where id = t_id;
  elsif t_type = 'comment' then update public.comments set reaction_counts = counts, likes = total where id = t_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_recount_reactions on public.reactions;
create trigger trg_recount_reactions after insert or update or delete on public.reactions
  for each row execute function public.recount_reactions();

-- 5e. Comment counters.
create or replace function public.recount_comments() returns trigger
language plpgsql security definer set search_path = public as $$
declare t_type text := coalesce(new.target_type, old.target_type);
        t_id   text := coalesce(new.target_id,   old.target_id);
        n int;
begin
  perform public._sys_on();
  select count(*)::int into n from public.comments where target_type = t_type and target_id = t_id;
  if t_type = 'article' then
    update public.articles set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{commentsCount}', to_jsonb(n)) where id = t_id;
  elsif t_type = 'post' then
    update public.posts set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{commentsCount}', to_jsonb(n)) where id = t_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_recount_comments on public.comments;
create trigger trg_recount_comments after insert or delete on public.comments
  for each row execute function public.recount_comments();

-- 5f. Follower / following / publication counters.
create or replace function public.recount_follows() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text := coalesce(new.follower_id, old.follower_id);
        b text := coalesce(new.following_id, old.following_id);
begin
  perform public._sys_on();
  update public.profiles set following_count = (select count(*) from public.follows where follower_id = a) where id = a;
  update public.profiles set followers_count = (select count(*) from public.follows where following_id = b) where id = b;
  return null;
end $$;
drop trigger if exists trg_recount_follows on public.follows;
create trigger trg_recount_follows after insert or delete on public.follows
  for each row execute function public.recount_follows();

create or replace function public.recount_publications() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text := coalesce(new.author_id, old.author_id);
begin
  perform public._sys_on();
  update public.profiles set publications_count = (select count(*) from public.articles where author_id = a) where id = a;
  return null;
end $$;
drop trigger if exists trg_recount_publications on public.articles;
create trigger trg_recount_publications after insert or delete on public.articles
  for each row execute function public.recount_publications();

-- Re-sync every counter once so existing rows are correct.
select public._sys_on();
update public.profiles p set
  followers_count = (select count(*) from public.follows f where f.following_id = p.id),
  following_count = (select count(*) from public.follows f where f.follower_id = p.id),
  publications_count = (select count(*) from public.articles a where a.author_id = p.id);
update public.articles a set
  reaction_counts = coalesce((select jsonb_object_agg(type, n) from (select type, count(*)::int n from public.reactions r where r.target_type = 'article' and r.target_id = a.id group by type) s), '{}'::jsonb),
  stats = jsonb_set(coalesce(a.stats, '{}'::jsonb), '{commentsCount}', to_jsonb((select count(*) from public.comments c where c.target_type = 'article' and c.target_id = a.id)));
update public.posts po set
  reaction_counts = coalesce((select jsonb_object_agg(type, n) from (select type, count(*)::int n from public.reactions r where r.target_type = 'post' and r.target_id = po.id group by type) s), '{}'::jsonb),
  stats = jsonb_set(coalesce(po.stats, '{}'::jsonb), '{commentsCount}', to_jsonb((select count(*) from public.comments c where c.target_type = 'post' and c.target_id = po.id)));
update public.comments cm set
  reaction_counts = coalesce((select jsonb_object_agg(type, n) from (select type, count(*)::int n from public.reactions r where r.target_type = 'comment' and r.target_id = cm.id group by type) s), '{}'::jsonb),
  likes = (select count(*) from public.reactions r where r.target_type = 'comment' and r.target_id = cm.id);
update public.reels rl set
  reaction_counts = coalesce((select jsonb_object_agg(type, n) from (select type, count(*)::int n from public.reactions r where r.target_type = 'reel' and r.target_id = rl.id group by type) s), '{}'::jsonb),
  likes = (select count(*) from public.reactions r where r.target_type = 'reel' and r.target_id = rl.id);

-- 5g. Notifications are created here (clients cannot forge them).
create or replace function public._notify(
  p_recipient text, p_actor text, p_type text, p_entity_type text, p_entity_id text, p_url text, p_msg text
) returns void language plpgsql security definer set search_path = public as $$
declare a public.profiles;
begin
  if p_recipient is null or p_recipient = '' or p_recipient = p_actor then return; end if;
  select * into a from public.profiles where id = p_actor;
  insert into public.notifications (id, recipient_id, actor_id, actor_name, actor_avatar, type, entity_type, entity_id, target_url, message)
  values ('notif-' || gen_random_uuid()::text, p_recipient, p_actor, coalesce(a.name, ''), coalesce(a.avatar, ''),
          p_type, p_entity_type, p_entity_id, p_url, p_msg);
end $$;

create or replace function public._target_owner(t_type text, t_id text, out owner text, out url text, out label text)
language plpgsql stable security definer set search_path = public as $$
begin
  if t_type = 'article' then
    select author_id, '/article/' || id, left(title, 40) into owner, url, label from public.articles where id = t_id;
  elsif t_type = 'post' then
    select author_id, '/post/' || id, left(content, 40) into owner, url, label from public.posts where id = t_id;
  elsif t_type = 'reel' then
    select creator_id, '/reel/' || id, left(title, 40) into owner, url, label from public.reels where id = t_id;
  elsif t_type = 'comment' then
    select c.author_id,
           case c.target_type when 'article' then '/article/' || c.target_id when 'post' then '/post/' || c.target_id else '/reel/' || c.target_id end,
           left(c.text, 35)
      into owner, url, label from public.comments c where c.id = t_id;
  end if;
end $$;

create or replace function public.notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record; parent_author text; actor_name text;
begin
  select name into actor_name from public.profiles where id = new.author_id;
  select * into o from public._target_owner(new.target_type, new.target_id);
  if o.owner is not null then
    perform public._notify(o.owner, new.author_id, 'comment', new.target_type, new.target_id, o.url,
      coalesce(actor_name, 'একজন সদস্য') || ' আপনার "' || coalesce(o.label, '') || '" বিষয়ে মন্তব্য করেছেন: "' || left(new.text, 35) || '..."');
  end if;
  if new.parent_id is not null then
    select author_id into parent_author from public.comments where id = new.parent_id;
    if parent_author is distinct from o.owner then
      perform public._notify(parent_author, new.author_id, 'comment', 'comment', new.parent_id, o.url,
        coalesce(actor_name, 'একজন সদস্য') || ' আপনার মন্তব্যের উত্তর দিয়েছেন: "' || left(new.text, 35) || '..."');
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments for each row execute function public.notify_on_comment();

create or replace function public.notify_on_reaction() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record; actor_name text;
begin
  select name into actor_name from public.profiles where id = new.user_id;
  select * into o from public._target_owner(new.target_type, new.target_id);
  if o.owner is not null then
    perform public._notify(o.owner, new.user_id, 'reaction', new.target_type, new.target_id, o.url,
      coalesce(actor_name, 'একজন সদস্য') || ' আপনার "' || coalesce(o.label, '') || '" বিষয়ে প্রতিক্রিয়া জানিয়েছেন।');
  end if;
  return null;
end $$;
drop trigger if exists trg_notify_reaction on public.reactions;
create trigger trg_notify_reaction after insert on public.reactions for each row execute function public.notify_on_reaction();

create or replace function public.notify_on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor_name text;
begin
  select name into actor_name from public.profiles where id = new.follower_id;
  perform public._notify(new.following_id, new.follower_id, 'follow', 'profile', new.follower_id, '/profile/' || new.follower_id,
    coalesce(actor_name, 'একজন সদস্য') || ' আপনাকে ফলো করতে শুরু করেছেন।');
  return null;
end $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows for each row execute function public.notify_on_follow();

-- Notifications whose target disappeared should disappear too.
create or replace function public.cleanup_comment_data() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.reactions where target_type = 'comment' and target_id = old.id;
  return old;
end $$;
drop trigger if exists trg_cleanup_comment on public.comments;
create trigger trg_cleanup_comment before delete on public.comments for each row execute function public.cleanup_comment_data();

-- ---------------------------------------------------------------------------
-- 6. RPCs
-- ---------------------------------------------------------------------------
create or replace function public.increment_article_view(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public._sys_on();
  update public.articles
     set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{views}', to_jsonb(coalesce((stats->>'views')::int, 0) + 1))
   where id = p_id;
end $$;
grant execute on function public.increment_article_view(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Sign-up trigger: never fail a sign-up because of a handle collision.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  raw_name text; raw_avatar text; base_handle text; candidate text; n int := 0;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
                       new.raw_user_meta_data->>'user_name', split_part(coalesce(new.email, 'member'), '@', 1));
  raw_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture',
                         'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text);
  base_handle := regexp_replace(lower(coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user')), '[^a-z0-9_]', '_', 'g');
  candidate := base_handle;
  while exists (select 1 from public.profiles where handle = candidate) loop
    n := n + 1;
    candidate := base_handle || '_' || substr(replace(new.id::text, '-', ''), 1, 4 + n);
    exit when n > 20;
  end loop;

  insert into public.profiles (id, name, name_bn, handle, role, organization, location, bio, avatar, email,
                               is_verified, publications_count, followers_count, following_count)
  values (new.id::text, raw_name, raw_name, candidate, 'সদস্য', 'PLAiNSYT Platform', 'বাংলাদেশ',
          'PLAiNSYT কমিউনিটি সদস্য।', raw_avatar, coalesce(new.email, ''), false, 0, 0, 0)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 8. Media storage bucket (only where Supabase Storage exists)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage')
     and exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
    on conflict (id) do update set public = true, file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

    drop policy if exists media_public_read on storage.objects;
    drop policy if exists media_insert_own on storage.objects;
    drop policy if exists media_delete_own on storage.objects;
    create policy media_public_read on storage.objects for select using (bucket_id = 'media');
    create policy media_insert_own on storage.objects for insert to authenticated
      with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
    create policy media_delete_own on storage.objects for delete to authenticated
      using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end $$;

commit;

-- ---------------------------------------------------------------------------
-- AFTER APPLYING: make sure your own account has the admin role (SQL editor, service role):
--   insert into public.app_admins (user_id, role)
--   select id, 'admin' from auth.users where email = 'YOUR-ADMIN-EMAIL' on conflict (user_id) do update set role = 'admin';
-- ---------------------------------------------------------------------------
