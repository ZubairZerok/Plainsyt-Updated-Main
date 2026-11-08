-- Notification v2 behaviour tests. Run ONLY against a LOCAL/scratch database, never production:
--   psql -v ON_ERROR_STOP=1 -tA -f supabase/tests/notifications_test.sql
\set O '44444444-4444-4444-4444-444444444444'
\set P '55555555-5555-5555-5555-555555555555'
\set Q '66666666-6666-6666-6666-666666666666'
\set R '77777777-7777-7777-7777-777777777777'

create temp table if not exists nresults(name text, pass boolean);
grant all on nresults to anon, authenticated;
create or replace function pg_temp.ok(n text, b boolean) returns void language sql as
$$ insert into nresults values (n, coalesce(b, false)) $$;

insert into auth.users(id,email) values (:'O','o@t.dev'),(:'P','p@t.dev'),(:'Q','q@t.dev'),(:'R','r@t.dev') on conflict do nothing;
insert into public.profiles(id,name,handle,email) values
  (:'O','Owner','n_owner','o@t.dev'),(:'P','Pia','n_pia','p@t.dev'),(:'Q','Qadir','n_qadir','q@t.dev'),(:'R','Rafi','n_rafi','r@t.dev')
  on conflict (id) do update set name = excluded.name;
delete from public.reactions where target_id like 'n-%'; delete from public.comments where id like 'n-%';
delete from public.posts where id like 'n-%';
delete from public.articles where id like 'n-%';
delete from public.notifications where recipient_id in (:'O',:'P',:'Q',:'R');
delete from public.follows where follower_id in (:'O',:'P',:'Q',:'R') or following_id in (:'O',:'P',:'Q',:'R');
insert into public.posts(id,author_id,content) values ('n-post', :'O', 'Owner post about rice');

-- helper: act as a user
create or replace function pg_temp.as_user(u text) returns void language sql as
$$ select set_config('request.jwt.claims', json_build_object('sub', u, 'role','authenticated')::text, false) $$;

set role authenticated;

-- ===== reactions fold into one row =====
select pg_temp.as_user(:'P');
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x1','post','n-post', :'P','x','like');
select pg_temp.as_user(:'Q');
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x2','post','n-post', :'Q','x','love');
select pg_temp.as_user(:'R');
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x3','post','n-post', :'R','x','like');
reset role;
select pg_temp.ok('3 reactions -> 1 grouped row', (select count(*) = 1 from public.notifications where recipient_id = :'O' and type = 'reaction'));
select pg_temp.ok('grouped row counts 3 actors', (select actor_count = 3 and cardinality(actor_ids) = 3 from public.notifications where recipient_id = :'O' and type = 'reaction'));
select pg_temp.ok('latest actor first, max 3 kept', (select actors->0->>'name' = 'Rafi' and jsonb_array_length(actors) = 3 from public.notifications where recipient_id = :'O' and type = 'reaction'));
select pg_temp.ok('grouped message says "ও আরও 2 জন"', (select message like 'Rafi ও আরও 2 জন আপনার পোস্টে প্রতিক্রিয়া%' from public.notifications where recipient_id = :'O' and type = 'reaction'));

-- ===== unlike retracts =====
set role authenticated; select pg_temp.as_user(:'R');
delete from public.reactions where target_id = 'n-post' and user_id = :'R';
reset role;
select pg_temp.ok('unlike removes the actor', (select actor_count = 2 and not (:'R' = any(actor_ids)) and actor_name = 'Qadir' from public.notifications where recipient_id = :'O' and type = 'reaction'));
set role authenticated; select pg_temp.as_user(:'R');
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x3b','post','n-post', :'R','x','like');
delete from public.reactions where target_id = 'n-post' and user_id = :'R';
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x3c','post','n-post', :'R','x','like');
reset role;
select pg_temp.ok('like/unlike spam never double-counts', (select actor_count = 3 and (select count(*) from public.notifications where recipient_id = :'O' and type='reaction') = 1 from public.notifications where recipient_id = :'O' and type = 'reaction'));

-- ===== read rows stay; new activity opens a new row =====
set role authenticated; select pg_temp.as_user(:'O');
update public.notifications set is_read = true where recipient_id = :'O';
do $$ begin update public.notifications set message = 'hacked' where recipient_id = '44444444-4444-4444-4444-444444444444';
  perform pg_temp.ok('recipient cannot rewrite message', false);
  exception when insufficient_privilege then perform pg_temp.ok('recipient cannot rewrite message', true); end $$;
