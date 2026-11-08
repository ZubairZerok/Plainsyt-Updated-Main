# Database (Supabase)

`migrations/` is the single source of truth. Apply them in filename order (`supabase db push`, or paste each
file into the SQL editor). The latest one, `20261108000000_security_lockdown.sql`, replaces **all** earlier
row-level-security policies; it is idempotent.

## Before deploying the matching web client
1. Back up the database (Dashboard → Database → Backups).
2. Apply `20261108000000_security_lockdown.sql`, then `20261109000000_notifications_v2.sql`
   (grouped/retractable notifications, reply + @mention + new-article alerts, realtime; idempotent).
3. Make sure your own account has a role (the migration carries over the previous e-mail based access once):
   ```sql
   insert into public.app_admins (user_id, role)
   select id, 'admin' from auth.users where email = 'YOUR-ADMIN-EMAIL'
   on conflict (user_id) do update set role = 'admin';
   ```
   Roles: `admin` (moderate, manage events) and `editor` (publish stories, see the newsletter list).
4. Dashboard settings (cannot be set from SQL): Authentication → URL configuration: Site URL = your domain,
   add `https://YOUR-DOMAIN/**` and `https://YOUR-DOMAIN/me/security` to redirect URLs; enable CAPTCHA for
   sign-ups; keep "Confirm email" on.

## Tests
`tests/rls_test.sql` runs ~40 security checks (anonymous attacks, impersonation, forged counters, privilege
escalation, notification forging, cascades). **Run it only on a local/scratch database, never production.**
`tests/notifications_test.sql` runs 22 notification behaviour checks (grouping, retraction, replies, mentions,
deep links, follower fan-out, tamper-proofing). CI does both automatically (see `.github/workflows/ci.yml`).

## Notes
* Counters (reactions, comments, followers, publications) and notifications are maintained by triggers; the
  client never writes them.
* Old tables for removed features (`orders`, `store_products`, `ideas`, `research_papers`,
  `profile_login_aliases`) are locked from clients but not dropped. Drop them yourself when you are sure.
* Uploaded images go to the public `media` Storage bucket (created by the migration), one folder per user.
