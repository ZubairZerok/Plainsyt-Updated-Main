-- RLS regression tests. Run ONLY against a LOCAL/scratch database, never production:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Requires the migrations applied and the Supabase-style roles/auth schema (supabase start provides them).
\set A '11111111-1111-1111-1111-111111111111'
\set B '22222222-2222-2222-2222-222222222222'
\set E '33333333-3333-3333-3333-333333333333'

create temp table if not exists results(name text, pass boolean);
grant all on results to anon, authenticated;

create or replace function pg_temp.check(n text, ok boolean) returns void language sql as
$$ insert into results values (n, coalesce(ok, false)) $$;

-- fixtures (as superuser)
insert into auth.users(id,email) values (:'A','a@test.dev'),(:'B','b@test.dev'),(:'E','e@test.dev') on conflict do nothing;
insert into public.profiles(id,name,handle,email) values (:'A','A','user_a','a@test.dev'),(:'B','B','user_b','b@test.dev'),(:'E','E','user_e','e@test.dev') on conflict do nothing;
insert into public.app_admins(user_id, role) values (:'E','editor') on conflict (user_id) do update set role='editor';
delete from public.posts where id like 't-%'; delete from public.comments where id like 't-%';
delete from public.stories where id like 't-%'; delete from public.newsletter_subscribers where email = 'good@test.dev';
insert into public.posts(id,author_id,content) values ('t-post-b', :'B', 'B post');
insert into public.comments(id,target_type,target_id,author_id,author,text) values ('t-c-b','post','t-post-b', :'B','B','B comment');
delete from public.notifications; delete from public.follows; delete from public.reactions; delete from public.bookmarks;
insert into public.bookmarks(user_id,target_type,target_id) values (:'B','post','t-post-b');

-- ===== anonymous =====
set role anon;
select pg_temp.check('anon cannot read notifications', (select count(*) from public.notifications) = 0);
select pg_temp.check('anon cannot read newsletter', (select count(*) from public.newsletter_subscribers) = 0);
select pg_temp.check('anon cannot read bookmarks', (select count(*) from public.bookmarks) = 0);
do $$ begin perform email from public.profiles; perform pg_temp.check('anon cannot read profile e-mails', false);
  exception when insufficient_privilege then perform pg_temp.check('anon cannot read profile e-mails', true); end $$;
with u as (update public.comments set text='x' returning 1) select pg_temp.check('anon cannot update comments', (select count(*) from u) = 0);
with d as (delete from public.posts returning 1) select pg_temp.check('anon cannot delete posts', (select count(*) from d) = 0);
do $$ begin insert into public.comments(id,target_type,target_id,author_id,author,text) values ('t-anon','post','t-post-b',gen_random_uuid()::text,'x','x');
  perform pg_temp.check('anon cannot insert comments', false); exception when others then perform pg_temp.check('anon cannot insert comments', true); end $$;
do $$ begin insert into public.newsletter_subscribers(email) values ('good@test.dev'); perform pg_temp.check('anon can subscribe', true);
  exception when others then perform pg_temp.check('anon can subscribe', false); end $$;
do $$ begin insert into public.newsletter_subscribers(email) values ('not-an-email'); perform pg_temp.check('invalid e-mail rejected', false);
  exception when others then perform pg_temp.check('invalid e-mail rejected', true); end $$;
select public.increment_article_view('does-not-exist');
reset role;

-- ===== user A =====
set role authenticated; select set_config('request.jwt.claims', json_build_object('sub', :'A', 'role','authenticated')::text, false);
with u as (update public.comments set text='hacked' where id='t-c-b' returning 1) select pg_temp.check('A cannot edit B comment', (select count(*) from u) = 0);
with d as (delete from public.comments where id='t-c-b' returning 1) select pg_temp.check('A cannot delete B comment', (select count(*) from d) = 0);
with u as (update public.posts set content='hacked' where id='t-post-b' returning 1) select pg_temp.check('A cannot edit B post', (select count(*) from u) = 0);
do $$ begin insert into public.comments(id,target_type,target_id,author_id,author,text) values ('t-forged','post','t-post-b', '22222222-2222-2222-2222-222222222222','B','forged');
  perform pg_temp.check('A cannot comment as B', false); exception when others then perform pg_temp.check('A cannot comment as B', true); end $$;
