# PLAiNSYT — Full Codebase Audit & Stress Test (2026-11-08)

> **Audience:** a developer or AI agent who will fix these issues.
> **Scope:** every file in the repo at commit `b7bdc1c` (branch `claude/loving-clarke-kge5zv`): React app (`src/`), Supabase SQL (`supabase/`), build/deploy config, scripts, public assets.
> **Status:** findings only. Nothing in the app was changed by this audit.
> **Supersedes:** `audit-reports/AllTogether.md`. That report is **wrong in several places** (see §9). Do not trust it.

> ## STATUS UPDATE (same day): fixes implemented
> The issues below were fixed in the follow-up commits on branch `claude/loving-clarke-kge5zv`. Items that **cannot** be done from code are listed here and still need the site owner:
>
> | Still needs the owner | Why |
> |---|---|
> | Revoke the leaked OpenRouter key | Only the key owner can; removal from git does not un-leak it |
> | Apply `supabase/migrations/20261108000000_security_lockdown.sql` to the live database (after a backup) and grant your admin role | I have no access to the production database |
> | Supabase dashboard: redirect URLs, CAPTCHA, confirm-email | Dashboard-only settings (`supabase/README.md`) |
> | Re-upload the founder avatar | The old Facebook-hosted URL is stored in profile *data*, and expires 2026-11-11 |
> | Check Cloudflare deploy | Needs Cloudflare access (`docs/DEPLOYMENT.md`) |
> | Review YouTube player branding (COMP-01) | Product/legal decision; only the postMessage origin was fixed |
>
> Verified locally: type-check 0 errors (was 104), lint 0 errors, 16 unit tests, 39 database security tests (fresh DB from migrations), 40 browser checks (every route, CSP applied). Not verified: production database and Cloudflare.

---

## 0. How to use this report (read first)

1. Work **in the order of §2 (Fix Order)**. Security first, then crashes, then data correctness, then the rest.
2. Each issue has an ID (`SEC-01`, `BUG-03`, …). Each one lists **Where → Evidence → Impact → Fix → Done when**.
3. Line numbers refer to commit `b7bdc1c`. If they drift, search for the quoted code.
4. **Never test database policies against the production Supabase project.** Use a local stack (`supabase start`) or a staging project. The production project is the one in `src/app/lib/supabase.ts`.
5. After each phase, run the checks in §8 ("Verification gates").

### Severity scale

| Level | Meaning |
|---|---|
| **CRITICAL** | Exploitable now by anyone on the internet, or leaks secrets/personal data. Fix today. |
| **HIGH** | Crashes a page, silently loses user data, or breaks a core feature. |
| **MEDIUM** | Wrong behavior, security weakness with limited reach, scaling problem, compliance risk. |
| **LOW** | Code quality, performance polish, dead code, developer experience. |

---

## 1. Executive summary

| Severity | Count |
|---|---|
| CRITICAL | 7 |
| HIGH | 27 |
| MEDIUM | 28 |
| LOW | 17 |
| **Total** | **79** |

> Sections are grouped by theme; each heading's `[SEVERITY]` tag and the index in §15 are authoritative.

**The five things that matter most:**

1. **The database is open to anonymous writes.** Migrations from 2026-11-06/07 replaced the owner-only rules with `using (true)` / `with check (true)`. Anyone holding the public key (it ships in the JS bundle) can **edit or delete every comment, rewrite any post, forge reactions, and read every user's notifications and bookmarks** — without logging in. (`SEC-02`)
2. **Personal data is publicly readable.** The full newsletter subscriber list and every user's email address (`profiles.email`) can be downloaded by anyone. (`SEC-03`)
3. **A live OpenRouter API key is committed** in `.env`, and `.env` is not git-ignored. Revoke it. (`SEC-01`)
4. **Three routes crash the whole page**: `/post/:id`, `/reel/:id`, and the share button on `/events/:id`. Comment notifications link to `/post/:id`, so clicking them crashes. The build still passes because there is no type-check. (`BUG-01..04`, `DX-01`)
5. **Data silently disappears or comes back.** Every database write swallows its error, identity comes from `localStorage` rather than the real session, the local cache is union-merged with the server (deleted things come back), and threaded replies are posted as top-level comments almost everywhere. (`DATA-*`)

---

## 2. Fix order (do it in this sequence)

