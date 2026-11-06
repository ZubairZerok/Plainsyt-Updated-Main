export const PLAINSYT_SCHEMA_SQL_RAW = `-- ============================================================================
-- PLAINSYT (প্লেইনসাইট) — FULL PRODUCTION SUPABASE SCHEMA & SEED
-- Project Ref: fycghkjzodjrqornkton
-- Run this script in: https://supabase.com/dashboard/project/fycghkjzodjrqornkton/sql/new
-- ============================================================================

create extension if not exists pg_trgm;

-- 1. PROFILES
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  name_bn text not null default '',
  handle text unique not null,
  role text not null default '',
  organization text not null default '',
  location text not null default '',
  bio text not null default '',
  avatar text not null default '',
  cover_gradient text not null default 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
  is_verified boolean not null default false,
  focus_area text not null default '',
  website text default '',
  email text default '',
  publications_count integer not null default 0,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_handle on public.profiles (handle);
create index if not exists idx_profiles_created_brin on public.profiles using brin (created_at);

-- 2. PROFILE LOGIN ALIASES
create table if not exists public.profile_login_aliases (
  id text primary key,
  auth_user_id text not null references public.profiles(id) on delete cascade,
  email_normalized text unique not null,
  is_verified boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_aliases_email on public.profile_login_aliases (email_normalized);
create index if not exists idx_aliases_user on public.profile_login_aliases (auth_user_id);

-- 3. ARTICLES
create table if not exists public.articles (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  slug text unique,
  category text not null,
  category_en text not null default '',
  image_type text not null default 'floating',
  cover_image_url text default '',
  image_caption text default '',
  author_id text not null references public.profiles(id) on delete cascade,
  author_json jsonb not null default '{}'::jsonb,
  published_at text not null default '',
  read_time_minutes integer not null default 5,
  featured boolean not null default false,
  content jsonb not null default '[]'::jsonb,
  takeaways jsonb not null default '[]'::jsonb,
  external_link text default '',
  research_basis jsonb default null,
  stats jsonb not null default '{"views":0,"likes":0,"commentsCount":0,"shares":0}'::jsonb,
  reaction_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_articles_created_keyset on public.articles (created_at desc, id desc);
create index if not exists idx_articles_author on public.articles (author_id, created_at desc);
create index if not exists idx_articles_category on public.articles (category, created_at desc);
create index if not exists idx_articles_slug on public.articles (slug);
create index if not exists idx_articles_title_trgm on public.articles using gin (title gin_trgm_ops);

-- 4. COMMUNITY POSTS
create table if not exists public.posts (
  id text primary key,
  author_id text not null references public.profiles(id) on delete cascade,
  author_json jsonb not null default '{}'::jsonb,
  timestamp_label text not null default '',
  content text not null,
  images jsonb not null default '[]'::jsonb,
  external_link text default '',
  shared_post jsonb default null,
  stats jsonb not null default '{"likes":0,"commentsCount":0,"shares":0}'::jsonb,
  reaction_counts jsonb not null default '{}'::jsonb,
  text_theme text default '',
  ai_label boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_created_keyset on public.posts (created_at desc, id desc);
create index if not exists idx_posts_author on public.posts (author_id, created_at desc);

-- 5. COMMENTS
create table if not exists public.comments (
  id text primary key,
  target_type text not null check (target_type in ('article', 'post', 'reel')),
  target_id text not null,
  author_id text not null,
  author text not null,
  avatar text not null default '',
  role text not null default '',
  text text not null,
  timestamp_label text not null default '',
  likes integer not null default 0,
  reaction_counts jsonb not null default '{}'::jsonb,
  parent_id text default null,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_target on public.comments (target_type, target_id, created_at desc);
create index if not exists idx_comments_parent on public.comments (parent_id);
create index if not exists idx_comments_brin on public.comments using brin (created_at);

-- 6. LINKEDIN REACTIONS
create table if not exists public.reactions (
  id text primary key,
  target_type text not null check (target_type in ('article', 'post', 'comment', 'reel')),
  target_id text not null,
  user_id text not null,
  user_name text not null,
  user_avatar text not null default '',
  user_role text not null default '',
  type text not null check (type in ('like', 'celebrate', 'support', 'love', 'insightful', 'curious')),
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);
create index if not exists idx_reactions_target on public.reactions (target_type, target_id, type);
create index if not exists idx_reactions_user on public.reactions (user_id, created_at desc);

-- 7. REELS & STORIES
create table if not exists public.reels (
  id text primary key,
  title text not null,
  creator_id text not null,
  creator text not null,
  creator_avatar text not null default '',
  location text not null default '',
  duration text not null default '1:00',
  views integer not null default 0,
  gradient_theme text not null default 'from-emerald-900 to-lime-700',
  video_type text not null default 'greenhouse-iot',
  media_url text not null,
  video_url text default '',
  likes integer not null default 0,
  reaction_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stories (
  id text primary key,
  title text not null,
  category text not null,
  image_url text not null,
  icon_name text not null default 'seedling',
  reads_count text not null default '0',
  author_id text not null,
  author_name text not null,
  author_avatar text not null default '',
  article_id text default null,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

-- 8. EVENTS & REGISTRATIONS
create table if not exists public.events (
  id text primary key,
  title text not null,
  date_month text not null,
  date_day text not null,
  location text not null,
  attendees_count text not null default '0',
  organizer_id text default '',
  organizer_name text default '',
  description text default '',
  external_link text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  event_id text not null references public.events(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- 9. RESEARCH PAPERS
create table if not exists public.research_papers (
  id text primary key,
  institution text not null,
  institution_code text not null,
  title text not null,
  summary text not null,
  practical_impact text not null,
  published_date text not null,
  researchers jsonb not null default '[]'::jsonb,
  author_id text default '',
  doi_link text default '',
  created_at timestamptz not null default now()
);

-- 10. STORE PRODUCTS & ORDERS
create table if not exists public.store_products (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(12,2) not null,
  unit text not null default 'পিস',
  tag text not null default 'Agri-Tech',
  image text not null,
  seller_id text not null,
  seller text not null,
  stock integer not null default 50,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  buyer_id text not null,
  buyer_name text not null,
  buyer_phone text not null,
  district text not null,
  delivery_address text not null,
  delivery_zone text not null default 'inside_dhaka',
  notes text default '',
  items jsonb not null default '[]'::jsonb,
  subtotal_bdt numeric(12,2) not null,
  delivery_fee_bdt numeric(12,2) not null,
  total_bdt numeric(12,2) not null,
  receiver_bkash text not null default '01771047033',
  sender_bkash text not null,
  trx_id text unique not null,
  payment_method text not null default 'bkash_send_money',
  payment_screenshot text default '',
  status text not null default 'paid_verifying',
  created_at timestamptz not null default now()
);

-- 11. IDEAS, BOOKMARKS, FOLLOWS
create table if not exists public.ideas (
  id text primary key,
  title text not null,
  body text not null,
  author_id text not null,
  author text not null,
  author_avatar text default '',
  votes integer not null default 1,
  tag text not null default 'এগ্রি-টেক',
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  user_id text not null,
  target_type text not null check (target_type in ('article', 'post', 'reel')),
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table if not exists public.follows (
  follower_id text not null,
  following_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

-- 12. NOTIFICATIONS
create table if not exists public.notifications (
  id text primary key,
  recipient_id text not null,
  actor_id text not null default '',
  actor_name text not null default '',
  actor_avatar text not null default '',
  type text not null check (type in ('reaction', 'comment', 'bookmark', 'follow', 'system')),
  entity_type text not null check (entity_type in ('article', 'post', 'reel', 'profile', 'comment')),
  entity_id text not null default '',
  target_url text not null default '/',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifs_recipient on public.notifications (recipient_id, created_at desc);
create index if not exists idx_notifs_unread on public.notifications (recipient_id, is_read);

-- 13. SECURITY HELPER FUNCTION
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt()->>'email' in ('plaiinsyt@gmail.com', 'pl@insyt.bd'),
    false
  );
$$;

-- 14. ROW LEVEL SECURITY (RLS) ACTIVATION & CLEANUP
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','profile_login_aliases','articles','posts','comments',
    'reactions','reels','stories','events','event_registrations',
    'research_papers','store_products','orders','ideas','bookmarks','follows','notifications'
  ] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);
      execute format('drop policy if exists "Public read %I" on public.%I;', t, t);
      execute format('drop policy if exists "Public write %I" on public.%I;', t, t);
    end if;
  end loop;
end $$;

-- 15. SCOPED HARDENED RLS POLICIES
-- Profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles for select using (true);

drop policy if exists "profiles_insert_owner" on public.profiles;
create policy "profiles_insert_owner" on public.profiles for insert with check (auth.uid() is not null or public.is_admin());

drop policy if exists "profiles_update_owner" on public.profiles;
create policy "profiles_update_owner" on public.profiles for update using (auth.uid()::text = id or public.is_admin()) with check (auth.uid()::text = id or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete using (public.is_admin());

-- Aliases
drop policy if exists "aliases_select_owner_or_admin" on public.profile_login_aliases;
create policy "aliases_select_owner_or_admin" on public.profile_login_aliases for select using (auth.uid()::text = auth_user_id or public.is_admin());

drop policy if exists "aliases_write_admin" on public.profile_login_aliases;
create policy "aliases_write_admin" on public.profile_login_aliases for all using (public.is_admin()) with check (public.is_admin());

-- Articles & Papers
drop policy if exists "articles_select_public" on public.articles;
create policy "articles_select_public" on public.articles for select using (true);

drop policy if exists "articles_insert_author" on public.articles;
create policy "articles_insert_author" on public.articles for insert with check (auth.uid() is not null or public.is_admin());

drop policy if exists "articles_modify_author_or_admin" on public.articles;
create policy "articles_modify_author_or_admin" on public.articles for update using (auth.uid()::text = author_id or public.is_admin()) with check (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "articles_delete_author_or_admin" on public.articles;
create policy "articles_delete_author_or_admin" on public.articles for delete using (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "papers_select_public" on public.research_papers;
create policy "papers_select_public" on public.research_papers for select using (true);

drop policy if exists "papers_write_admin" on public.research_papers;
create policy "papers_write_admin" on public.research_papers for all using (public.is_admin()) with check (public.is_admin());

-- Posts
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public" on public.posts for select using (true);

drop policy if exists "posts_insert_author" on public.posts;
create policy "posts_insert_author" on public.posts for insert with check (auth.uid() is not null or public.is_admin());

drop policy if exists "posts_modify_author_or_admin" on public.posts;
create policy "posts_modify_author_or_admin" on public.posts for update using (auth.uid()::text = author_id or public.is_admin()) with check (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "posts_delete_author_or_admin" on public.posts;
create policy "posts_delete_author_or_admin" on public.posts for delete using (auth.uid()::text = author_id or public.is_admin());

-- Comments
drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public" on public.comments for select using (true);

drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth" on public.comments for insert with check (auth.uid() is not null or public.is_admin());

drop policy if exists "comments_modify_author_or_admin" on public.comments;
create policy "comments_modify_author_or_admin" on public.comments for update using (auth.uid()::text = author_id or public.is_admin()) with check (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "comments_delete_author_or_admin" on public.comments;
create policy "comments_delete_author_or_admin" on public.comments for delete using (auth.uid()::text = author_id or public.is_admin());

-- Reactions
drop policy if exists "reactions_select_public" on public.reactions;
create policy "reactions_select_public" on public.reactions for select using (true);

drop policy if exists "reactions_insert_owner" on public.reactions;
drop policy if exists "reactions_delete_owner" on public.reactions;
drop policy if exists "reactions_write_auth" on public.reactions;
create policy "reactions_write_auth" on public.reactions for all
using (auth.uid() is not null or public.is_admin())
with check (auth.uid() is not null or public.is_admin());

-- Reels & Stories
drop policy if exists "reels_select_public" on public.reels;
create policy "reels_select_public" on public.reels for select using (true);

drop policy if exists "reels_write_author_or_admin" on public.reels;
create policy "reels_write_author_or_admin" on public.reels for all using (auth.uid()::text = creator_id or public.is_admin()) with check (auth.uid()::text = creator_id or public.is_admin());

drop policy if exists "stories_select_public" on public.stories;
create policy "stories_select_public" on public.stories for select using (expires_at is null or expires_at > now() or public.is_admin());

drop policy if exists "stories_write_author_or_admin" on public.stories;
create policy "stories_write_author_or_admin" on public.stories for all using (auth.uid()::text = author_id or public.is_admin()) with check (auth.uid()::text = author_id or public.is_admin());

-- Events & Registrations
drop policy if exists "events_select_public" on public.events;
create policy "events_select_public" on public.events for select using (true);

drop policy if exists "events_write_admin" on public.events;
create policy "events_write_admin" on public.events for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "registrations_select_user_or_admin" on public.event_registrations;
create policy "registrations_select_user_or_admin" on public.event_registrations for select using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "registrations_insert_user" on public.event_registrations;
create policy "registrations_insert_user" on public.event_registrations for insert with check (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "registrations_delete_user" on public.event_registrations;
create policy "registrations_delete_user" on public.event_registrations for delete using (auth.uid()::text = user_id or public.is_admin());

-- Store Products & Orders
drop policy if exists "store_products_select_public" on public.store_products;
create policy "store_products_select_public" on public.store_products for select using (true);

drop policy if exists "store_products_write_admin" on public.store_products;
create policy "store_products_write_admin" on public.store_products for all using (public.is_admin()) with check (public.is_admin());

-- Orders: customers only see their own orders; admin sees all
drop policy if exists "orders_select_buyer_or_admin" on public.orders;
create policy "orders_select_buyer_or_admin" on public.orders for select using (auth.uid()::text = buyer_id or public.is_admin());

drop policy if exists "orders_insert_checkout" on public.orders;
create policy "orders_insert_checkout" on public.orders for insert with check (true);

drop policy if exists "orders_modify_admin_only" on public.orders;
create policy "orders_modify_admin_only" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_delete_admin_only" on public.orders;
create policy "orders_delete_admin_only" on public.orders for delete using (public.is_admin());

-- Ideas, Bookmarks, Follows
drop policy if exists "ideas_select_public" on public.ideas;
create policy "ideas_select_public" on public.ideas for select using (true);

drop policy if exists "ideas_insert_author" on public.ideas;
create policy "ideas_insert_author" on public.ideas for insert with check (auth.uid() is not null or public.is_admin());

drop policy if exists "ideas_modify_author_or_admin" on public.ideas;
create policy "ideas_modify_author_or_admin" on public.ideas for update using (auth.uid()::text = author_id or public.is_admin()) with check (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "ideas_delete_author_or_admin" on public.ideas;
create policy "ideas_delete_author_or_admin" on public.ideas for delete using (auth.uid()::text = author_id or public.is_admin());

drop policy if exists "bookmarks_select_owner" on public.bookmarks;
create policy "bookmarks_select_owner" on public.bookmarks for select using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "bookmarks_insert_owner" on public.bookmarks;
create policy "bookmarks_insert_owner" on public.bookmarks for insert with check (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "bookmarks_delete_owner" on public.bookmarks;
create policy "bookmarks_delete_owner" on public.bookmarks for delete using (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "follows_select_public" on public.follows;
create policy "follows_select_public" on public.follows for select using (true);

drop policy if exists "follows_insert_follower" on public.follows;
create policy "follows_insert_follower" on public.follows for insert with check (auth.uid()::text = follower_id or public.is_admin());

drop policy if exists "follows_delete_follower" on public.follows;
create policy "follows_delete_follower" on public.follows for delete using (auth.uid()::text = follower_id or public.is_admin());

-- Notifications
drop policy if exists "notifications_select_recipient_or_admin" on public.notifications;
create policy "notifications_select_recipient_or_admin" on public.notifications for select using (auth.uid()::text = recipient_id or public.is_admin());

drop policy if exists "notifications_insert_all" on public.notifications;
create policy "notifications_insert_all" on public.notifications for insert with check (true);

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient" on public.notifications for update using (auth.uid()::text = recipient_id or public.is_admin()) with check (auth.uid()::text = recipient_id or public.is_admin());

drop policy if exists "notifications_delete_recipient" on public.notifications;
create policy "notifications_delete_recipient" on public.notifications for delete using (auth.uid()::text = recipient_id or public.is_admin());

-- 16. SEED DATA
insert into public.profiles (
  id, name, name_bn, handle, role, organization, location, bio, avatar, is_verified, email, publications_count
) values (
  'usr-plainsyt-admin',
  'PLAiNSYT',
  'প্লেইনসাইট',
  'plainsyt',
  'Admin',
  'PLAiNSYT Editorial & Agro-Tech Publishing',
  'ঢাকা, বাংলাদেশ',
  'কৃষি, প্রযুক্তি, গবেষণা ও জ্ঞানভিত্তিক বাংলাদেশের উন্মুক্ত প্রকাশনা প্ল্যাটফর্ম।',
  '/logos/icon.png',
  true,
  'plaiinsyt@gmail.com',
  1
) on conflict (id) do update set
  role = 'Admin',
  email = 'plaiinsyt@gmail.com',
  is_verified = true;

insert into public.profile_login_aliases (id, auth_user_id, email_normalized, is_verified)
values
  ('alias-1', 'usr-plainsyt-admin', 'plaiinsyt@gmail.com', true),
  ('alias-2', 'usr-plainsyt-admin', 'pl@insyt.bd', true)
on conflict (email_normalized) do update set
  auth_user_id = excluded.auth_user_id;

insert into public.profiles (
  id, name, name_bn, handle, role, organization, location, bio, avatar, is_verified, email, publications_count
) values (
  'usr-zubair',
  'Hasan Zubair',
  'হাসান জুবায়ের',
  'hasanzubair',
  'Research Fellow',
  'Bangladesh Agricultural University (BAU)',
  'ময়মনসিংহ, বাংলাদেশ',
  'গবেষক ও এগ্রো-আইওটি ডেভেলপার। নির্ভুল তথ্যভিত্তিক কৃষি প্রযুক্তির প্রসারে নিবেদিত।',
  'https://lh3.googleusercontent.com/a/ACg8ocKKzx5J69HH-15sdpD7MZWljX6SIYD0HxFVNuix_bU5j6mpvWVx=s96-c',
  true,
  'z65gt9@gmail.com',
  0
) on conflict (id) do update set
  name = excluded.name,
  name_bn = excluded.name_bn,
  handle = excluded.handle,
  avatar = excluded.avatar;

insert into public.articles (
  id,
  title,
  subtitle,
  slug,
  category,
  category_en,
  image_type,
  cover_image_url,
  image_caption,
  author_id,
  author_json,
  published_at,
  read_time_minutes,
  featured,
  content,
  takeaways,
  research_basis,
  stats,
  created_at
) values (
  'art-bina-gamma-2026',
  'বিনার গামা রশ্মি বিকিরণ কেন্দ্র উদ্বোধন, কৃষিপণ্যের সংরক্ষণকাল বাড়বে ১২ মাস পর্যন্ত',
  'বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউটের (বিনা) আঞ্চলিক গবেষণাকেন্দ্রে ৫০০ কেসিআই সক্ষমতার গামা ইরেডিয়েশন সেন্টার (জিআইসি) চালু',
  'bina-gamma-ray-irradiation-center-inauguration-2026',
  'বিজ্ঞান',
  'Nuclear Agriculture & Post-Harvest Technology',
  'floating',
  'https://media.prothomalo.com/prothomalo-bangla%2F2026-10-31%2Fos27skm2%2FBINA.jpeg?rect=1%2C0%2C1599%2C1066&w=622&auto=format%2Ccompress&fmt=avif',
  'গামা ইরেডিয়েশন সেন্টার (জিআইসি) উদ্বোধন করেন কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ। শনিবার গাজীপুরের ভবানীপুরে। ছবি: বিনার সৌজন্যে।',
  'usr-plainsyt-admin',
  jsonb_build_object(
    'id', 'usr-plainsyt-admin',
    'name', 'নিজস্ব প্রতিবেদক',
    'nameBn', 'নিজস্ব প্রতিবেদক',
    'designation', 'স্টাফ করেসপন্ডেন্ট · বিজ্ঞান ও প্রযুক্তি',
    'organization', 'PLAiNSYT Newsroom',
    'avatar', '/logos/icon.png',
    'isVerified', true
  ),
  '০১ নভেম্বর ২০২৬, ০৩:০৭',
  5,
  true,
  jsonb_build_array(
    'কৃষিপণ্য সংরক্ষণে গামা রশ্মি বিকিরণ প্রযুক্তির ব্যবহার বাড়াতে গামা ইরেডিয়েশন সেন্টার (জিআইসি) চালু করেছে বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউটের (বিনা) আঞ্চলিক গবেষণাকেন্দ্র। গাজীপুরের ভবানীপুরে শনিবার কেন্দ্রটির উদ্বোধন করেন কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ।',
    'বাংলাদেশ-চীন অংশীদারত্ব প্রকল্পের আওতায় নবনির্মিত কেন্দ্রটি তিন একর জমির ওপর গড়ে উঠেছে। এটির সক্ষমতা ৫০০ কেসিআই, যা কোবাল্ট-৬০-এর তেজস্ক্রিয়তা ব্যবহার করে তৈরি। সংশ্লিষ্ট গবেষক ও ব্যক্তিরা বলছেন, কৃষিপণ্যের সংরক্ষণকাল বাড়ানো, ক্ষতিকর অণুজীব ও পোকামাকড় নিয়ন্ত্রণ এবং পণ্যের গুণগত মান বজায় রাখতে কেন্দ্রটি গুরুত্বপূর্ণ ভূমিকা রাখবে।',
    'উদ্বোধনী অনুষ্ঠানে কৃষি এবং মৎস্য ও প্রাণিসম্পদমন্ত্রী মোহাম্মদ আমিন উর রশিদ বলেন, আন্তর্জাতিক মান বজায় রেখে কৃষিপণ্য রপ্তানি বাড়াতে গামা ইরেডিয়েশন সেন্টার একটি সময়োপযোগী উদ্যোগ। তাঁর মতে, এই কেন্দ্রের মাধ্যমে মৌসুমে দেশে উৎপাদিত গাজর ও ক্যাপসিকামের মতো সবজি যদি বেশি দিন সংরক্ষণ করা যায়, তাহলে তা অর্থনীতিকে সমৃদ্ধ করবে।',
    'প্রধান অতিথির বক্তব্যে মন্ত্রী আরও জানান, বৈশ্বিক বাজারে আম, কাঁঠাল ও আনারসের ব্যাপক চাহিদা রয়েছে। এই গামা রশ্মি বিকিরণ কেন্দ্রের মাধ্যমে দেশি এসব ফল আন্তর্জাতিক বাজারে রপ্তানিযোগ্য করে তোলা গেলে অনেক বৈদেশিক মুদ্রা অর্জন সম্ভব হবে।',
    'অনুষ্ঠানে স্বাগত বক্তব্য দেন ও মূল প্রবন্ধ উপস্থাপন করেন বিনার মহাপরিচালক শরিফুল হক ভুঁইয়া। তিনি জানান, ৮৯ কোটি টাকা ব্যয়ে নির্মিত এই কেন্দ্র প্রতিবছর ৫৬ হাজার ৫০০ টন পণ্যের সংগ্রহোত্তর ক্ষতি কমাবে। এর মাধ্যমে সাশ্রয় হবে কমপক্ষে ৫৩ কোটি ৭০ লাখ টাকা। তিনি আরও বলেন, গামা রশ্মি প্রয়োগের মাধ্যমে আম ও কলার ‘শেলফ লাইফ’ বা সংরক্ষণকাল ১০ থেকে ২১ দিন, পেঁয়াজ ও আলুর ছয় মাস এবং রসুনের ক্ষেত্রে ১২ মাস পর্যন্ত বাড়ানো সম্ভব।',
    'কৃষিপণ্যের পাশাপাশি মেডিক্যাল সরঞ্জাম শতভাগ জীবাণুমুক্ত করার জন্যও এই গামা রশ্মি বিকিরণ কেন্দ্র সবচেয়ে ভালো উপায় বলে উল্লেখ করেন গাজীপুর-৩ আসনের সংসদ সদস্য এসএম রফিকুল ইসলাম। তাই কেন্দ্রটিকে বহুমুখীভাবে ব্যবহারের কথা বলেন তিনি। আর কৃষি সচিব মো. সেলিম খান বলেন, এই গামা রশ্মি বিকিরণ কেন্দ্রের গবেষণা ও সেবার সঙ্গে কৃষক, কৃষক সংগঠন, কৃষিপণ্য প্রক্রিয়াজাতকারী শিল্প উদ্যোক্তা ও রপ্তানিকারক প্রতিষ্ঠানের মতো অংশীজনদের অবশ্যই সম্পৃক্ত করতে হবে।',
    'অনুষ্ঠানে আরও বক্তব্য দেন জাতিসংঘের খাদ্য ও কৃষি সংস্থার (এফএও) বাংলাদেশ প্রতিনিধি জিয়াকুন শি। বিশেষ অতিথি হিসেবে বক্তব্য দেন বাংলাদেশ আণবিক শক্তি নিয়ন্ত্রণ কর্তৃপক্ষের চেয়ারম্যান মাহমুদুল হাসান, বাংলাদেশ পরমাণু শক্তি কমিশনের চেয়ারম্যান এম মইনুল ইসলাম, চীনের সিএনএফ কোম্পানির ডিজিএম ও আন্তর্জাতিক বিষয়ক পরিচালক ঝাং শুনদে প্রমুখ। সমাপনী বক্তব্য দেন বিনার পরিচালক (প্রশাসন ও সেবা বিভাগ) এম লুৎফর রহমান মোল্লা'
  ),
  jsonb_build_array(
    'গাজীপুরের ভবানীপুরে বিনার ৩ একর জমিতে ৫০০ কেসিআই সক্ষমতার গামা ইরেডিয়েশন সেন্টার চালু হলো।',
    'বার্ষিক ৫৬,৫০০ টন কৃষিপণ্যের সংগ্রহোত্তর ক্ষতি কমিয়ে বছরে অন্তত ৫৩ কোটি ৭০ লাখ টাকা জাতীয় সাশ্রয় হবে।',
    'আম-কলার সংরক্ষণকাল ২১ দিন, পেঁয়াজ-আলুর ৬ মাস এবং রসুনের শেলফ-লাইফ ১২ মাস পর্যন্ত বাড়বে।',
    'কৃষিপণ্য রপ্তানি বৃদ্ধির পাশাপাশি মেডিক্যাল সার্জিক্যাল সরঞ্জাম শতভাগ জীবাণুমুক্ত করতে বহুমুখী ব্যবহারের সুযোগ।'
  ),
  jsonb_build_object(
    'journalOrInst', 'বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউট (বিনা) ও MoFL',
    'doiOrSource', 'BINA Regional Research Center, Bhabanipur, Gazipur',
    'keyMetric', '500 kCi Cobalt-60'
  ),
  jsonb_build_object(
    'views', 0,
    'likes', 0,
    'commentsCount', 0,
    'shares', 0
  ),
  '2026-11-01T03:07:00+06:00'
) on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  takeaways = excluded.takeaways,
  research_basis = excluded.research_basis,
  cover_image_url = excluded.cover_image_url,
  image_caption = excluded.image_caption,
  published_at = excluded.published_at;

insert into public.articles (
  id,
  title,
  subtitle,
  slug,
  category,
  category_en,
  image_type,
  cover_image_url,
  image_caption,
  author_id,
  author_json,
  published_at,
  read_time_minutes,
  featured,
  content,
  takeaways,
  research_basis,
  stats,
  created_at
) values (
  'art-japan-cucumber-robot-2026',
  'ঘুমন্ত গ্রামের নীরব পাহারাদার: ৪০ মিনিটে ১২০টি শসা তোলা জাপানি "রোবট কৃষক" কীভাবে বদলে দিচ্ছে কৃষির ভবিষ্যৎ?',
  'মানুষ যখন গভীর ঘুমে আচ্ছন্ন, মাঠের পর মাঠ তখন জেগে থাকে এক নতুন যুগের কারিগর — ইয়াসকাওয়া ও জেএ জেন-নোহ’র তৈরি এআই রোবট শ্রমিক সংকট কাটিয়ে কৃষিতে আনছে ঐতিহাসিক রূপান্তর',
  'japan-ai-cucumber-harvesting-robot-future-of-smart-agriculture',
  'এগ্রি-টেক ও ড্রোন',
  'Agri-Tech & Robotics',
  'floating',
  '/images/japan_cucumber_robot.jpg',
  'জাপানের সাগা শহরের ইউমে ফার্ম জেন-নোহ গ্রিনহাউসে রাতের আঁধারে মাল্টি-ক্যামেরা সেন্সর ও এআই রোবটিক আর্মে শসা তুলছে আধুনিক রোবট কৃষক। ছবি: PLAiNSYT / জেএ জেন-নোহ সৌজন্যে।',
  'usr-plainsyt-admin',
  jsonb_build_object(
    'id', 'usr-plainsyt-admin',
    'name', 'নিজস্ব প্রতিবেদক',
    'nameBn', 'নিজস্ব প্রতিবেদক',
    'designation', 'স্টাফ করেসপন্ডেন্ট · এগ্রি-টেক ও রোবোটিক্স',
    'organization', 'PLAiNSYT Newsroom',
    'avatar', '/logos/icon.png',
    'isVerified', true
  ),
  '০১ নভেম্বর ২০২৬, ১৮:৫০',
  6,
  true,
  jsonb_build_array(
    'মানুষ যখন গভীর ঘুমে আচ্ছন্ন, মাঠের পর মাঠ তখন জেগে থাকে এক নতুন যুগের কারিগর। নেই কোনো ক্লান্তি, নেই পিঠব্যথার অনুযোগ, এমনকি রাতের আঁধারও যার কাছে দিনের মতোই স্পষ্ট। জাপানের সাগা শহরের ''ইউমে ফার্ম জেন-নোহ'' নামের এক হেক্টর আয়তনের একটি গ্রিনহাউসে এখন এমনই এক দৃশ্য নিয়মিত দেখা যাচ্ছে। সেখানে মানুষের বদলে কাঁধে কাঁধ মিলিয়ে—কিংবা বলা ভালো, মানুষকে ছাড়িয়ে—ফসল তোলার কাজ করছে কৃত্রিম বুদ্ধিমত্তা বা এআই-চালিত এক অদ্ভুত রোবট।',
    'ইয়াসকাওয়া ইলেকট্রিক এবং জাপানের জাতীয় কৃষি সমবায় ফেডারেশন (জেএ জেন-নোহ) যৌথভাবে তৈরি করেছে এই রোবট কৃষককে। প্রযুক্তি আর কৃষির এই মেলবন্ধন কীভাবে বিশ্বজুড়ে কৃষিকাজের সংজ্ঞা বদলে দিচ্ছে, চলুন জানা যাক তার আদ্যোপান্ত।',
    '৪০ মিনিটে ১২০টি শসা: রোবটের অবিশ্বাস্য কর্মদক্ষতা

শুনতে অবিশ্বাস্য মনে হলেও, এই রোবটটি প্রতি ৪০ মিনিটে গড়ে ১২০টি শসা গাছ থেকে পেড়ে ঝুড়িতে তুলতে পারে। অর্থাৎ, প্রতিটি শসা তুলতে এর সময় লাগে মাত্র ২০ সেকেন্ডের মতো। ১ মিটার দীর্ঘ, দূর থেকে দেখতে খানিকটা শামুকের মতো আকৃতির এই রোবটটির ভেতরে রয়েছে অত্যন্ত জটিল সব প্রযুক্তি। এতে রয়েছে বিশেষ ক্যামেরা, সেন্সর, একটি রোবোটিক বাহু (যার গায়ে ইয়াসকাওয়া-র লোগো স্পষ্ট) এবং একটি স্বয়ংক্রিয় গাড়ি বা ক্যারেজ।',
    'এর কাজের প্রক্রিয়াটি দেখার মতো:
১. চাষের সারির মধ্য দিয়ে রোবটটি ধীরে ধীরে চলতে শুরু করে।
২. এর এআই এবং মাল্টি-ক্যামেরা সিস্টেম অনবরত চারপাশের লতা ও পাতা স্ক্যান করতে থাকে।
৩. ঘন পাতার আড়ালে লুকিয়ে থাকা শসার আকার, পরিপক্বতা এবং রং বিশ্লেষণ করে এটি তাৎক্ষণিকভাবে সিদ্ধান্ত নেয় যে সেটি তোলার উপযোগী কি না।
৪. উপযুক্ত শসা চিহ্নিত করার পর, এর নীল রঙের রোবোটিক হাতটি নিখুঁতভাবে এগিয়ে যায়, শসাটিকে হালকাভাবে ধরে এবং হাতের ডগায় থাকা বিশেষ ব্লেড দিয়ে বোঁটা কেটে পেছনের ঝুড়িতে জমা করে।',
    '৫ বছরের কঠোর সংগ্রাম: ১০% থেকে ৮০% সাফল্যের গল্প

এই রোবটের আজকের এই সাফল্য কিন্তু রাতারাতি আসেনি। ২০২১ সালের দিকে যখন এর প্রথম প্রোটোটাইপ বা প্রাথমিক সংস্করণ তৈরি করা হয়েছিল, তখন গাছ থেকে সঠিক আকারের শসা চিনে তোলার ক্ষেত্রে এর সাফল্যের হার ছিল মাত্র ১০ শতাংশ! বেশির ভাগ সময়ই এটি পাতা বা ডালপালা কেটে ফেলত কিংবা ছোট অপুষ্ট শসা তুলে ফেলত।',
    'গ্রিনহাউসের ভেতরের পরিবেশ শিল্পকারখানার মতো নির্দিষ্ট বা নিয়মতান্ত্রিক নয়। সেখানে একেকটি শসার আকার একেক রকম, তারা প্রতিনিয়ত বাড়ছে, দিনের আলোর পরিবর্তনের সাথে সাথে পাতার ছায়া বদলাচ্ছে, আর সবচেয়ে বড় কথা—ফসলগুলো ঘন লতাপাতার আড়ালে ঢাকা থাকে। এই জটিল প্রাকৃতিক পরিবেশকে কৃত্রিম বুদ্ধিমত্তার কাছে চেনা করাটা ছিল বিজ্ঞানীদের জন্য সবচেয়ে বড় চ্যালেঞ্জ। দীর্ঘ ৫ বছরের নিরলস গবেষণা, হাজার হাজার ছবির ডাটা দিয়ে এআই-কে প্রশিক্ষণ দেওয়া এবং যান্ত্রিক ত্রুটি সংশোধনের পর অবশেষে এসেছে বড় সাফল্য। বর্তমানে এই রোবটের নিখুঁতভাবে শসা চিনে তোলার ক্ষমতা ৭০ থেকে ৮০ শতাংশে গিয়ে পৌঁছেছে, যা একে বাণিজ্যিকভাবে ব্যবহারের উপযোগী করে তুলেছে।',
    'মানুষ বনাম রোবট: গতির চেয়ে সহনশীলতা যেখানে বড় জয়

অনেকেই প্রশ্ন করতে পারেন, ২০ সেকেন্ডে ১টি শসা তোলা তো মানুষের চেয়ে খুব বেশি দ্রুত নয়। একজন দক্ষ দিনমজুর তো এর চেয়েও দ্রুত গতিতে শসা তুলতে পারেন। কথাটি আংশিক সত্য। কিন্তু এখানেই লুকিয়ে আছে মূল তফাতটি। মানুষ হয়তো ১০ সেকেন্ডে একটি শসা তুলতে পারবে, কিন্তু গ্রীষ্মকালের তপ্ত গ্রিনহাউসে, যেখানে তাপমাত্রা ৩০ ডিগ্রি সেলসিয়াস ছাড়িয়ে যায় এবং আদ্রতা থাকে দমবন্ধ করা, সেখানে কোনো মানুষ একটানা দীর্ঘ সময় সেই গতি ধরে রাখতে পারে না।',
    'তাছাড়া, শসা তোলার জন্য প্রতিনিয়ত নিচু হওয়া এবং হাত উঁচিয়ে কাজ করার ফলে শারীরিক ক্লান্তি ও পিঠব্যথার মতো সমস্যা দেখা দেয়। মানুষকে বিশ্রাম নিতে হয়, খাবারের বিরতি দিতে হয়। অন্যদিকে, এই রোবটের কোনো ক্লান্তি নেই। এটি কোনো বিরতি ছাড়াই দিন-রাত ২৪ ঘণ্টা একই গতিতে কাজ করে যেতে পারে। রাতের বেলা যখন মানুষ ঘুমায়, তখন এটি গ্রিনহাউসের অন্ধকারেও ইনফ্রারেড ও সেন্সরের সাহায্যে নিখুঁতভাবে শসা তুলতে পারে। ফলে চাষির উৎপাদনশীলতা বেড়ে যায় বহুগুণ।',
    'তীব্র শ্রমিক সংকটের এক চমৎকার সমাধান

জাপানের কৃষি খাত বর্তমানে এক ভয়াবহ সংকটের মধ্য দিয়ে যাচ্ছে—সেটি হলো বার্ধক্য এবং তীব্র শ্রমিক ঘাটতি। তরুণেরা কৃষিকাজে আসতে চাচ্ছে না, ফলে মাঠের পর মাঠ ফসল তোলার মানুষ পাওয়া যাচ্ছে না। এই রোবট মূলত সেই অভাব পূরণ করতেই মাঠে নেমেছে। বিকাশকারীরা জানিয়েছেন, এই রোবটটি শুধু ফসল তোলার মধ্যেই সীমাবদ্ধ থাকবে না। ২০২৭ সালের বসন্ত নাগাদ জাপানের বিভিন্ন খামারে এটি বাণিজ্যিকভাবে ছড়িয়ে দেওয়ার পরিকল্পনা রয়েছে। সবচেয়ে দারুণ ব্যাপার হলো, রাতে এই রোবটটি অপ্রয়োজনীয় পাতা ছাঁটাই (Leaf scraping) করবে এবং দিনে ফসল তুলবে। অর্থাৎ, এটি একই সাথে খামারের প্রায় দুজন পূর্ণাঙ্গ শ্রমিকের কাজের বোঝা নিজের কাঁধে তুলে নিতে পারবে।',
    'রোবট কি তবে কৃষকের শত্রু?

নতুন কোনো প্রযুক্তি এলেই মানুষের মনে প্রথম যে ভয়টি কাজ করে, তা হলো—"এটি কি আমাদের কাজ কেড়ে নেবে?" কৃষি বিশেষজ্ঞদের মতে, এই রোবট কৃষকদের প্রতিস্থাপন করার জন্য নয়, বরং তাদের টিকিয়ে রাখার জন্য তৈরি। যে কাজগুলো অত্যন্ত কষ্টসাধ্য, একঘেয়ে এবং যার জন্য মানুষ পাওয়া যায় না, সেই কাজগুলো রোবট নিজের ওপর তুলে নিচ্ছে। এতে করে কৃষকেরা ভারী শারীরিক পরিশ্রম থেকে মুক্তি পাবেন এবং তারা খামারের ব্যবস্থাপনা, বিপণন ও ব্যবসার প্রসারে অনেক বেশি সময় দিতে পারবেন।',
    'কৃষি খাতের এই রোবটিক রূপান্তর আমাদের মনে করিয়ে দেয় যে, ভবিষ্যৎ আর দূরে নয়। কৃত্রিম বুদ্ধিমত্তা আর মেকাট্রনিক্স কীভাবে মানুষের জীবনকে সহজ করতে পারে, তার এক বাস্তব ও জীবন্ত উদাহরণ এই রোবট কৃষক। হয়তো আর কয়েক বছর পর, আমাদের দেশের ফসলের মাঠেও রাতের অন্ধকারে এভাবেই নিরলস কাজ করে যাবে কোনো এআই পাহারাদার!

আপনার কি মনে হয়, আমাদের দেশের মতো কৃষিপ্রধান দেশে এমন প্রযুক্তি কতটুকু কার্যকর হবে? কমেন্টে আপনার মূল্যবান ভাবনা আমাদের সাথে শেয়ার করুন।'
  ),
  jsonb_build_array(
    'প্রতি ৪০ মিনিটে ১২০টি শসা তোলার সক্ষমতা (প্রতিটি শসায় মাত্র ২০ সেকেন্ড)।',
    '৫ বছরের নিবিড় প্রশিক্ষণে এআই ভিশন নির্ভুলতা ১০% থেকে ৮০%-এ উন্নীত।',
    'দমবন্ধ ও উত্তপ্ত গ্রিনহাউসে দিন-রাত ২৪ ঘণ্টা একটানা ক্লান্তিহীন কাজের ক্ষমতা।',
    'রাতের অন্ধকারে ইনফ্রারেড সেন্সরে শসা সংগ্রহ এবং স্বয়ংক্রিয়ভাবে পাতা ছাঁটাই (Leaf scraping)।',
    'জাপানের তীব্র বার্ধক্য ও কৃষি শ্রমিক সংকট মোকাবিলায় খামারে দুজন শ্রমিকের সমপরিমাণ দায়িত্ব পালন।'
  ),
  jsonb_build_object(
    'journalOrInst', 'ইয়াসকাওয়া ইলেকট্রিক ও জাপান ন্যাশনাল ফেডারেশন অব এগ্রিকালচারাল কো-অপারেটিভস (জেএ জেন-নোহ)',
    'doiOrSource', 'Yume Farm JA Zen-Noh, Saga Prefecture, Japan',
    'keyMetric', '120 Cucumbers / 40 min (80% Precision Vision AI)'
  ),
  jsonb_build_object(
    'views', 1840,
    'likes', 0,
    'commentsCount', 0,
    'shares', 0
  ),
  '2026-11-01T18:50:00+06:00'
) on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  content = excluded.content,
  takeaways = excluded.takeaways,
  research_basis = excluded.research_basis,
  cover_image_url = excluded.cover_image_url,
  image_caption = excluded.image_caption,
  published_at = excluded.published_at;
`;
