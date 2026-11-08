-- 20261109000000_notifications_v2.sql
-- Notifications v2: grouped ("A, B ও আরও ৩ জন…"), retracted when the action is undone,
-- reply + @mention + new-article alerts, deep links to the exact comment, realtime, pruning.
-- Idempotent. Apply AFTER 20261108000000_security_lockdown.sql.

begin;

-- ---------------------------------------------------------------------------
-- 1. Schema
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists actor_ids   text[]      not null default '{}',
  add column if not exists actors      jsonb       not null default '[]'::jsonb,  -- newest first, max 3
  add column if not exists actor_count integer     not null default 1,
  add column if not exists group_key   text,                                      -- null = never grouped
  add column if not exists entity_label text       not null default '',
  add column if not exists snippet     text        not null default '',
  add column if not exists source_id   text,                                      -- e.g. the comment that caused it
  add column if not exists updated_at  timestamptz not null default now();

-- Backfill v1 rows so the client can treat every row the same way.
update public.notifications
   set actor_ids = case when actor_id <> '' then array[actor_id] else '{}' end,
       actors = case when actor_id <> '' then jsonb_build_array(jsonb_build_object('id', actor_id, 'name', actor_name, 'avatar', actor_avatar)) else '[]'::jsonb end,
       updated_at = created_at
 where actor_ids = '{}';

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('reaction', 'comment', 'reply', 'mention', 'bookmark', 'follow', 'new_article', 'system'));

create index if not exists idx_notifs_recipient_updated on public.notifications (recipient_id, updated_at desc);
-- At most one UNREAD row per group: new activity folds into it; once read, the next activity starts a new row.
create unique index if not exists uq_notifs_open_group
  on public.notifications (recipient_id, group_key) where group_key is not null and not is_read;
create index if not exists idx_notifs_source on public.notifications (source_id) where source_id is not null;