insert into public.comments(id,target_type,target_id,author_id,author,avatar,text,likes,reaction_counts) values ('t-c-a','post','t-post-b', :'A','FAKE NAME','x','hello B',999,'{"like":999}');
select pg_temp.check('server forces author name + zero counters', (select author = (select name from public.profiles where id = :'A') and author <> 'FAKE NAME' and likes = 0 and reaction_counts = '{}'::jsonb from public.comments where id='t-c-a'));
insert into public.comments(id,target_type,target_id,author_id,author,text,parent_id) values ('t-reply','post','t-post-b', :'A','A','reply to B','t-c-b');
update public.comments set text='edited' where id='t-c-a';
select pg_temp.check('A can edit own comment', (select text = 'edited' from public.comments where id='t-c-a'));
with u as (update public.comments set reaction_counts='{"like":50}'::jsonb, likes=50 where id='t-c-a' returning 1) select pg_temp.check('A cannot forge comment counters', (select reaction_counts = '{}'::jsonb and likes = 0 from public.comments where id='t-c-a'));
update public.profiles set is_verified = true, followers_count = 99999, email='evil@x.dev', bio = 'my bio' where id = :'A';
select pg_temp.check('A cannot self-verify / fake followers', (select is_verified = false and followers_count = 0 and bio = 'my bio' from public.profiles where id = :'A'));
with u as (update public.profiles set bio='hacked' where id = '22222222-2222-2222-2222-222222222222' returning 1) select pg_temp.check('A cannot edit B profile', (select count(*) from u) = 0);
insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('whatever','post','t-post-b', :'A','x','like');
update public.reactions set type='insightful' where target_id='t-post-b' and user_id=:'A';
select pg_temp.check('A can switch own reaction', (select type = 'insightful' and id = 'rx-post-t-post-b-' || :'A' from public.reactions where target_id='t-post-b' and user_id = :'A'));
do $$ begin insert into public.reactions(id,target_type,target_id,user_id,user_name,type) values ('x','post','t-post-b','22222222-2222-2222-2222-222222222222','x','like');
  perform pg_temp.check('A cannot react as B', false); exception when others then perform pg_temp.check('A cannot react as B', true); end $$;
with u as (update public.posts set reaction_counts='{"like":77}'::jsonb where id='t-post-b' returning 1) select pg_temp.check('A cannot rewrite B post at all', (select count(*) from u) = 0);
insert into public.follows(follower_id, following_id) values (:'A', :'B');
do $$ begin insert into public.follows(follower_id, following_id) values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
  perform pg_temp.check('A cannot follow as B', false); exception when others then perform pg_temp.check('A cannot follow as B', true); end $$;
select pg_temp.check('A cannot read B bookmarks', (select count(*) from public.bookmarks) = 0);
select pg_temp.check('A cannot read B notifications', (select count(*) from public.notifications) = 0);
do $$ begin insert into public.notifications(id,recipient_id,type,entity_type,message) values ('forge','22222222-2222-2222-2222-222222222222','system','post','evil');
  perform pg_temp.check('A cannot forge notifications', false); exception when others then perform pg_temp.check('A cannot forge notifications', true); end $$;
do $$ begin insert into public.stories(id,title,category,image_url,author_id,author_name) values ('t-story','t','c','u','11111111-1111-1111-1111-111111111111','A');
  perform pg_temp.check('non-editor cannot publish story', false); exception when others then perform pg_temp.check('non-editor cannot publish story', true); end $$;
do $$ begin insert into public.posts(id,author_id,content,external_link) values ('t-xss', '11111111-1111-1111-1111-111111111111','x','javascript:alert(1)');
  perform pg_temp.check('javascript: link rejected', false); exception when check_violation then perform pg_temp.check('javascript: link rejected', true); end $$;
select pg_temp.check('non-editor cannot read newsletter list', (select count(*) from public.newsletter_subscribers) = 0);
select pg_temp.check('my_role is null for normal user', public.my_role() is null);
reset role;

-- ===== derived data written by triggers (superuser view) =====
select pg_temp.check('B notified of comment + reply + reaction + follow', (select count(*) from public.notifications where recipient_id = :'B') >= 4);
select pg_temp.check('no self-notification', (select count(*) from public.notifications where recipient_id = :'A') = 0);
select pg_temp.check('post comment count updated by trigger', (select (stats->>'commentsCount')::int = 3 from public.posts where id='t-post-b'));
select pg_temp.check('post reaction_counts updated by trigger', (select reaction_counts = '{"insightful":1}'::jsonb from public.posts where id='t-post-b'));
select pg_temp.check('follower counts updated by trigger', (select followers_count = 1 from public.profiles where id=:'B') and (select following_count = 1 from public.profiles where id=:'A'));

-- ===== editor E =====
set role authenticated; select set_config('request.jwt.claims', json_build_object('sub', :'E', 'role','authenticated')::text, false);
select pg_temp.check('my_role = editor', public.my_role() = 'editor');
select pg_temp.check('editor can read newsletter list', (select count(*) from public.newsletter_subscribers) >= 1);
insert into public.stories(id,title,category,image_url,author_id,author_name) values ('t-story-e','t','c','u', :'E','E');
select pg_temp.check('editor can publish story', exists (select 1 from public.stories where id='t-story-e'));
reset role;

-- ===== B deletes parent: replies + reactions cascade =====
set role authenticated; select set_config('request.jwt.claims', json_build_object('sub', :'B', 'role','authenticated')::text, false);
with d as (delete from public.comments where id='t-c-b' returning 1) select pg_temp.check('B can delete own comment', (select count(*) from d) = 1);
select pg_temp.check('replies cascade-deleted', not exists (select 1 from public.comments where id='t-reply'));
reset role;

\echo
select case when pass then 'PASS' else 'FAIL' end as result, name from results order by pass, name;
select 'TOTAL ' || count(*) || ', FAILED ' || count(*) filter (where not pass) as summary from results;
