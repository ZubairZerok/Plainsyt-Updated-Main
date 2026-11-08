-- Migration: Delete usr-zubair profile completely & insert YouTube Reel seed
-- Generated: 2026-11-08

-- Disable triggers temporarily so cascade recount triggers do not collide with row deletion (Error 27000 prevention)
set session_replication_role = 'replica';

-- 1. Purge usr-zubair and all associated records across the database
delete from public.bookmarks where user_id = 'usr-zubair';
delete from public.reactions where user_id = 'usr-zubair';
delete from public.comments where author_id = 'usr-zubair';
delete from public.posts where author_id = 'usr-zubair';
delete from public.articles where author_id = 'usr-zubair';
delete from public.follows where follower_id = 'usr-zubair' or following_id = 'usr-zubair';
delete from public.reels where creator_id = 'usr-zubair';
delete from public.stories where author_id = 'usr-zubair';
delete from public.notifications where recipient_id = 'usr-zubair' or actor_id = 'usr-zubair';
delete from public.profile_login_aliases where auth_user_id = 'usr-zubair';
delete from public.profiles where id = 'usr-zubair' or handle = 'zubair';

-- Re-enable normal triggers
set session_replication_role = 'origin';

-- 2. Ensure Flagship YouTube Reel exists in public.reels
insert into public.reels (
  id,
  title,
  creator_id,
  creator,
  creator_avatar,
  location,
  duration,
  views,
  gradient_theme,
  video_type,
  media_url,
  video_url,
  likes,
  reaction_counts,
  created_at
) values (
  'reel-japan-robot-night-2026',
  'রাত ২টায় ক্ষেতে কাজ করছে রোবট কৃষক! 🤖 Plainsyt',
  'usr-plainsyt-admin',
  'PLAiNSYT',
  '/logos/icon-192.png',
  'জাপান',
  '1:00',
  0,
  'from-emerald-900 to-lime-700',
  'greenhouse-iot',
  'https://i.ytimg.com/vi/BKUmGkQxAUU/hqdefault.jpg',
  'https://www.youtube.com/shorts/BKUmGkQxAUU',
  0,
  '{}'::jsonb,
  now()
) on conflict (id) do update set
  video_url = excluded.video_url,
  media_url = excluded.media_url,
  title = excluded.title;