reset role;
set role authenticated; select pg_temp.as_user(:'P');
delete from public.reactions where target_id = 'n-post' and user_id = :'P';
reset role;
select pg_temp.ok('unlike does not touch READ history', (select actor_count = 3 from public.notifications where recipient_id = :'O' and type = 'reaction' and is_read));
set role authenticated; select pg_temp.as_user(:'P');
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x1b','post','n-post', :'P','x','like');
reset role;
select pg_temp.ok('activity after read opens a fresh unread row', (select count(*) = 1 from public.notifications where recipient_id = :'O' and type = 'reaction' and not is_read and actor_count = 1));

-- ===== comments, replies, mentions, deep links =====
set role authenticated; select pg_temp.as_user(:'P');
insert into public.comments(id,target_type,target_id,author_id,author,text) values ('n-c1','post','n-post', :'P','Pia','first!');
select pg_temp.as_user(:'Q');
insert into public.comments(id,target_type,target_id,author_id,author,text,parent_id) values ('n-c2','post','n-post', :'Q','Qadir','@Pia agreed','n-c1');
select pg_temp.as_user(:'R');
insert into public.comments(id,target_type,target_id,author_id,author,text,parent_id) values ('n-c3','post','n-post', :'R','Rafi','@Qadir source please?','n-c1');
reset role;
select pg_temp.ok('owner told about comments (grouped)', (select actor_count = 3 from public.notifications where recipient_id = :'O' and type = 'comment' and not is_read));
select pg_temp.ok('comment links to the exact comment', (select target_url = '/post/n-post?c=n-c3' from public.notifications where recipient_id = :'O' and type = 'comment' and not is_read));
select pg_temp.ok('parent author gets grouped reply', (select actor_count = 2 and type = 'reply' from public.notifications where recipient_id = :'P' and type = 'reply'));
select pg_temp.ok('@mentioned replier gets mention', (select count(*) = 1 from public.notifications where recipient_id = :'Q' and type = 'mention' and source_id = 'n-c3'));
select pg_temp.ok('mention not duplicated for parent author', (select count(*) = 0 from public.notifications where recipient_id = :'P' and type = 'mention'));

-- deleting a reply retracts its reply + mention notifications
set role authenticated; select pg_temp.as_user(:'R');
delete from public.comments where id = 'n-c3';
reset role;
select pg_temp.ok('deleted reply: mention gone', (select count(*) = 0 from public.notifications where recipient_id = :'Q' and type = 'mention'));
select pg_temp.ok('deleted reply: reply group shrinks', (select actor_count = 1 from public.notifications where recipient_id = :'P' and type = 'reply'));
select pg_temp.ok('deleted reply: owner comment group shrinks', (select actor_count = 2 from public.notifications where recipient_id = :'O' and type = 'comment' and not is_read));

-- ===== follow / unfollow =====
set role authenticated; select pg_temp.as_user(:'P');
insert into public.follows(follower_id, following_id) values (:'P', :'O');
select pg_temp.as_user(:'Q');
insert into public.follows(follower_id, following_id) values (:'Q', :'O');
delete from public.follows where follower_id = :'Q' and following_id = :'O';
reset role;
select pg_temp.ok('follow grouped and unfollow retracts', (select actor_count = 1 and actor_id = :'P' from public.notifications where recipient_id = :'O' and type = 'follow'));

-- ===== new article fan-out to followers =====
insert into public.articles(id, title, category, author_id) values ('n-art', 'Saline-tolerant rice trial', 'শস্য ও কৃষিবিজ্ঞান', :'O');
select pg_temp.ok('follower told about new article', (select count(*) = 1 from public.notifications where recipient_id = :'P' and type = 'new_article' and target_url like '/article/%'));
select pg_temp.ok('non-follower not told', (select count(*) = 0 from public.notifications where recipient_id = :'R' and type = 'new_article'));

-- ===== deleting the post cleans up =====
delete from public.posts where id = 'n-post';
select pg_temp.ok('deleted post takes its notifications', (select count(*) = 0 from public.notifications where entity_type = 'post' and entity_id = 'n-post'));

-- ===== isolation =====
set role authenticated; select pg_temp.as_user(:'R');
select pg_temp.ok('users only see their own', (select count(*) = 0 from public.notifications where recipient_id <> :'R'));
reset role;

\echo
select case when pass then 'PASS' else 'FAIL' end as result, name from nresults order by pass, name;
select 'TOTAL ' || count(*) || ', FAILED ' || count(*) filter (where not pass) as summary from nresults;
