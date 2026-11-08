// Browser smoke test: serves dist/ with the real _headers (incl. CSP), mocks the Supabase REST API (production is never contacted)
// and drives every route + key flows. Requires: pnpm build, and `playwright` resolvable (npm i -g playwright).
// Run: node scripts/e2e_smoke.cjs
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const DIST = path.join(__dirname, '..', 'dist');
const headersFile = fs.readFileSync(path.join(__dirname, '..', 'public', '_headers'), 'utf8');
const globalHeaders = {}; let inGlobal = false;
for (const line of headersFile.split('\n')) { if (line.startsWith('/*')) { inGlobal = true; continue; } if (/^\S/.test(line)) inGlobal = false; if (inGlobal && line.trim()) { const i = line.indexOf(':'); globalHeaders[line.slice(0, i).trim()] = line.slice(i + 1).trim(); } }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); let f = path.join(DIST, p);
  if (!f.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) f = path.join(DIST, 'index.html');
  res.writeHead(200, { ...globalHeaders, 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(4180);

const ME = 'u-me', OTHER = 'u-other';
const profile = (id, name, extra = {}) => ({ id, name, name_bn: name, handle: name.toLowerCase(), role: 'Researcher', organization: 'BAU', location: 'x', bio: 'b', avatar: '', cover_gradient: '', is_verified: false, focus_area: '', website: '', publications_count: 0, followers_count: 0, following_count: 0, created_at: '2026-01-01T00:00:00Z', ...extra });
const article = { id: 'art-1', title: 'Test Article', subtitle: 'Sub', slug: 'test-article', category: 'সকল', category_en: '', image_type: 'lab', cover_image_url: '', image_caption: '', author_id: OTHER, author_json: { id: OTHER, name: 'Other', designation: 'x', organization: 'y', avatar: '' }, published_at: 'today', read_time_minutes: 2, featured: false, content: ['Para one 123.'], takeaways: ['t'], external_link: '', research_basis: null, stats: { views: 5, likes: 0, commentsCount: 0, shares: 0 }, reaction_counts: {}, created_at: '2026-11-01T00:00:00Z' };
const post = { id: 'post-1', author_id: OTHER, author_json: { id: OTHER, name: 'Other', avatar: '', role: 'x' }, timestamp_label: '', content: 'Hello world post', images: [], external_link: 'javascript:alert(1)', shared_post: null, stats: { likes: 0, commentsCount: 0, shares: 0 }, reaction_counts: {}, text_theme: '', ai_label: false, created_at: '2026-11-02T00:00:00Z' };
const reel = { id: 'reel-1', title: 'A reel', creator_id: OTHER, creator: 'Other', creator_avatar: '', location: 'BD', duration: '0:30', views: 0, gradient_theme: 'g', video_type: 'greenhouse-iot', media_url: 'https://example.com/x.jpg', video_url: 'https://www.youtube.com/shorts/BKUmGkQxAUU', likes: 0, reaction_counts: {}, created_at: '2026-11-03T00:00:00Z' };
const event = { id: 'ev-1', title: 'Event One', date_month: 'DEC', date_day: '05', location: 'Dhaka', attendees_count: '10', organizer_id: '', organizer_name: 'Org', description: 'd', external_link: '', created_at: '2026-11-01T00:00:00Z' };

function makeSession() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, exp, role: 'authenticated' })}.sig`;
  return { access_token: jwt, refresh_token: 'r', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: { id: ME, aud: 'authenticated', role: 'authenticated', email: 'me@test.dev', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } };
}

async function open(browser, path, { loggedIn = false, onWrite, failWrites = false, role = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const writes = [], errors = [], csp = [];
  await ctx.route('**/rest/v1/**', async (route) => {
    const req = route.request(); const url = new URL(req.url()); const t = url.pathname.split('/rest/v1/')[1];
    if (req.method() !== 'GET') {
      writes.push({ method: req.method(), table: t, body: req.postData() });
      if (failWrites) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: '42501', message: 'new row violates row-level security policy' }) });
      return route.fulfill({ status: 201, contentType: 'application/json', body: '[]' });
    }
    const data = { articles: [article], posts: [post], reels: [reel], stories: [], events: [event], comments: [{ id: 'c-1', target_type: 'post', target_id: 'post-1', author_id: OTHER, author: 'Other', avatar: '', role: '', text: 'Existing comment', likes: 0, reaction_counts: {}, parent_id: null, created_at: '2026-11-02T01:00:00Z' }], reactions: [], notifications: [], bookmarks: [], follows: [], event_registrations: [], profiles: [profile(OTHER, 'Other', { is_verified: true }), profile(ME, 'Me')] }[t] ?? [];
    const one = req.headers()['accept']?.includes('vnd.pgrst.object');
    const rows = Array.isArray(data) ? data : [];
    let filtered = rows;
    for (const [k, v] of url.searchParams) if (v.startsWith('eq.') && k !== 'select') filtered = filtered.filter((r) => String(r[k]) === v.slice(3));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(one ? (filtered[0] ?? null) : filtered), headers: one && !filtered[0] ? {} : {} });
  });
  await ctx.route('**/rest/v1/rpc/my_role', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(role) }));
  await ctx.route('**/auth/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await ctx.route(/googleapis|gstatic|youtube|ytimg|postimg|example\.com|dicebear/, (r) => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message.split('\n')[0]));
  page.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to/i.test(t)) csp.push(t.slice(0, 160)); if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource|WebSocket/.test(t)) errors.push('CONSOLE ' + t.slice(0, 160)); });
  await page.addInitScript(([session, loggedIn]) => {
    try { localStorage.setItem('plainsyt_splash_shown', 'true'); if (loggedIn) localStorage.setItem('sb-fycghkjzodjrqornkton-auth-token', JSON.stringify(session)); } catch (e) {}
  }, [makeSession(), loggedIn]);
  await page.goto('http://localhost:4180' + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  return { page, ctx, writes, errors, csp };
}

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); };

(async () => {
  const browser = await chromium.launch();

  // 1. Every route renders, with no JS errors and no CSP violations (logged out)
  for (const p of ['/', '/explore', '/events', '/events/ev-1', '/events/does-not-exist', '/notifications', '/profile', '/profile/other', '/profile/nobody-here', '/article/art-1', '/article/test-article', '/article/missing', '/post/post-1', '/post/missing', '/reel/reel-1', '/editorial', '/me/security', '/some/unknown/path']) {
    const s = await open(browser, p);
    const body = (await s.page.locator('body').innerText()).replace(/\s+/g, ' ');
    const crashed = /সিস্টেম নোটিশ|ফিড সাময়িক জটিলতা/.test(body);
    check(`route ${p} renders without crash`, !crashed && s.errors.length === 0 && s.csp.length === 0, [...s.errors, ...s.csp, crashed ? 'ERROR SCREEN' : ''].filter(Boolean).join(' | '));
    if (p === '/') check('home: no fake history entry', (await s.page.evaluate(() => history.length)) <= 2, String(await s.page.evaluate(() => history.length)));
    if (p === '/profile') check('/profile logged-out shows login prompt (not stuck skeleton)', /লগইন \/ সাইন আপ/.test(body));
    if (p === '/events/does-not-exist') check('unknown event shows not-found (no fake event)', /ইভেন্টটি পাওয়া যায়নি/.test(body));
    if (p === '/article/missing') check('unknown article shows not-found', /প্রতিবেদনটি পাওয়া যায়নি/.test(body));
    if (p === '/post/missing') check('unknown post shows not-found', /পোস্টটি পাওয়া যায়নি/.test(body));
    if (p === '/profile/nobody-here') check('unknown profile shows not-found', /প্রোফাইলটি পাওয়া যায়নি/.test(body));
    if (p === '/post/post-1') {
      const bad = await s.page.$$eval('a[href^="javascript:"]', (a) => a.length);
      check('javascript: link is never rendered', bad === 0);
      check('/post/:id renders the post', /Hello world post/.test(body));
    }
    if (p === '/reel/reel-1') check('/reel/:id opens the player', (await s.page.locator('[role="dialog"]').count()) > 0);
    if (p === '/editorial') { const btn = s.page.getByText('হোমপেজে ফিরে যান'); await btn.click(); await s.page.waitForTimeout(300); check('editorial back button works (was a crash)', s.errors.length === 0 && new URL(s.page.url()).pathname === '/', s.errors.join()); }
    await s.ctx.close();
  }

  // 2. Logged-in flows
  let s = await open(browser, '/post/post-1', { loggedIn: true });
  const box = s.page.getByPlaceholder('মন্তব্য লিখুন…').first();
  check('logged-in user sees the comment box', (await box.count()) > 0);
  if (await box.count()) {
    await box.fill('First comment'); await box.press('Enter'); await s.page.waitForTimeout(800);
    const w = s.writes.find((x) => x.table === 'comments');
    check('comment is POSTed to comments with author_id = session user', w && JSON.parse(w.body).author_id === ME && JSON.parse(w.body).text === 'First comment', w?.body);
    check('client never writes notifications', !s.writes.some((x) => x.table === 'notifications'));
    check('client never writes derived counters on posts', !s.writes.some((x) => x.table === 'posts'));
    // threaded reply keeps its parent
    s.writes.length = 0;
    await s.page.getByText('উত্তর দিন', { exact: true }).first().click();
    const reply = s.page.getByPlaceholder(/-কে উত্তর দিন/).first();
    await reply.fill('A threaded reply'); await reply.press('Enter'); await s.page.waitForTimeout(800);
    const rw = s.writes.find((x) => x.table === 'comments' && /threaded reply/.test(x.body || ''));
    check('reply is saved with parent_id (threading works)', rw && JSON.parse(rw.body).parent_id === 'c-1', rw?.body);
  }
  await s.ctx.close();

  s = await open(browser, '/post/post-1', { loggedIn: true });
  const likeBtn = s.page.locator('button[aria-label*="Like" i], button[aria-label*="লাইক"]').first();
  if (await likeBtn.count()) { await likeBtn.click(); await s.page.waitForTimeout(800); const w = s.writes.find((x) => x.table === 'reactions'); check('reaction upsert body has only own-row fields (no counts)', w && !('reaction_counts' in JSON.parse(w.body)) && JSON.parse(w.body).user_id === ME, w?.body); }
  else check('like button found', false, 'no like button selector matched');
  await s.ctx.close();

  // 3. Failure path: server rejects writes -> user is told, nothing pretends to succeed
  s = await open(browser, '/post/post-1', { loggedIn: true, failWrites: true });
  const box2 = s.page.getByPlaceholder('মন্তব্য লিখুন…').first();
  if (await box2.count()) {
    await box2.fill('Will be rejected'); await box2.press('Enter'); await s.page.waitForTimeout(500);
    check('rejected write shows an error toast', /row-level security/i.test(await s.page.locator('body').innerText()));
    await s.page.waitForTimeout(2500);
    const after = await s.page.locator('body').innerText();
    check('rejected comment is rolled back (not left on screen)', !/Will be rejected/.test(after));
  }
  await s.ctx.close();

  // 4. Editor role gating comes from the server (rpc), not from client-side email lists
  s = await open(browser, '/editorial', { loggedIn: true, role: 'editor' });
  check('editor (from my_role rpc) can open the dashboard', /সম্পাদকীয় ড্যাশবোর্ড/.test(await s.page.locator('body').innerText()));
  await s.ctx.close();
  s = await open(browser, '/editorial', { loggedIn: true, role: null });
  check('non-editor is denied the dashboard', /Access Restricted/.test(await s.page.locator('body').innerText()));
  await s.ctx.close();

  // 5. Modal accessibility
  s = await open(browser, '/');
  await s.page.getByRole('button', { name: /লগইন|Login|প্রবেশ|সাইন ইন/i }).first().click().catch(() => {});
  await s.page.waitForTimeout(500);
  const dlg = await s.page.locator('[role="dialog"]').count();
  if (dlg) {
    await s.page.keyboard.press('Tab'); await s.page.keyboard.press('Tab');
    const inside = await s.page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    check('focus stays inside the open dialog', inside);
    await s.page.keyboard.press('Escape'); await s.page.waitForTimeout(300);
    check('Escape closes the dialog', (await s.page.locator('[role="dialog"]').count()) === 0);
  } else check('auth dialog opened', false, 'could not open login dialog');
  await s.ctx.close();

  await browser.close(); server.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.ok ? '' : '  -> ' + r.detail));
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
})();