-- Clients may only flip is_read (no rewriting messages/actors of their own rows).
revoke update on public.notifications from authenticated, anon;
grant update (is_read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Message text (kept server-side too, for e-mail/push later and old clients)
-- ---------------------------------------------------------------------------
create or replace function public._notif_message(
  p_type text, p_name text, p_count int, p_entity_type text, p_label text, p_snippet text
) returns text language sql immutable as $$
  select
    (case
       when p_type in ('mention', 'new_article') then coalesce(nullif(p_name, ''), 'একজন সদস্য')
       when p_count > 1 then coalesce(nullif(p_name, ''), 'একজন সদস্য') || ' ও আরও ' || (p_count - 1) || ' জন'
       else coalesce(nullif(p_name, ''), 'একজন সদস্য')
     end)
    || case p_type
         when 'reaction' then ' আপনার ' || case p_entity_type when 'post' then 'পোস্টে' when 'article' then 'প্রতিবেদনে'
                                            when 'reel' then 'রিলে' when 'comment' then 'মন্তব্যে' else 'কনটেন্টে' end
                              || ' প্রতিক্রিয়া জানিয়েছেন' || case when coalesce(p_label, '') <> '' then ': "' || p_label || '"' else '' end
         when 'comment'  then ' আপনার ' || case p_entity_type when 'post' then 'পোস্টে' when 'article' then 'প্রতিবেদনে'
                                            when 'reel' then 'রিলে' else 'কনটেন্টে' end
                              || ' মন্তব্য করেছেন: "' || coalesce(p_snippet, '') || '"'
         when 'reply'    then ' আপনার মন্তব্যের উত্তর দিয়েছেন: "' || coalesce(p_snippet, '') || '"'
         when 'mention'  then ' একটি আলোচনায় আপনাকে উল্লেখ করেছেন: "' || coalesce(p_snippet, '') || '"'
         when 'follow'   then ' আপনাকে ফলো করতে শুরু করেছেন।'
         when 'new_article' then ' নতুন প্রতিবেদন প্রকাশ করেছেন: "' || coalesce(p_label, '') || '"'
         else ''
       end
$$;

-- ---------------------------------------------------------------------------
-- 3. Create / fold / retract
-- ---------------------------------------------------------------------------
drop function if exists public._notify(text, text, text, text, text, text, text);

create or replace function public._notify(
  p_recipient text, p_actor text, p_type text, p_entity_type text, p_entity_id text,
  p_url text, p_label text, p_snippet text, p_group boolean default true, p_source text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  a public.profiles;
  v_actor jsonb;
  v_key text;
  v_label text := left(coalesce(p_label, ''), 60);
  v_snip text := left(regexp_replace(coalesce(p_snippet, ''), '\s+', ' ', 'g'), 90);
begin
  if p_recipient is null or p_recipient = '' or p_actor is null or p_recipient = p_actor then return; end if;
  select * into a from public.profiles where id = p_actor;
  v_actor := jsonb_build_object('id', p_actor, 'name', coalesce(a.name, ''), 'avatar', coalesce(a.avatar, ''));
  v_key := case when p_group then p_type || ':' || p_entity_type || ':' || p_entity_id end;

  insert into public.notifications as n
    (id, recipient_id, actor_id, actor_name, actor_avatar, type, entity_type, entity_id, target_url, message,
     entity_label, snippet, source_id, group_key, actor_ids, actors, actor_count, is_read, created_at, updated_at)
  values
    ('notif-' || gen_random_uuid()::text, p_recipient, p_actor, coalesce(a.name, ''), coalesce(a.avatar, ''),
     p_type, p_entity_type, coalesce(p_entity_id, ''), coalesce(p_url, '/'),
     public._notif_message(p_type, coalesce(a.name, ''), 1, p_entity_type, v_label, v_snip),
     v_label, v_snip, p_source, v_key, array[p_actor], jsonb_build_array(v_actor), 1, false, now(), now())
  on conflict (recipient_id, group_key) where group_key is not null and not is_read
  do update set
    actor_id     = excluded.actor_id,
    actor_name   = excluded.actor_name,
    actor_avatar = excluded.actor_avatar,
    actor_ids    = case when p_actor = any(n.actor_ids) then n.actor_ids else n.actor_ids || p_actor end,
    actor_count  = cardinality(case when p_actor = any(n.actor_ids) then n.actor_ids else n.actor_ids || p_actor end),
    actors       = jsonb_build_array(v_actor) || coalesce((
                     select jsonb_agg(e order by i) from (
                       select e, i from jsonb_array_elements(n.actors) with ordinality t(e, i)
                        where e->>'id' <> p_actor order by i limit 2) s), '[]'::jsonb),
    snippet      = excluded.snippet,
    entity_label = excluded.entity_label,
    source_id    = excluded.source_id,
    target_url   = excluded.target_url,
    message      = public._notif_message(n.type, excluded.actor_name,
                     cardinality(case when p_actor = any(n.actor_ids) then n.actor_ids else n.actor_ids || p_actor end),
                     n.entity_type, excluded.entity_label, excluded.snippet),
    updated_at   = now();

  -- Housekeeping: drop this user's READ notifications older than 90 days.
  delete from public.notifications
   where recipient_id = p_recipient and is_read and updated_at < now() - interval '90 days';
end $$;

-- Undo one actor's contribution to an UNREAD group (unlike, unfollow, deleted comment).
create or replace function public._unnotify(
  p_recipient text, p_actor text, p_type text, p_entity_type text, p_entity_id text
) returns void language plpgsql security definer set search_path = public as $$
declare v_key text := p_type || ':' || p_entity_type || ':' || p_entity_id;
begin
  if p_recipient is null or p_actor is null then return; end if;
  delete from public.notifications
   where recipient_id = p_recipient and group_key = v_key and not is_read
     and actor_ids = array[p_actor];
  update public.notifications n set
    actor_ids   = array_remove(n.actor_ids, p_actor),
    actor_count = cardinality(array_remove(n.actor_ids, p_actor)),
    actors      = coalesce((select jsonb_agg(e order by i) from jsonb_array_elements(n.actors) with ordinality t(e, i)
                             where e->>'id' <> p_actor), '[]'::jsonb),
    actor_id    = coalesce((select e->>'id' from jsonb_array_elements(n.actors) with ordinality t(e, i) where e->>'id' <> p_actor order by i limit 1), n.actor_id),
    actor_name  = coalesce((select e->>'name' from jsonb_array_elements(n.actors) with ordinality t(e, i) where e->>'id' <> p_actor order by i limit 1), n.actor_name),
    actor_avatar= coalesce((select e->>'avatar' from jsonb_array_elements(n.actors) with ordinality t(e, i) where e->>'id' <> p_actor order by i limit 1), n.actor_avatar)
   where recipient_id = p_recipient and group_key = v_key and not is_read and p_actor = any(n.actor_ids);
  update public.notifications n set
    message = public._notif_message(n.type, n.actor_name, n.actor_count, n.entity_type, n.entity_label, n.snippet)
   where recipient_id = p_recipient and group_key = v_key and not is_read;
end $$;

revoke all on function public._notify(text, text, text, text, text, text, text, text, boolean, text) from public, anon, authenticated;
revoke all on function public._unnotify(text, text, text, text, text) from public, anon, authenticated;

-- Deep link for a comment: /post/x?c=<comment id>
create or replace function public._comment_url(t_type text, t_id text, c_id text) returns text
language sql immutable as $$
  select case t_type when 'article' then '/article/' when 'post' then '/post/' else '/reel/' end
         || t_id || '?c=' || c_id
$$;

-- ---------------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_reaction() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record; c record;
begin
  select * into o from public._target_owner(new.target_type, new.target_id);
  if o.owner is null then return null; end if;
  if new.target_type = 'comment' then
    select target_type, target_id into c from public.comments where id = new.target_id;
    perform public._notify(o.owner, new.user_id, 'reaction', 'comment', new.target_id,
      public._comment_url(c.target_type, c.target_id, new.target_id), o.label, '', true, null);
  else
    perform public._notify(o.owner, new.user_id, 'reaction', new.target_type, new.target_id, o.url, o.label, '', true, null);
  end if;
  return null;
end $$;
drop trigger if exists trg_notify_reaction on public.reactions;
create trigger trg_notify_reaction after insert on public.reactions for each row execute function public.notify_on_reaction();

create or replace function public.unnotify_on_reaction() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  select * into o from public._target_owner(old.target_type, old.target_id);
  if o.owner is not null then
    perform public._unnotify(o.owner, old.user_id, 'reaction', old.target_type, old.target_id);
  end if;
  return null;
end $$;
drop trigger if exists trg_unnotify_reaction on public.reactions;
create trigger trg_unnotify_reaction after delete on public.reactions for each row execute function public.unnotify_on_reaction();

create or replace function public.notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o record;
  v_url text := public._comment_url(new.target_type, new.target_id, new.id);
  v_parent_author text;
  v_root text;
  v_mention text;
begin
  select * into o from public._target_owner(new.target_type, new.target_id);

  if new.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = new.parent_id;
    v_root := new.parent_id;
    -- "@Name …" at the start of a reply: find that participant in this thread (longest name wins).
    if left(new.text, 1) = '@' then
      select t.author_id into v_mention from (
        select author_id, author from public.comments where id = v_root
        union all
        select author_id, author from public.comments where parent_id = v_root and id <> new.id
      ) t
      where t.author <> '' and new.text like '@' || t.author || '%'
      order by length(t.author) desc limit 1;
    end if;
  end if;

  -- Owner of the post/article/reel (unless they're the one being replied to; they get a "reply" instead).
  if o.owner is not null and o.owner is distinct from v_parent_author then
    perform public._notify(o.owner, new.author_id, 'comment', new.target_type, new.target_id, v_url, o.label, new.text, true, new.id);
  end if;
  -- Author of the comment being replied to.
  if v_parent_author is not null then
    perform public._notify(v_parent_author, new.author_id, 'reply', 'comment', new.parent_id, v_url, '', new.text, true, new.id);
  end if;
  -- Someone @mentioned further down the thread.
  if v_mention is not null and v_mention is distinct from v_parent_author and v_mention is distinct from o.owner then
    perform public._notify(v_mention, new.author_id, 'mention', 'comment', new.id, v_url, '', new.text, false, new.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment after insert on public.comments for each row execute function public.notify_on_comment();

create or replace function public.unnotify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare o record; v_parent_author text;
begin
  -- Anything that points at this comment goes away (mentions, reactions on it, replies to it).
  delete from public.notifications where source_id = old.id and group_key is null;
  delete from public.notifications where entity_type = 'comment' and entity_id = old.id;

  select * into o from public._target_owner(old.target_type, old.target_id);
  if o.owner is not null and not exists (
       select 1 from public.comments where target_type = old.target_type and target_id = old.target_id
          and author_id = old.author_id and id <> old.id) then
    perform public._unnotify(o.owner, old.author_id, 'comment', old.target_type, old.target_id);
  end if;
  if old.parent_id is not null then
    select author_id into v_parent_author from public.comments where id = old.parent_id;
    if v_parent_author is not null and not exists (
         select 1 from public.comments where parent_id = old.parent_id and author_id = old.author_id and id <> old.id) then
      perform public._unnotify(v_parent_author, old.author_id, 'reply', 'comment', old.parent_id);
    end if;
  end if;
  return null;
end $$;
drop trigger if exists trg_unnotify_comment on public.comments;
create trigger trg_unnotify_comment after delete on public.comments for each row execute function public.unnotify_on_comment();

create or replace function public.notify_on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public._notify(new.following_id, new.follower_id, 'follow', 'profile', new.following_id,
    '/profile/' || new.follower_id, '', '', true, null);
  return null;
end $$;
drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow after insert on public.follows for each row execute function public.notify_on_follow();

create or replace function public.unnotify_on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public._unnotify(old.following_id, old.follower_id, 'follow', 'profile', old.following_id);
  return null;
end $$;
drop trigger if exists trg_unnotify_follow on public.follows;
create trigger trg_unnotify_follow after delete on public.follows for each row execute function public.unnotify_on_follow();

-- Followers hear about new articles (capped fan-out).
create or replace function public.notify_on_article() returns trigger
language plpgsql security definer set search_path = public as $$
declare f record;
begin
  for f in select follower_id from public.follows where following_id = new.author_id limit 5000 loop
    perform public._notify(f.follower_id, new.author_id, 'new_article', 'article', new.id,
      '/article/' || coalesce(nullif(new.slug, ''), new.id), new.title, '', false, new.id);
  end loop;
  return null;
end $$;
drop trigger if exists trg_notify_article on public.articles;
create trigger trg_notify_article after insert on public.articles for each row execute function public.notify_on_article();

-- Deleted posts/articles/reels take their notifications with them.
create or replace function public.unnotify_on_target_delete() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_type text := case tg_table_name when 'posts' then 'post' when 'articles' then 'article' else 'reel' end;
begin
  delete from public.notifications where entity_type = v_type and entity_id = old.id;
  return null;
end $$;
drop trigger if exists trg_unnotify_post on public.posts;
create trigger trg_unnotify_post after delete on public.posts for each row execute function public.unnotify_on_target_delete();
drop trigger if exists trg_unnotify_article on public.articles;
create trigger trg_unnotify_article after delete on public.articles for each row execute function public.unnotify_on_target_delete();
drop trigger if exists trg_unnotify_reel on public.reels;
create trigger trg_unnotify_reel after delete on public.reels for each row execute function public.unnotify_on_target_delete();

-- ---------------------------------------------------------------------------
-- 5. Realtime: the app subscribes to its own notification rows.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

commit;
