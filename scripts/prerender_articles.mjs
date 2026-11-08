// Build step: pre-render SEO-friendly HTML for each published article and write dist/sitemap.xml.
// Reads PUBLIC data with the public (anon) key. If the database is unreachable the build still
// succeeds and ships a sitemap with the static pages only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const SITE = (process.env.SITE_URL || 'https://pla.insyt.bd').replace(/\/$/, '');

const clientSrc = fs.readFileSync(path.join(rootDir, 'src/app/lib/supabase.ts'), 'utf-8');
const fallback = (re) => clientSrc.match(re)?.[1];
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || fallback(/SUPABASE_URL = env\.VITE_SUPABASE_URL \|\| '([^']+)'/);
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY ||
  fallback(/'(sb_publishable_[A-Za-z0-9_-]+)'/);

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
const abs = (u) => (!u ? `${SITE}/logos/Bangla.png` : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);

const templatePath = path.join(distDir, 'index.html');
if (!fs.existsSync(templatePath)) {
  console.log('Skipping prerender: dist/index.html does not exist yet.');
  process.exit(0);
}
const template = fs.readFileSync(templatePath, 'utf-8');

async function fetchArticles() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=id,slug,title,subtitle,cover_image_url,author_json,created_at,category&order=created_at.desc&limit=200`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`⚠ Could not load articles for prerender (${err.message}). Continuing with static pages only.`);
    return [];
  }
}

const articles = await fetchArticles();
console.log(`Pre-rendering ${articles.length} article page(s)...`);

for (const a of articles) {
  const slug = String(a.slug || a.id);
  const pageUrl = `${SITE}/article/${encodeURIComponent(slug)}`;
  const title = `${a.title} · PLAiNSYT`;
  const desc = a.subtitle || a.title;
  const image = abs(a.cover_image_url);
  const authorName = a.author_json?.name || 'PLAiNSYT';
  const published = a.created_at;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description: desc,
    image: [image],
    datePublished: published,
    dateModified: published,
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: 'PLAiNSYT', logo: { '@type': 'ImageObject', url: `${SITE}/logos/Bangla.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  };

  const meta = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(desc)}" />
    <link rel="canonical" href="${esc(pageUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:site_name" content="PLAiNSYT" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <script type="application/ld+json">${jsonLdSafe(jsonLd)}</script>`;

  const body = `<article class="prerendered-seo-article" style="max-width:56rem;margin:0 auto;padding:1rem"><h1>${esc(a.title)}</h1><p>${esc(desc)}</p></article>`;

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, '').replace(/<meta (name|property)="(description|og:[a-z:]+)"[^>]*>\s*/gi, '');
  html = html.replace('</head>', `${meta}\n</head>`).replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  for (const key of new Set([slug, String(a.id)])) {
    const dir = path.join(distDir, 'article', key);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
  }
}

const urls = [
  { loc: `${SITE}/`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE}/explore`, changefreq: 'daily', priority: '0.8' },
  { loc: `${SITE}/events`, changefreq: 'weekly', priority: '0.6' },
  ...articles.map((a) => ({
    loc: `${SITE}/article/${encodeURIComponent(String(a.slug || a.id))}`,
    lastmod: String(a.created_at || '').slice(0, 10),
    changefreq: 'weekly',
    priority: '0.9',
  })),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>${u.lastmod ? `\n    <lastmod>${esc(u.lastmod)}</lastmod>` : ''}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml, 'utf-8');
console.log('✓ Prerendering & sitemap complete.');
