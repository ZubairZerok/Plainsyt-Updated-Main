# Deploying PLAiNSYT (Cloudflare + Supabase)

## Order matters
1. **Rotate the leaked OpenRouter key** (it was committed in `.env` in git history): OpenRouter dashboard → revoke.
2. **Back up Supabase**, then apply `supabase/migrations/20261108000000_security_lockdown.sql` and grant your
   admin role (see `supabase/README.md`).
3. Merge the branch to `main`. Cloudflare builds and deploys automatically.

The new client works against the old database, but security protections, live notifications, server-side counts
and image uploads only exist once the migration is applied. Apply it first.

## Cloudflare settings
* Build command: `pnpm build` (runs type-check, build, image generation, SEO pages). Deploy: `npx wrangler deploy`.
* Node 22 (`.nvmrc`). Package manager: pnpm (lockfile is committed; `package-lock.json` was removed).
* Optional environment variables (public values only; the code falls back to the project's public URL/key):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` (default `https://pla.insyt.bd`).
* **Never** put secret keys in `VITE_*` variables: they are embedded in the public JavaScript.
* Security headers/CSP live in `public/_headers`. If you add a third-party script/image host, extend the CSP.

## After deploy (5-minute check)
* Open `/`, `/explore`, `/events`, an article, `/post/<id>`, `/reel/<id>`: no error screen.
* Sign up with a new e-mail: a confirmation e-mail arrives; after confirming you can comment and react.
* Reply to a comment: it nests. Another account receives a notification.
* Log out: `/notifications` and `/me/security` ask you to log in.
* As a non-admin, editing someone else's comment fails (error toast).

## Local development
```bash
pnpm install
pnpm dev
```
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
Copy `.env.example` to `.env.local` if you want to point at a different Supabase project.