| Phase | Goal | Issues |
|---|---|---|
| **P0 — today** | Stop the bleeding | `SEC-01` (revoke key), `SEC-02`, `SEC-03`, `SEC-04`, `SEC-05` (ship one migration, §10 has the SQL), `SEC-07` |
| **P1 — crashes** | No page can crash | `DX-01` (add type-check so these can't return), `BUG-01..05` |
| **P2 — data integrity** | What the user sees = what the DB has | `DATA-01..14`, `SEC-06` |
| **P3 — broken features** | Features do what their UI claims | `FEAT-01..08` |
| **P4 — security hardening** | Defense in depth | `SEC-08..14` |
| **P5 — scale & performance** | Survive real traffic | `PERF-01..09` |
| **P6 — SEO / PWA / a11y / compliance** | Polish | `SEO-*`, `PWA-*`, `A11Y-*`, `COMP-*` |
| **P7 — cleanup** | Maintainability | `DX-02..`, `CLEAN-*` |

---

## 3. How the audit was done (stress-test log)

| Step | Command / method | Result |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | OK (warns: ignored build scripts for esbuild, @tailwindcss/oxide, workerd) |
| Type-check | No `tsconfig.json` exists. Ran `tsc --noEmit --strict` from a scratch config over `src/` | **104 errors**, incl. 22 "Cannot find name" (runtime crash candidates) |
| Build | `vite build` | **Passes** (Vite does not type-check — that is why crashes ship) |
| Bundle inspection | grep over `dist/assets/*.js` | OpenRouter key **not** in bundle (unused in code). Hard-coded personal emails/UUIDs **are** in bundle. |
| Route crash test | Headless Chromium on `vite preview`, **all Supabase/external traffic blocked** (prod DB never touched), console + page errors captured | `/post/:id` → `ReferenceError: CommunityPostCard is not defined` (full-page error screen). `/reel/:id` → `ReferenceError: setPlayerStart is not defined` (full-page error screen). `/editorial` "go home" click → `TypeError: s is not a function`. `/events/:id` share → `ReferenceError: toast is not defined`. Other routes OK. |
| Stored link test | Seeded a post with `externalLink: "javascript:…"` into the local cache | Rendered as a live `<a href="javascript:…">`. Execution blocked in Chromium only because of `target="_blank" rel="noopener"`. |
| Storage stress | Wrote a 6 MB snapshot to the app's `localStorage` key | `QuotaExceededError` — the app's `writeSnapshot` swallows this silently. |
| Page weight (mobile 390×844, fonts/CDN blocked) | Playwright response sizes | **~3.0 MB** first load from own origin: 1.1 MB JPEG, 472 KB main JS, 364 KB `icon.png`, 352 KB `English.png`, 308 KB React chunk, 221 KB Supabase chunk, 215 KB CSS. |
| History test | `history.length` right after first load | `2` — a fake history entry is pushed on load (`UX-01`). |
| Repo test scripts | `node scripts/stress_concurrency_test.mjs`, `node scripts/test_full_suite.mjs` | All "pass", but they **re-implement logic inline or grep source text**; they do not test the real code (`DX-03`). |
| SQL review | All of `supabase/schema.sql`, 6 migrations, `src/app/lib/schemaSqlRaw.ts` | Policies are permissive (Postgres ORs all permissive policies, so the later `true` policies override the earlier strict ones). |

---

## 4. CRITICAL — security & privacy

### SEC-01 · Live OpenRouter API key committed; `.env` not ignored
- **Where:** `.env` (tracked by git), `.gitignore` lines 18–21 (the `.env` rules are commented out).
- **Evidence:** `git ls-files .env` → tracked. Contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENROUTER_API_KEY` (73-char `sk-or-v1-…` value). The key is not referenced anywhere in `src/`, so it is not in the bundle today — but it is in git history, and the `VITE_` prefix means it would be shipped to every browser the moment code reads it.
- **Impact:** Anyone with repo access (or a leaked clone) can spend on the OpenRouter account.
- **Fix:**
  1. **Revoke/rotate the key in the OpenRouter dashboard first.** Removing it from git does not un-leak it.
  2. `git rm --cached .env`; un-comment the env rules in `.gitignore` (`.env`, `.env.local`, `.env.*.local`).
  3. Add `.env.example` with empty values and a comment per variable.
  4. Never put secret keys behind `VITE_` (Vite inlines every `VITE_*` value into the public bundle). If an AI feature is added, call OpenRouter from a server (Supabase Edge Function or Cloudflare Worker) that reads the key from server-side secrets.
  5. Optional: purge history with `git filter-repo --path .env --invert-paths` (requires a coordinated force-push; only after rotation).
- **Done when:** `git ls-files .env` is empty; old key returns 401; `grep -r "sk-or-" .` finds nothing.

### SEC-02 · Row-Level Security opened to anonymous writes on comments, posts, reactions, notifications, bookmarks
- **Where:**
  - `supabase/migrations/20261106_reactions_and_replies_hardening.sql` lines 19–22 (`reactions_write_auth` for all, any signed-in user can update/delete anyone's reaction).
  - `supabase/migrations/20261107_ultra_fix_comments_replies_notifications.sql` lines 17–83: `comments_insert_all/modify_all/delete_all`, `posts_insert_all/modify_all`, `notifications_select_public/insert_all/modify_all`, `reactions_insert_all/modify_all/delete_all` — **all `using (true)` / `with check (true)`**.
  - `supabase/migrations/20261107_ultra_preserve_persistence.sql` lines 18–52: same for `bookmarks` (select/insert/delete all), `comments`, `reactions`.
- **Evidence:** Postgres combines permissive policies with OR, so the older owner-only policies from `20261101` no longer protect anything. These policies apply to the `anon` role too (no `to authenticated` clause).
- **Impact (no login needed, using the public key from the bundle):**
  - Delete or rewrite **every comment** on the site.
  - Rewrite **any post** (content, images, links, author name/avatar in `author_json`).
  - Insert posts/comments **as any user** (any `author_id`).
  - Read **every user's notifications** and **bookmarks**; mark them read; spam notifications with arbitrary text/links.
  - Inflate/delete reactions for anyone.
- **Fix:** Ship one new migration (full SQL in **§10**) that:
  1. Drops **every** policy on these tables (loop over `pg_policies`; don't rely on names — names already drifted, e.g. `notifications_select_recipient` vs `notifications_select_recipient_or_admin`).
  2. Recreates owner-scoped policies **`to authenticated`**, always comparing `author_id/user_id/recipient_id/follower_id = (select auth.uid())::text`.
  3. Adds an `update` policy for own reactions (needed so changing like→idea works; see `DATA-09`).
  4. Removes client `insert/update` on `notifications` entirely; create notifications with database triggers (`FEAT-07`).
  5. Bookmarks: select/insert/delete only own rows.
- **Done when:** On a local Supabase with the anon key: `update comments set text='x'` affects 0 rows; `select * from notifications` returns 0 rows; as user A, deleting user B's comment affects 0 rows. Add these as automated RLS tests (§8).

### SEC-03 · Newsletter list and all user emails are publicly readable
- **Where:**
  - `supabase/migrations/20261107_newsletter_and_editorial.sql` lines 16–18: `newsletter_select_editorial … for select using (true)` (the name says "editorial", the rule says "everyone").
  - `supabase/schema.sql` line 24 (`profiles.email`) + line 317 `profiles_select_public using (true)`; client does `select('*')` on profiles in `src/app/lib/db.ts:733`.
  - `src/app/components/AuthModal.tsx:135-146` queries `profiles` by email (relies on email being public).
- **Impact:** Anyone can download every subscriber email and every registered user's email. Personal-data breach (and a spam list).
- **Fix:**
  1. Newsletter: drop the select policy; add `for select to authenticated using (public.is_editor())`. Insert stays public but add a unique index on `lower(email)` and rate-limit (see `SEC-12`).
  2. Profiles: move `email` out of the public table. Either (a) new table `profile_private(id text primary key references profiles(id) on delete cascade, email text)` with owner/admin-only select, or (b) column privileges: `revoke select on public.profiles from anon, authenticated; grant select (id,name,name_bn,handle,role,organization,location,bio,avatar,cover_gradient,is_verified,focus_area,website,publications_count,followers_count,following_count,created_at) on public.profiles to anon, authenticated;` — then change every client `select('*')` on profiles to an explicit column list.
  3. Remove the email lookup in `AuthModal` (see `SEC-09`).
- **Done when:** anon `select email from newsletter_subscribers` and anon `select email from profiles` both fail/return nothing.

### SEC-04 · Anyone can publish as anyone (author impersonation)
- **Where:** `supabase/schema.sql` / `20261101`: `articles_insert_author` (line 339–340), `comments_insert_auth` (371–372), `ideas_insert_author` (444), `posts_insert_author` (358–359) all use `with check (auth.uid() is not null or public.is_admin())` — they never check `author_id`. Plus `posts_insert_all with check (true)` from `20261107_ultra_fix`.
- **Impact:** Any account can insert an article with `author_id = 'usr-plainsyt-admin'` and `author_json` of the newsroom, i.e. publish fake news as PLAiNSYT. Same for comments/posts as any user.
- **Fix:** `with check (author_id = (select auth.uid())::text)` on every insert. Additionally, a `BEFORE INSERT` trigger should **overwrite** denormalized display fields (`author_json`, `comments.author`, `comments.avatar`, `reactions.user_name/avatar`) from `profiles` so clients can't fake names/avatars. Article insert should additionally require `public.is_editor()` if only editors may publish (the UI implies that).
- **Done when:** inserting with a foreign `author_id` fails; display fields always match `profiles`.

### SEC-05 · Users can verify themselves / make themselves "Admin"
- **Where:** `profiles_update_owner` (schema.sql:323, migration 20261105:42–48) lets the owner update **every column**. Client sends `is_verified`, `role`, counts via `toProfileRow` (`db.ts:353-372`) from `ProfileSettingsModal` (free-text `role` field, line 347).
- **Impact:** Any user can set `is_verified = true`, `role = 'Admin'`, `followers_count = 999999`. The UI shows verified badges and trusts `role` text.
- **Fix:** `BEFORE UPDATE` trigger on `profiles` that, unless `public.is_admin()`, forces `new.is_verified := old.is_verified`, `new.email := old.email`, `new.id := old.id`, `new.created_at := old.created_at`, and all `*_count` columns to old values. Rename the free-text field to `designation` (display only) and keep authority in `app_admins` (`SEC-06`). Counts should be maintained by triggers (`DATA-10`).
- **Done when:** as a normal user, `update profiles set is_verified=true where id=auth.uid()::text` leaves it `false`.

### SEC-06 · Admin/editor identity is hard-coded emails; editorial access is client-side only
- **Where:** `schema.sql:283-294` `is_admin()` = JWT email in a hard-coded list; `src/app/lib/auth.ts:4-147` (`ADMIN_ALIASES`, `ZUBAIR_ALIASES`, `AUTHORIZED_EDITORIAL_EMAILS`, `isEditorialAuthorized`, `isFollowableAccount`, `canCreateStory`); `RootShell.tsx` uses these to gate UI only.
- **Impact:** (1) Authorization lives in the browser, and the browser's "current user" comes from `localStorage` (`DATA-02`), so editors-only UI is trivially unlocked. (2) `is_admin()` trusts the `email` claim without checking verification; whoever controls a listed address is admin. (3) Changing the editor list needs a code deploy.
- **Fix:** Create `public.app_admins(user_id uuid primary key references auth.users on delete cascade, role text check (role in ('admin','editor')))` with RLS on and **no client policies**. `is_admin()` / `is_editor()` = `exists(select 1 from app_admins where user_id = auth.uid() and …)`. Expose the role to the client via a `security definer` RPC `my_role()`; UI reads that. Delete all email/alias lists from `auth.ts`.
- **Done when:** no email addresses remain in `src/` or SQL policies; editor-only actions fail server-side for non-editors.

### SEC-07 · Orders table: anonymous inserts allowed (dead feature, live attack surface)
- **Where:** `schema.sql:430-431` `orders_insert_checkout with check (true)`; client code still upserts orders (`db.ts:592-617`, `1458-1485`). The store UI is gone (`Views.tsx:509 StoreView` is a stub).
- **Impact:** Anyone can write unlimited rows (with `buyer_phone`, `trx_id`, `status`) into `orders` — spam, fake "paid" records, storage abuse.
- **Fix:** If the store is gone: drop the insert policy (or drop `orders`, `store_products`, `ideas`, `research_papers` tables after a backup) and delete all client code paths for them (`CLEAN-02`). If it comes back: insert must be `to authenticated with check (buyer_id = auth.uid()::text)`, `status` forced to `'pending'` by trigger, totals recomputed server-side from `store_products`.
- **Done when:** anon insert into `orders` fails.

---

## 5. HIGH — crashes (verified in a real browser)

> Root cause for all of these: no type-checking or linting (`DX-01`, `DX-02`). Fix those first so the class of bug can't come back.

### BUG-01 · `/post/:postId` crashes the whole page
- **Where:** `src/app/components/RootShell.tsx:1949` renders `<CommunityPostCard …>` but the file never imports it (imports at lines 1–55).
- **Evidence:** Browser: `ReferenceError: CommunityPostCard is not defined`; page replaced by the generic error screen. Comment notifications link here (`RootShell.tsx:931`, `958`).
- **Fix:** `import { CommunityPostCard } from './CommunityPostCard';`
- **Done when:** `/post/<existing id>` renders the post; Playwright test covers it.

### BUG-02 · `/reel/:id` and `/reels/:id` crash the whole page
- **Where:** `RootShell.tsx:659-669` calls `setPlayerStart(rIdx)` and `setPlayerOpen(true)` — neither exists. State is `player` / `setPlayer` (line 90).
- **Fix:** `setPlayer({ items: reelPlayerItems, start: rIdx })` (move the effect below the `reelPlayerItems` memo, line 1539, and add it to deps). Also: when the reel id isn't found, show a "not found" state instead of the feed.
- **Done when:** `/reel/reel-japan-robot-night-2026` opens the player.

### BUG-03 · Event page "Share" throws
- **Where:** `src/app/components/EventDetailPage.tsx:69` uses `toast` without importing it.
- **Fix:** `import { toast } from 'sonner';`. Also handle `navigator.clipboard.writeText` rejection (it rejects on HTTP or without permission) with `.catch`.

### BUG-04 · Editorial dashboard's only button crashes for non-editors
- **Where:** `EditorialDashboard.tsx:29` requires prop `onNavigate`; `RootShell.tsx:1995-1999` passes `onOpenArticle` (not a declared prop) and no `onNavigate`.
- **Evidence:** Browser: clicking "হোমপেজে ফিরে যান" → `TypeError: s is not a function`.
- **Fix:** pass `onNavigate={goNavigate}`; remove `onOpenArticle` or add it to `Props`.

### BUG-05 · [LOW] Latent crashes behind unreachable code
- **Where:** `RootShell.tsx:2124` `setAiOpen`, `2132` `setSupaConsoleOpen` (undefined); `1802` `StorePageSkeleton`, `1804` `IdeasPageSkeleton` (not imported, unreachable view names); `ResearcherViews.tsx:40-42,94,138,271,299,328` `PublicationsStudioView` uses undefined `articles`, `currentUser`, `onOpenWriteArticle`, `onOpenArticlePopup`.
- **Impact:** Not reachable today (no button calls them), but the next UI change makes them crash.
- **Fix:** Delete the dead branches and props (`onAskAI`, `onOpenSupabaseConsole`, `'store'|'ideas'|'publications'` cases, `PublicationsStudioView`). See `CLEAN-01`.

---

## 6. HIGH — data integrity (users lose data or see wrong data)

### DATA-01 · Every database write silently ignores failures
- **Where:** all `db*` helpers in `src/app/lib/db.ts` (1249–1779) wrap calls in `try { await supabase… } catch {}`. `supabase-js` v2 **does not throw** on HTTP/RLS errors — it returns `{ error }`. So the catch never runs and `error` is never read (except a few places). `RootShell` shows success toasts regardless (e.g. 1030, 1109, 1432, 1462).
- **Impact:** When a write is rejected (expired session, RLS, constraint, network), the UI shows success, the local cache keeps the item, and it never reaches the server. Other users never see it.
- **Fix:** Make every helper return `{ ok: boolean; error?: string }` and **check `error`**. In callers: optimistic update → await → on failure **roll back** the local change and `toast.error(...)`. Consider TanStack Query mutations (`onMutate`/`onError` rollback). Delete the "local-first fallback" comments; there is no offline queue.
- **Done when:** with the network blocked, posting a comment shows an error and the comment is not kept.

### DATA-02 · "Who is logged in" comes from `localStorage`, not the Supabase session
- **Where:** `auth.ts:149-209` (`plainsyt_auth_session_v1`), `RootShell.tsx:323-331` (`currentUser` from `snap.currentUserId || getStoredAuthUser()`), `db.ts:741-751` (fetch uses the stored id for notifications/bookmarks).
- **Impact:** When the Supabase session expires or is revoked, the UI still says "logged in", and every write fails silently (`DATA-01`). The stored profile can also be edited by hand, which unlocks client-gated UI (`SEC-06`).
- **Fix:** Single source of truth: `supabase.auth.getSession()` + `onAuthStateChange`. Keep `currentUser` in a React context populated from `profiles` for `session.user.id`. Delete `setStoredAuth/getStoredAuth` and the `currentUserId` field in the snapshot. On `SIGNED_OUT` / `TOKEN_REFRESH_FAILED`, clear user state.

### DATA-03 · Local cache is union-merged with the server — deleted things come back, remote deletes never apply
- **Where:** `db.ts:819-874` (reactions, comments, bookmarks merged local ∪ remote), `1029-1039` (local-only articles kept), `1066` (`posts.length > 0 ? posts : local.posts`), `1103-1115` (stories), `1122-1128` (follows), `1148-1152` (local profiles override remote).
- **Impact:** A comment/reaction/bookmark deleted on another device or by a moderator stays forever on this device. An un-follow elsewhere never applies. If the server returns 0 posts (e.g. a failed query), the stale local list is shown as truth. Profile edits made elsewhere are overwritten by stale local copies.
- **Fix:** Server wins. Cache the last server response for fast first paint only (or use TanStack Query persistence). If offline writes are desired, keep an explicit **pending operations queue** (`{op, payload, createdAt}`) that is replayed and then cleared — never merge whole collections.

### DATA-04 · Commenting re-uploads the entire post/article row (overwrites content, resurrects deleted posts)
- **Where:** `RootShell.tsx:831-832` (`dbUpsertArticle(updatedArticle)` after a comment), `914-915` (`dbUpsertPost(updatedPost)`), `1349` (`dbUpsertArticle(target)` on every article open), `1461`.
- **Impact:** Because `posts` update is open (`SEC-02`), any commenter writes **their stale local copy** of the whole post back (content, `reaction_counts`, `stats`) — last writer wins. `upsert` also **re-inserts a post the author already deleted**. For articles the non-author write is rejected (silently).
- **Fix:** A comment insert must write only to `comments`. Never upsert a parent row from a child action. Comment counts come from a trigger/aggregate (`DATA-10`).

### DATA-05 · Side effects depend on code running inside a React state updater
- **Where:** `RootShell.tsx:716-723` (`let result = null; commit(prev => { result = … }); if (result) dbSetReaction(…)`), same pattern at `818-832`, `901-915`, `1340-1349`.
- **Impact:** React may run the updater later (during the next render) when other updates are queued; then `result`/`updatedArticle`/`target` is still `null`, and the DB write and notification are **skipped**. Intermittent, hard-to-reproduce lost reactions/comments. React StrictMode would also run it twice.
- **Fix:** Compute the next state outside the updater from `snapRef.current`, then call `setSnap(next)` and do the side effect with the computed values. Updaters must be pure.

### DATA-06 · Threaded replies are posted as top-level comments almost everywhere
- **Where:** The comment UIs call `onComment(text, parentId, replyToAuthor)` (`ArticleReaderModal.tsx:539`, `ArticleCard.tsx:371`, `CommunityPostCard.tsx:450`), but the wiring drops the extra args:
  - `CentralFeed.tsx:35` type `(id, text) => void`; `:75` `onComment={(t) => f.onCommentArticle(a.id, t)}`; `:101` same for posts.
  - `Views.tsx:780`, `:1116`, `:1156` (profile page).
  - `RootShell.tsx:1880` (standalone article), `:2303` (article modal).
- **Impact:** Replies become new top-level comments on the home feed, profile page, article modal and article page. The only place replies work is `/post/:id`, which crashes (`BUG-01`). Reply notifications never fire.
- **Fix:** Change the callback types to `(id: string, text: string, parentId?: string, replyToAuthor?: string) => void` end-to-end and forward all args (`(t, pid, rta) => f.onCommentArticle(a.id, t, pid, rta)`). Persist `reply_to_author` (new column) or derive it from the parent.
- **Done when:** a reply made from the home feed appears nested after reload.

### DATA-07 · Deleting a comment leaves its replies in the database
- **Where:** `RootShell.tsx:1078-1079` removes replies locally (`c.parentId !== commentId`), but `db.ts:1328-1334` deletes only the parent row. No FK on `comments.parent_id`.
- **Impact:** Orphan replies reappear after reload (and are counted).
- **Fix:** `alter table comments add constraint comments_parent_fk foreign key (parent_id) references comments(id) on delete cascade;` (clean existing orphans first). Also delete `reactions` where `target_type='comment'` for deleted comments (trigger).

### DATA-08 · Comment reaction counts are double-counted and grow on every refresh
- **Where:** `db.ts:851-864`: starts from the stored `c.reactionCounts` (which already includes the reaction — written by `dbSetReaction` at 1385-1389) and then **adds** 1 per reaction row again. The result is written back to the cache (1237) and, on the next toggle, to the DB.
- **Evidence:** Simulated: one like → displayed 2, then 3, 4… for cached/local comments; remote comments show 2× on every load.
- **Fix:** Never store derived counts on the client. Counts = aggregate of `reactions` (DB trigger or view, `DATA-10`). On the client, display the server value as-is.

### DATA-09 · Reaction writes don't work correctly once RLS is fixed, and counts are written by the client
- **Where:** `db.ts:1336-1394` `dbSetReaction`: upsert on `(target_type,target_id,user_id)` needs an **UPDATE** policy (absent in the strict schema), and it then writes `reaction_counts` on the parent `articles/posts/reels/comments` row — allowed only for the author under strict RLS.
- **Impact:** After `SEC-02` is fixed: switching like→idea fails; counts on others' content never update (they are partly recomputed from at most 500 reactions on read, `PERF-03`). Today (open RLS) it works but races: two users reacting at once overwrite each other's counts (lost update).
- **Fix:** Client only inserts/updates/deletes **its own** reaction row. A trigger `after insert or update or delete on reactions` recomputes `reaction_counts` on the target row (`SQL in §10`). Remove all `reaction_counts`/`likes` writes from the client.

### DATA-10 · Counters (likes, comments, followers, publications, views) are computed in the browser
- **Where:** `db.ts:419-462`, `480-522`, `1041-1097` (likes/comment counts from capped lists), `1130-1203` (followers from the whole `follows` table), `RootShell.tsx:1492-1502` (follower +/-1 locally), `1337-1349` (views +1 by rewriting the article).
- **Impact:** Numbers are wrong as soon as data exceeds the fetch caps; views never persist for non-authors (RLS denies) and, for authors, overwrite the article with stale data.
- **Fix:** Triggers maintain `reaction_counts`, `comments_count`, `followers_count`, `following_count`, `publications_count`. Views via RPC `increment_article_view(p_id text)` (`security definer`, increments `stats.views`; optionally dedupe per session). Client only reads.

### DATA-11 · Silent loss when the browser cache is full
- **Where:** `db.ts:342-350` `writeSnapshot` swallows `QuotaExceededError`. Uploaded images/videos are stored as base64 inside the snapshot (`FacebookCreatePostModal.tsx:35-42`, `CreatePostModal.tsx:50-52`, `ProfileSettingsModal.tsx:85-94`).
- **Evidence:** 6 MB write → `QuotaExceededError` (limit ≈5 MB).
- **Impact:** After one or two media posts, nothing is cached any more, with no message.
- **Fix:** Upload media to Supabase Storage (`FEAT-08`), store only URLs; cap cache size; surface errors.

### DATA-12 · Auto "seed sync" uploads a browser's whole cache to the database
- **Where:** `db.ts:1010-1018` → `syncLocalToSupabase` (525-723) upserts profiles, articles, posts, comments, reactions, orders, events, reels, stories, papers, ideas, notifications from `localStorage` whenever remote profiles and articles come back empty.
- **Impact:** A transient empty response (or a fresh project) makes any visitor's stale or hand-edited cache become production data, including other users' notifications and orders.
- **Fix:** Delete `syncLocalToSupabase` and the auto-sync branch. Seed data belongs in `supabase/seed.sql` run by an admin.

### DATA-13 · Event registrations are thrown away
- **Where:** `EventRegistrationModal.tsx:41-48` collects name, phone, email, organization; `RootShell.tsx:2374-2382` stores only the event id in local state. Nothing writes `event_registrations` (no code references the table outside `schemaSqlRaw.ts`).
- **Impact:** Users believe they registered; organizers never receive anything.
- **Fix:** Insert into `event_registrations` (add columns `name, phone, email, organization`; RLS: own rows + organizer/admin read). Show errors. Load `isRegistered` from the table.

### DATA-14 · [MEDIUM] Saved reels/stories are not saved
- **Where:** `RootShell.tsx:95` `savedReelIds` is plain React state (lost on reload); `2321-2324` passes `savedStoryIds={snap.savedPostIds}` but `onSave` toggles `savedReelIds`, so the button never shows "saved"; `handleBookmarkStoryOrReel` (1220-1228) does nothing for logged-in users.
- **Fix:** Use `bookmarks` with `target_type='reel'` (already allowed by the CHECK) for reels and stories; read the same list you write.

---

## 7. HIGH — broken features & auth flows

### FEAT-01 · "Forgot password" is fake
- **Where:** `AuthModal.tsx:166-173` only sets `forgotSent = true`.
- **Fix:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`, add a `/reset-password` route that calls `supabase.auth.updateUser({ password })` after the `PASSWORD_RECOVERY` event. Always show the same neutral message (no enumeration).

### FEAT-02 · Sign-up treats unconfirmed users as logged in and writes a profile without a session
- **Where:** `auth.ts:294-364`: after `signUp`, stores the user as logged in and upserts `profiles`. With "Confirm email" enabled, `data.session` is `null`, so the upsert is rejected by RLS (silently) and the user appears logged in but isn't. Falls back to a fake id `u-${Date.now()}` (316).
- **Fix:** If `data.session` is null → show "check your email" and do not set any user state. Let the `handle_new_user` trigger create the profile; never upsert profiles from the client at sign-up.

### FEAT-03 · `handle_new_user` trigger can block sign-ups
- **Where:** `20261105_google_oauth_auto_profile_trigger.sql:78-115`: `handle = emailprefix_<4 hex>` with only `on conflict (id)`. `handle` is UNIQUE, so a collision raises and **Supabase rejects the whole sign-up** ("Database error saving new user"). Also `lower(regexp_replace(... '[^a-z0-9_]' ...))` replaces uppercase letters **before** lowercasing (`John` → `_ohn`).
- **Fix:** Lowercase first, then sanitize; generate handle with a loop/suffix until free, or use 8+ chars of the id; wrap in `begin … exception when unique_violation then …`.

### FEAT-04 · [MEDIUM] OAuth callback handled twice, with a wrong token fallback
- **Where:** `RootShell.tsx:244-282`: manually reads `access_token`/`code` from the URL and calls `setSession({ access_token, refresh_token: refreshToken || accessToken })` or `exchangeCodeForSession(code)`, while the client is configured with `detectSessionInUrl: true` (`supabase.ts:27`) which already does this.
- **Impact:** Race: the code is exchanged twice (second fails), and using the access token as a refresh token is invalid.
- **Fix:** Delete lines 244–282; rely on `detectSessionInUrl` + `onAuthStateChange`; set `auth.flowType: 'pkce'`.

### FEAT-05 · [MEDIUM] Follow notifications are never delivered
- **Where:** `RootShell.tsx:1522` sends `entityType: 'user'`; the DB CHECK allows only `article|post|reel|profile|comment` (`schema.sql:272`). Insert fails silently.
- **Fix:** Use `'profile'` — better, create notifications in DB triggers (`FEAT-07`).

### FEAT-06 · [MEDIUM] Notification links don't land on the item
- **Where:** `RootShell.tsx:769` builds `/#comment-<id>` and `/#post-<id>`; nothing scrolls to these anchors (no `scrollIntoView`/hash handling anywhere).
- **Fix:** Link to real routes (`/post/:id?comment=<cid>`, `/article/:id?comment=<cid>`) and scroll/highlight the comment on mount.

### FEAT-07 · Notifications are created by the client (spoofable, unreliable)
- **Where:** `RootShell.tsx:756-781, 834-886, 917-969, 1180-1203, 1513-1534` + `notifications_insert_all with check (true)`.
- **Impact:** Anyone can send any user any message/link; when the actor's write fails, the notification is lost.
- **Fix:** `after insert` triggers on `comments`, `reactions`, `follows` insert the notification server-side (actor = `auth.uid()`, recipient = owner of target, skip self). Remove client inserts and the insert policy.

### FEAT-08 · Media uploads: no size/type limit, stored as base64 in DB rows
- **Where:** `FacebookCreatePostModal.tsx:35-42` (any file, any size → `reels.media_url`, `stories.image_url`, `posts.images`), `CreatePostModal.tsx:48-53`, `ProfileSettingsModal.tsx:85-94` (avatar is compressed, others are not).
- **Impact:** Multi-MB rows downloaded by every visitor on every refresh (`PERF-02`); localStorage overflow (`DATA-11`); a video file becomes a data-URL "image".
- **Fix:** Supabase Storage bucket `media` with RLS (`owner = auth.uid()`), accept `image/jpeg|png|webp` (+ `video/mp4` if needed), max 5 MB image / 50 MB video, client-side resize for images, store public URL only. Add DB CHECK `length(media_url) < 2048`.

---

## 8. Verification gates (run after every phase)

```bash
pnpm typecheck        # tsc --noEmit — must be 0 errors (add script, DX-01)
```
```bash
pnpm lint             # eslint — must be 0 errors (DX-02)
```
```bash
pnpm test             # vitest unit tests (DX-03)
```
```bash
pnpm build
```
```bash
pnpm e2e -- --trace off   # Playwright: visit every route incl. /post/:id, /reel/:id, /events/:id, /editorial; fail on any console error
```
```bash
supabase start && supabase db reset && pnpm test:rls   # RLS tests against LOCAL db only
```

**RLS test cases to automate (local DB, anon + two test users A/B):** anon cannot insert/update/delete any row in comments/posts/reactions/bookmarks/notifications/follows; anon cannot read `newsletter_subscribers` or `profiles.email`; A cannot update/delete B's comment/post/reaction/bookmark; A cannot insert with `author_id = B`; A cannot set own `is_verified`; A can switch own reaction type; non-editor cannot insert articles/stories/events.

---

## 9. The previous audit (`audit-reports/AllTogether.md`) is inaccurate

Mark it as superseded (or delete it). Specific false statements:
- "rendered through **React 19**" → the app uses React **18.3.1** (`package.json`). React 18 does **not** block `javascript:` URLs.
- "External URLs … are validated to ensure they use approved http/https" → no such validation exists (`SEC-08`).
- "`BkashCheckoutModal.tsx` strictly validates TrxID" → that file does not exist.
- RLS table ("notifications restricted to recipient", "bookmarks strictly owner-isolated", "comments insert restricted to authenticated author") → false since the 2026-11-07 migrations (`SEC-02`).
- "No secret keys … in public commits" → `.env` with an OpenRouter key is committed (`SEC-01`).
- Test claims rely on scripts that don't execute the real code (`DX-03`).

---

## 10. Reference SQL for P0 (one migration: `supabase/migrations/<timestamp>_lockdown_rls.sql`)

> Test on a local DB first. Back up production before applying. Adjust column names if the live schema differs (run `supabase db pull` first to get the real current schema — the three SQL copies in this repo disagree, see `DX-05`).

```sql
begin;

-- 0) Roles table (manage rows via SQL editor / service role only)
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor'))
);
alter table public.app_admins enable row level security;  -- no policies on purpose

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid() and role in ('admin','editor'));
$$;

-- 1) Drop EVERY existing policy on the affected tables (names have drifted)
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public'
             and tablename in ('profiles','articles','posts','comments','reactions','reels','stories',
                               'events','event_registrations','bookmarks','follows','notifications',
                               'newsletter_subscribers','orders','ideas','research_papers','store_products',
                               'profile_login_aliases')
  loop execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop;
end $$;

-- 2) Public read where content is public
create policy articles_read on public.articles for select using (true);
create policy posts_read    on public.posts    for select using (true);
create policy comments_read on public.comments for select using (true);
create policy reactions_read on public.reactions for select using (true);
create policy reels_read    on public.reels    for select using (true);
create policy events_read   on public.events   for select using (true);
create policy follows_read  on public.follows  for select using (true);
create policy stories_read  on public.stories  for select using (expires_at is null or expires_at > now() or public.is_editor());
create policy profiles_read on public.profiles for select using (true);  -- plus column privileges, see SEC-03

-- 3) Owner-scoped writes (authenticated only)
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = (select auth.uid())::text);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())::text or public.is_admin()) with check (id = (select auth.uid())::text or public.is_admin());

create policy articles_insert_editor on public.articles for insert to authenticated
  with check (public.is_editor() and author_id = (select auth.uid())::text);
create policy articles_update_own on public.articles for update to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin()) with check (author_id = (select auth.uid())::text or public.is_admin());
create policy articles_delete_own on public.articles for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

create policy posts_insert_own on public.posts for insert to authenticated with check (author_id = (select auth.uid())::text);
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin()) with check (author_id = (select auth.uid())::text or public.is_admin());
create policy posts_delete_own on public.posts for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

create policy comments_insert_own on public.comments for insert to authenticated with check (author_id = (select auth.uid())::text);
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid())::text) with check (author_id = (select auth.uid())::text);
create policy comments_delete_own on public.comments for delete to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin());

create policy reactions_insert_own on public.reactions for insert to authenticated with check (user_id = (select auth.uid())::text);
create policy reactions_update_own on public.reactions for update to authenticated
  using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);
create policy reactions_delete_own on public.reactions for delete to authenticated using (user_id = (select auth.uid())::text);

create policy bookmarks_own on public.bookmarks for all to authenticated
  using (user_id = (select auth.uid())::text) with check (user_id = (select auth.uid())::text);

create policy follows_insert_own on public.follows for insert to authenticated with check (follower_id = (select auth.uid())::text);
create policy follows_delete_own on public.follows for delete to authenticated using (follower_id = (select auth.uid())::text);

create policy notifications_read_own on public.notifications for select to authenticated using (recipient_id = (select auth.uid())::text);
create policy notifications_update_own on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())::text) with check (recipient_id = (select auth.uid())::text);
create policy notifications_delete_own on public.notifications for delete to authenticated using (recipient_id = (select auth.uid())::text);
-- NO insert policy: notifications are created by triggers (FEAT-07)

create policy reels_write_editor on public.reels for all to authenticated
  using (creator_id = (select auth.uid())::text or public.is_admin()) with check (creator_id = (select auth.uid())::text and public.is_editor());
create policy stories_write_editor on public.stories for all to authenticated
  using (author_id = (select auth.uid())::text or public.is_admin()) with check (author_id = (select auth.uid())::text and public.is_editor());
create policy events_write_admin on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy reg_own on public.event_registrations for all to authenticated
  using (user_id = (select auth.uid())::text or public.is_admin()) with check (user_id = (select auth.uid())::text);

create policy newsletter_insert on public.newsletter_subscribers for insert with check (true);
create policy newsletter_read_editor on public.newsletter_subscribers for select to authenticated using (public.is_editor());
-- orders / ideas / research_papers / store_products / profile_login_aliases: no client policies (feature removed). Drop tables after backup if unused.

-- 4) Protect privileged profile columns
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.id := old.id; new.email := old.email; new.created_at := old.created_at;
    new.is_verified := old.is_verified;
    new.followers_count := old.followers_count; new.following_count := old.following_count;
    new.publications_count := old.publications_count;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 5) Reaction counts maintained by the DB (DATA-09/10)
create or replace function public.recount_reactions() returns trigger
language plpgsql security definer set search_path = public as $$
declare t_type text := coalesce(new.target_type, old.target_type);
        t_id   text := coalesce(new.target_id,   old.target_id);
        counts jsonb; total int;
begin
  select coalesce(jsonb_object_agg(type, n), '{}'::jsonb), coalesce(sum(n),0)
    into counts, total
    from (select type, count(*)::int n from public.reactions
          where target_type = t_type and target_id = t_id group by type) s;
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

-- 6) Article views via RPC (DATA-10)
create or replace function public.increment_article_view(p_id text) returns void
language sql security definer set search_path = public as $$
  update public.articles
     set stats = jsonb_set(stats, '{views}', to_jsonb(coalesce((stats->>'views')::int, 0) + 1))
   where id = p_id;
$$;
grant execute on function public.increment_article_view(text) to anon, authenticated;

-- 7) Reply cascade + safe links (DATA-07, SEC-08). Clean orphans/bad rows first.
delete from public.comments c where c.parent_id is not null
  and not exists (select 1 from public.comments p where p.id = c.parent_id);
alter table public.comments add constraint comments_parent_fk
  foreign key (parent_id) references public.comments(id) on delete cascade;
alter table public.posts add constraint posts_link_http check (coalesce(external_link,'') = '' or external_link ~* '^https?://');
alter table public.profiles add constraint profiles_website_http check (coalesce(website,'') = '' or website ~* '^https?://');

commit;
```
Then insert the real admin/editor rows: `insert into public.app_admins (user_id, role) values ('<auth uuid>', 'admin');`.

---

## 11. MEDIUM — security hardening (P4)

### SEC-08 · User-supplied links rendered without a scheme check (`javascript:` links)
- **Where:** `CommunityPostCard.tsx:156` (`post.externalLink`), `Views.tsx:944` (`profile.website`), `ArticleReaderModal.tsx:263-270, 330` (`researchBasis.sourceUrl`/`externalLink`).
- **Evidence:** a seeded `javascript:` link rendered as a live anchor. Execution was blocked in Chromium only because of `target="_blank" rel="noopener"`; other browsers/flows (e.g. removing `target`) would run it. With `SEC-02`, anyone can write such links into others' posts.
- **Fix:** `safeUrl(u)` helper: `try { const x = new URL(u); return ['http:','https:'].includes(x.protocol) ? x.href : undefined } catch { return undefined }`; use for every user-controlled `href`/`src`. Plus the DB CHECKs in §10.

### SEC-09 · Account enumeration
- **Where:** `AuthModal.tsx:133-158` looks up `profiles.email` after a failed login and tells the user whether the account exists.
- **Fix:** Generic "email or password incorrect"; separate explicit "Create account" tab. Remove the query (also needed for `SEC-03`).

### SEC-10 · Hard-coded personal data and identity special-cases in the client
- **Where:** `auth.ts:4-147` (personal emails, auth UUIDs, a handle alias list, and `ZUBAIR_EMAIL = 'Zubair2001!'`, which looks like a password — **if it is or was a real password, change it now**), `supabase.ts:13` (personal bKash phone number), `db.ts` & `RootShell.tsx` (`isZubairIdentifier` overrides names/avatars/verification and treats several accounts as one owner, e.g. `RootShell.tsx:996-998`, `ArticleCard.tsx:56-63`).
- **Impact:** Personal data shipped to every visitor; login form accepts a username alias that maps to a specific account (`auth.ts:166-172`); ownership checks consider different accounts equal.
- **Fix:** Delete all identity special-casing. Profiles come only from the DB. Ownership = `authorId === session.user.id`. Move the phone number to config if still needed.

### SEC-11 · Missing security headers
- **Where:** `public/_headers`.
- **Fix:** Add `Content-Security-Policy` (script-src 'self'; connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co; img-src 'self' data: https:; frame-src https://www.youtube-nocookie.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com), `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`. Move the inline SW script out of `index.html` (or hash it) so CSP can forbid inline scripts.

### SEC-12 · No abuse protection on public writes
- **Where:** newsletter insert (public), sign-up, comments.
- **Fix:** Turn on Supabase Auth CAPTCHA (hCaptcha/Turnstile) for sign-up; newsletter via an Edge Function with Turnstile + rate-limit + double opt-in; DB length CHECKs (`comments.text <= 5000`, `posts.content <= 10000`).

### SEC-13 · Realtime subscribes to the whole schema
- **Where:** `RootShell.tsx:237-242` `postgres_changes { event: '*', schema: 'public' }`.
- **Impact:** Broadcasts every change in every published table to every client (subject to RLS, which is currently open → notifications of everyone stream to everyone). Also `PERF-01`.
- **Fix:** Subscribe per table with filters (e.g. `notifications` filter `recipient_id=eq.<uid>`; `comments` filter `target_id=eq.<open item>`).

### SEC-14 · [LOW] CSV export formula injection
- **Where:** `EditorialDashboard.tsx:63` joins raw emails into CSV.
- **Fix:** Quote fields and prefix cells starting with `= + - @` with `'`.

---

## 12. MEDIUM/HIGH — performance & scale (P5)

| ID | Sev | Where | Problem | Fix |
|---|---|---|---|---|
| PERF-01 | HIGH | `RootShell.tsx:237-242`, `db.ts:726-788` | Any change by any user → **every** connected client re-runs **15 queries** (`fetchFromSupabase`). 1,000 users online × 1 comment = 15,000 queries. No debounce. | Per-table filtered subscriptions; apply the changed row to state; debounce; TanStack Query `invalidateQueries` on specific keys. |
| PERF-02 | HIGH | `db.ts:733-788` | Loads everything on every refresh: profiles(60), articles(60), posts(60), comments(201), reactions(501), all follows (unbounded), etc., with `select('*')` (pulls base64 media). | Fetch per screen; paginate with keyset (`created_at,id` index exists); select only needed columns. |
| PERF-03 | HIGH | `db.ts:772-773` | Comments capped at 201 and reactions at 501 **globally**; counts and threads computed from these → older comments vanish, counts drift. | Query comments per target with pagination; counts from DB (`DATA-10`). |
| PERF-04 | MEDIUM | `db.ts:784` | `follows` fetched entirely to compute counts. | Use `followers_count` columns maintained by trigger; fetch only `follower_id = me`. |
| PERF-05 | MEDIUM | `vite.config.ts:36-53` | `manualChunks` checks `id.includes('react')` first, so `react-router` and `lucide-react` land in `vendor-react`; `vendor-router`/`vendor-icons` never exist. Main chunk 472 KB, no route-level code splitting. | Order checks most-specific first (or drop manualChunks); `React.lazy` for modals and non-home routes (Editorial, Profile, Reader, Story/Reel players, SiteLoader). |
| PERF-06 | MEDIUM | `public/` | 3 MB first load: 1.1 MB `japan_cucumber_robot.jpg`, 364 KB `icon.png` (1254×1254) used as favicon/avatar, 352–575 KB 2172×724 logo PNGs. Unused: `videos/splash.mp4` (1.1 MB), `images/hasan_zubair.png` (2.1 MB). | Convert to WebP/AVIF at display sizes (logo ~400 px wide, icons 32/180/192/512), `srcset` + `loading="lazy"` + `width/height`; delete unused files. |
| PERF-07 | MEDIUM | `src/styles/fonts.css:1-136` | CSS `@import` of Google Fonts (render-blocking chain HTML→CSS→Google CSS→fonts), 4 families, plus hard-coded versioned `gstatic` URLs that break when Google rotates versions. | `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html`, or self-host via `@fontsource`; drop unused families/weights; keep the digit unicode-range trick with self-hosted files. |
| PERF-08 | MEDIUM | `SiteLoader.tsx:83-148, 179-181, 545` | 4.8 s full-screen splash on the first visit of every browser session (sessionStorage) delays all content (hurts LCP). | Show only on first-ever visit (localStorage), make it skippable, ≤1.5 s, or remove. |
| PERF-09 | LOW | `RootShell.tsx:540-549` | Every touchstart walks up the DOM calling `getComputedStyle` twice per node. | Rely on `data-swipe-ignore`; or remove global swipe (`UX-02`). |

---

## 13. MEDIUM — UX, SEO, PWA, accessibility, compliance (P6)

### UX-01 · Back-button hijacking via fake history entries
- **Where:** `RootShell.tsx:464-514` pushes a sentinel entry on load and pushes again on every back press; `367-386` pushes entries for modals outside React Router.
- **Evidence:** `history.length === 2` immediately after first load.
- **Impact:** Users can't leave the site with Back; conflicts with React Router's own history state (`idx`), causing odd navigation; considered a dark pattern by Google.
- **Fix:** Remove the sentinel and popstate re-push. For modals, either use route-based modals (`/article/:id` as a modal route with `location.state.background`) or push one entry per open and `navigate(-1)` on close via the router.

### UX-02 · Global horizontal swipe changes tabs
- **Where:** `RootShell.tsx:516-596`. Conflicts with iOS/Android edge back-swipe, carousels and text selection.
- **Fix:** Remove, or limit to a dedicated swipe container.

### UX-03 · Fabricated analytics in the editorial dashboard
- **Where:** `EditorialDashboard.tsx:45-56, 267-268`: uses non-existent `stats.viewsCount`/`likesCount`, falls back to 3,400 views per article and a floor of **41,280** total views.
- **Fix:** Use real `stats.views`; show 0 when 0. Also stop listing the authorized editor emails on the "access restricted" screen (lines 87–92).

### UX-04 · Comment time shows only time-of-day, never the date
- **Where:** `pureLogic.ts:214` stores `toLocaleTimeString` text; `db.ts:801` reads `timestamp_label`, ignores `created_at`. Same for notifications (`db.ts:1003`).
- **Fix:** Store/read `created_at`; render relative time ("৩ দিন আগে") with `Intl.RelativeTimeFormat('bn')`.

### UX-05 · [LOW] Inconsistent comment order
- **Where:** `pureLogic.ts:175` (articles: newest first) vs `187` (posts: newest last).
- **Fix:** One rule, sorted by `created_at`.

### UX-06 · Moderation doesn't work for the real admin account
- **Where:** `RootShell.tsx:1273, 1293, 1312` compare to the literal `'usr-plainsyt-admin'`, not the admin's real auth UUID.
- **Fix:** Use `my_role()` (`SEC-06`).

### UX-07 · Every unknown `/profile/<anything>` shows a made-up profile
- **Where:** `RootShell.tsx:1732-1748` synthesizes a profile with a stock photo; `1684-1730` synthesizes "verified" profiles from article/post author fields.
- **Fix:** Fetch the profile by id/handle; show a 404 state when missing.

### UX-08 · [LOW] `alert()` dialogs
- **Where:** `FacebookCreatePostModal.tsx:50`, `CreatePostModal.tsx:87`.
- **Fix:** Use the auth modal / toast.

### SEO-01 · Prerender script and sitemap don't match the app
- **Where:** `scripts/prerender_articles.mjs:19-44` hard-codes two articles: slug `bina-gamma-ray-irradiation-center` (the app **removes** this article: `db.ts:239-249, 1021-1036`) and `japan-cucumber-harvesting-robot` (the app's slug is `japan-ai-cucumber-harvesting-robot-future-of-smart-agriculture`, `db.ts:107`), image `/images/JapanRobot.jpg` (file doesn't exist), author "Hasan Zubair" (app says "নিজস্ব প্রতিবেদক"). It also **rewrites `public/sitemap.xml`** during build (line 162). `robots.txt` points to `https://plainsyt.com/sitemap.xml` while everything else uses `https://pla.insyt.bd`.
- **Fix:** Generate prerender pages + sitemap from the database at build time (Supabase query with the anon key, read-only), one canonical domain everywhere, don't write into `public/` during build.

### SEO-02 · Client-side meta only; `SEOHead` uses fields that don't exist
- **Where:** `SEOHead.tsx:23-24` (`article.excerpt`, `article.coverImage` don't exist; `article.content.slice(0,160)` slices an **array**); meta/JSON-LD are never reset when leaving an article; `index.html:16` `og:image` is relative (must be absolute).
- **Fix:** Use `subtitle`/`coverImageUrl`/`content.join(' ').slice(0,160)`; reset on unmount; absolute og:image. For real social previews, render meta server-side (Cloudflare Worker/Pages Function that injects meta for `/article/*`).

### SEO-03 · [LOW] No `<h1>` on the home page; soft-404s
- **Fix:** Add a visually-hidden or visible `h1`; return proper not-found states (`UX-07`).

### PWA-01 · Self-destructing service worker registered on every visit
- **Where:** `index.html:17-38` registers `/sw.js` in production; `public/sw.js` deletes **all** caches and unregisters itself on activate — on every visit.
- **Fix:** Remove the registration (keep the kill-switch `sw.js` deployed for a few weeks so old installs clean up, then delete). If offline support is wanted, use `vite-plugin-pwa`.

### PWA-02 · [LOW] Manifest icons are wrong
- **Where:** `public/manifest.webmanifest`: declares 192×192 and 512×512 but the file is 1254×1254; `"purpose": "any maskable"` combined; `theme_color #00ED64` vs `index.html` `#03EF62`; `favicon.ico` is a 364 KB PNG renamed.
- **Fix:** Generate correctly-sized PNGs (+ separate maskable icon with safe padding), a real 32/48 px `.ico`, consistent theme color.

### A11Y-01 · Modals lack focus management
- **Where:** `Primitives.tsx` `Modal` (~lines 125-152): Escape and `aria-modal` exist, but no focus trap, no initial focus, no focus restore. Two buttons on home have no accessible name (Playwright count).
- **Fix:** Use Radix `Dialog` (already a dependency) for all modals; add `aria-label` to icon buttons.

### COMP-01 · YouTube embeds hide branding and controls
- **Where:** `YouTubeMark.tsx:25-37` (`controls=0`, `disablekb=1`), `IntegratedReelCard.tsx:263-274` (iframe scaled to 128% to crop chrome, `pointer-events-none`), progress bar is simulated from wall-clock time (lines 111-136), `postMessage(..., '*')` (`YouTubeMark.tsx:46-51`).
- **Impact:** Likely breaches YouTube API Terms (must not obscure branding/player controls); progress bar desyncs from the real video.
- **Fix:** Use the official IFrame Player API (`onStateChange`, `getCurrentTime`) with visible branding; `postMessage` target origin `https://www.youtube-nocookie.com`.

### COMP-02 · [HIGH] Expiring third-party avatar URL
- **Where:** `auth.ts:64-65` Facebook CDN URL with signed expiry `oe=6AF4A9EF` = **2026-11-11T17:46Z**. Also referenced in `schema.sql` seed.
- **Impact:** The founder avatar breaks in 3 days. Hot-linking Facebook/Prothom Alo images (`db.ts:57`) also depends on their servers and permissions.
- **Fix:** Upload the image to Supabase Storage (or `public/`) and reference that URL; rehost or license third-party article images.

---

## 14. LOW — developer experience & cleanup (P7)

### DX-01 · [HIGH] No TypeScript checking at all (root cause of all crashes)
- **Where:** no `tsconfig.json`, `typescript` not installed, `build` = `vite build` (no type-check).
- **Evidence:** 104 errors under `tsc --strict` (22 × "Cannot find name"). Notable: `Comment` type is **not imported** in `RootShell.tsx`/`ArticleCard.tsx`/`CommunityPostCard.tsx`, so TS uses the DOM's `Comment` type; `CommentItem` type imported from `../types` doesn't exist (`ReelPlayerModal.tsx:21`, `StoryViewerModal.tsx:22`); `article.stats.reactionCounts` doesn't exist (`db.ts:1045`).
- **Fix:** Add `tsconfig.json` (strict, `moduleResolution: bundler`, `jsx: react-jsx`, `noEmit`), devDeps `typescript @types/react@18 @types/react-dom@18`, scripts `"typecheck": "tsc --noEmit"`, `"build": "tsc --noEmit && vite build && node scripts/prerender_articles.mjs"`. Fix all errors.

### DX-02 · No linter
- **Fix:** ESLint flat config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` (catches the stale-closure deps in `RootShell`), `no-undef`. Add `"lint"` script.

### DX-03 · [MEDIUM] "Tests" don't test the code
- **Where:** `scripts/stress_concurrency_test.mjs` re-implements functions inline (and uses a reaction type `bulb` that doesn't exist); `scripts/test_full_suite.mjs` mostly greps source files for strings; `scripts/verify_platform.mjs` imports TS from Node; `check_db.mjs`/`test_auth.mjs` hit the production DB and print all profiles/notifications.
- **Fix:** Vitest for `pureLogic.ts`/`db.ts` mappers (import the real modules); Playwright e2e for routes/flows; RLS tests against local Supabase. Delete or move the production-hitting scripts.

### DX-04 · No CI
- **Fix:** GitHub Actions: install → typecheck → lint → unit → build → e2e on every PR.

### DX-05 · [MEDIUM] Three diverging copies of the schema
- **Where:** `supabase/schema.sql`, `supabase/migrations/20261101_production_rls_hardening.sql`, `src/app/lib/schemaSqlRaw.ts` (+ `schemaSql.ts`). They differ (e.g. `parent_id`, reaction policies, seed profile names/avatars). Migration file names use 8-digit dates (`20261107_*`), three share one date, so order depends on alphabetical names.
- **Fix:** Run `supabase db pull` to capture the **live** schema as the baseline migration; delete `schema.sql`'s policy section and `schemaSqlRaw.ts`; use `supabase migration new` (14-digit timestamps); put seed data in `supabase/seed.sql`.

### DX-06 · Package hygiene
- **Where:** `package.json`: name `@figma/my-make-file`; react in `peerDependencies`; **two lockfiles** (`package-lock.json` + `pnpm-lock.yaml`); unused deps: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@popperjs/core`, `react-popper`, `react-dnd`, `react-dnd-html5-backend`, `react-slick`, `react-responsive-masonry`, `gsap`, `canvas-confetti`, `motion`, `date-fns` (0 imports), plus several only used by unused `components/ui/*` files (`recharts`, `cmdk`, `vaul`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `embla-carousel-react`, `react-hook-form`, `next-themes`).
- **Fix:** Rename package; remove peerDependencies; delete `package-lock.json` and add `"packageManager": "pnpm@10.x"`; remove unused deps and unused `ui/*` files; `pnpm approve-builds` for esbuild/oxide.

### DX-07 · Multiple deploy targets configured
- **Where:** `firebase.json`, `wrangler.jsonc` (compatibility_date `2024-09-23`), `public/_redirects` (comment only), `public/_headers`.
- **Fix:** Keep one (Cloudflare per recent commits); delete the others; bump compatibility date.

### CLEAN-01 · Dead code
- `ResearchDiscoveryCard.tsx`, `SupabaseConsoleModal.tsx`, `CommentItem.tsx`, `Footer.tsx` (never imported); `Views.tsx:509-515` `StoreView`/`IdeasView` stubs; `ResearcherViews.tsx` `PublicationsStudioView`; `ProfileSettingsModal` `onSwitchUser`/`allProfiles` props (never used); `RootShell` `onAskAI`, `onOpenSupabaseConsole`, store/ideas/publications cases; `PostCreatorBar` imported but not rendered; `BINA_ARTICLE` + `removedArticleIds`/`dummyViews`/`PURGED_STORY_IDS` cleanup code in `db.ts` (one-off data migrations living in the hot path); repo-root `reaction-buttons.html`, `default_shadcn_theme.css`, `PLainsyt Logo/` (folder name with a space; duplicates `public/logos`), `GEMINI.md`, `guidelines/Guidelines.md` (template).

### CLEAN-02 · Removed features still have data paths
- Store/orders/bKash, ideas, research papers: types, mappers, fetches (`db.ts:776-780`), sync and upsert helpers, SQL tables/policies. Remove end-to-end (or restore the features properly).

### CLEAN-03 · God components
- `RootShell.tsx` (2,416 lines) holds routing, auth, data, 30+ handlers, history, gestures and layout; `db.ts` (1,855 lines) mixes seed content, cache, sync, mappers and API.
- **Fix (after P0–P3):** split into `AuthProvider` (session/profile), data hooks per entity using TanStack Query (`useFeed`, `useComments(target)`, `useReactions`, `useNotifications`), route components per page (`/post/:id` → `PostPage`), and a `ModalProvider`. Move seed content to `supabase/seed.sql`.

### CLEAN-04 · `currentUser` memo reads `localStorage` on every recompute
- `RootShell.tsx:323-331` — goes away with `DATA-02`.

### CLEAN-05 · Signup/handle generation duplicated in 4 places with different rules
- `auth.ts:264, 321`, `RootShell.tsx:185-188`, `ProfileSettingsModal.tsx:107-109`, trigger in SQL. Keep only the DB trigger + a server-side uniqueness check when editing.

### CLEAN-06 · Brand/theme constants inconsistent
- `#03EF62` vs `#00ED64`; background `#fdfaf5` vs `#061621`. Centralize tokens.

---

## 15. Issue index (checklist)

| ID | Sev | Title |
|---|---|---|
| SEC-01 | CRITICAL | OpenRouter key committed; `.env` not ignored |
| SEC-02 | CRITICAL | RLS open to anonymous writes (comments/posts/reactions/notifications/bookmarks) |
| SEC-03 | CRITICAL | Newsletter list + all user emails publicly readable |
| SEC-04 | CRITICAL | Publish as anyone (author_id not checked) |
| SEC-05 | CRITICAL | Self-verification / self-admin via profile update |
| SEC-06 | CRITICAL | Admin/editor = hard-coded emails; client-side gating |
| SEC-07 | CRITICAL | Orders insert open to anonymous |
| BUG-01 | HIGH | `/post/:id` crash (missing import) |
| BUG-02 | HIGH | `/reel/:id` crash (undefined setters) |
| BUG-03 | HIGH | Event share crash (missing `toast` import) |
| BUG-04 | HIGH | Editorial back button crash (wrong prop) |
| BUG-05 | LOW | Latent undefined references in dead branches |
| DATA-01 | HIGH | All DB write errors ignored |
| DATA-02 | HIGH | Identity from localStorage, not session |
| DATA-03 | HIGH | Union merge resurrects deleted data |
| DATA-04 | HIGH | Comment action re-uploads whole post/article |
| DATA-05 | HIGH | Side effects inside state updaters |
| DATA-06 | HIGH | Replies flattened to top-level |
| DATA-07 | HIGH | Orphan replies after delete |
| DATA-08 | HIGH | Comment reaction double count |
| DATA-09 | HIGH | Reaction writes/counts by client |
| DATA-10 | HIGH | Counters computed in browser; views not persisted |
| DATA-11 | HIGH | Silent localStorage quota loss |
| DATA-12 | HIGH | Auto upload of local cache to DB |
| DATA-13 | HIGH | Event registrations discarded |
| DATA-14 | MEDIUM | Saved reels/stories not saved |
| FEAT-01 | HIGH | Fake password reset |
| FEAT-02 | HIGH | Unconfirmed signup treated as logged in |
| FEAT-03 | HIGH | Signup trigger can fail on handle collision |
| FEAT-04 | MEDIUM | OAuth callback handled twice |
| FEAT-05 | MEDIUM | Follow notifications violate CHECK |
| FEAT-06 | MEDIUM | Notification links don't reach target |
| FEAT-07 | HIGH | Client-created notifications |
| FEAT-08 | HIGH | Unbounded base64 uploads |
| SEC-08 | MEDIUM | Unsanitized `href` (javascript:) |
| SEC-09 | MEDIUM | Account enumeration |
| SEC-10 | MEDIUM | Hard-coded personal data / identity hacks / possible password in code |
| SEC-11 | MEDIUM | Missing security headers / CSP |
| SEC-12 | MEDIUM | No abuse protection |
| SEC-13 | MEDIUM | Realtime on whole schema |
| SEC-14 | LOW | CSV formula injection |
| PERF-01 | HIGH | Refetch-everything on any change |
| PERF-02 | HIGH | Loads all tables every refresh |
| PERF-03 | HIGH | Global caps on comments/reactions |
| PERF-04 | MEDIUM | Unbounded follows fetch |
| PERF-05 | MEDIUM | Broken manualChunks; no code splitting |
| PERF-06 | MEDIUM | 3 MB first load; oversized/unused assets |
| PERF-07 | MEDIUM | Render-blocking font chain |
| PERF-08 | MEDIUM | 4.8 s splash |
| PERF-09 | LOW | Swipe handler DOM walk |
| UX-01 | MEDIUM | Back-button hijacking |
| UX-02 | MEDIUM | Global swipe navigation |
| UX-03 | MEDIUM | Fabricated dashboard analytics; editor emails shown |
| UX-04 | MEDIUM | No dates on comments/notifications |
| UX-05 | LOW | Inconsistent comment order |
| UX-06 | MEDIUM | Admin moderation uses wrong id |
| UX-07 | MEDIUM | Fake profiles for unknown handles |
| UX-08 | LOW | `alert()` |
| SEO-01 | MEDIUM | Prerender/sitemap mismatch; two domains |
| SEO-02 | MEDIUM | SEOHead wrong fields; relative og:image |
| SEO-03 | LOW | No h1; soft-404 |
| PWA-01 | MEDIUM | Self-destructing SW on every visit |
| PWA-02 | LOW | Wrong manifest icons/favicon |
| A11Y-01 | MEDIUM | Modal focus management; unnamed buttons |
| COMP-01 | MEDIUM | YouTube branding hidden / fake progress |
| COMP-02 | HIGH | Avatar URL expires 2026-11-11; hot-linked images |
| DX-01 | HIGH | No type-checking (104 errors) |
| DX-02 | LOW | No linter |
| DX-03 | MEDIUM | Tests don't test real code; scripts hit prod |
| DX-04 | LOW | No CI |
| DX-05 | MEDIUM | Three diverging schemas; migration naming |
| DX-06 | LOW | Package hygiene; 2 lockfiles; unused deps |
| DX-07 | LOW | Multiple deploy configs |
| CLEAN-01 | LOW | Dead code |
| CLEAN-02 | LOW | Removed features still have data paths |
| CLEAN-03 | LOW | God components |
| CLEAN-04 | LOW | `currentUser` reads localStorage |
| CLEAN-05 | LOW | Handle generation duplicated |
| CLEAN-06 | LOW | Inconsistent brand tokens |

---

## 16. Notes for the fixer

- Keep fixes small and per-ID; one PR per phase is a good size.
- After `SEC-02`, several client features will **start failing visibly** (they were relying on open policies). That is expected — fix them with `DATA-01/04/09/10` and `FEAT-07`, not by reopening policies.
- Don't re-introduce "local-first" merging unless you build a real offline queue with conflict rules.
- Don't put any secret into a `VITE_*` variable.
- Don't run write tests or RLS probes against production.
