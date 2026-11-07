import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const templatePath = path.join(distDir, 'index.html');

if (!fs.existsSync(templatePath)) {
  console.log('Skipping prerender: dist/index.html does not exist yet.');
  process.exit(0);
}

const template = fs.readFileSync(templatePath, 'utf-8');

// Canonical Articles for Pre-rendering & SEO
const ARTICLES = [
  {
    id: 'art-bina-gamma-ray',
    slug: 'bina-gamma-ray-irradiation-center',
    title: 'বিনা (BINA) গামা-রশ্মি বিকিরণ কেন্দ্র: বাংলাদেশের নিউক্লীয় কৃষি বিপ্লবের ৫০ বছর',
    subtitle: 'পরমাণু রশ্মির নিয়ন্ত্রিত ব্যবহারে খাদ্য নিরাপত্তা ও উচ্চফলনশীল মিউট্যান্ট ফসলের ইতিহাস',
    excerpt: 'বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউট (বিনা)-এর কোবাল্ট-৬০ গামা সেল ও বিকিরণ প্রযুক্তির গবেষণার বিশদ বিশ্লেষণ।',
    coverImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    author: 'হাসান জুবায়ের (Hasan Zubair)',
    publishedAt: '2026-02-15T09:00:00.000Z',
    category: 'পরমাণু কৃষি',
  },
  {
    id: 'art-japan-cucumber-robot',
    slug: 'japan-cucumber-harvesting-robot',
    title: 'জাপানের শসা কাটার রোবট: গ্রিনহাউস এগ্রিকালচারে রোবোটিক্স বিপ্লব ও বাংলাদেশের ভবিষ্যৎ',
    subtitle: 'কৃত্রিম বুদ্ধিমত্তা ও ৩ডি ভিশন সেন্সর দিয়ে প্রতি সেকেন্ডে পাকা শসা শনাক্ত ও স্বয়ংক্রিয় কাটার বিজ্ঞান',
    excerpt: 'জাপানি কৃষি রোবোটিক্স কীভাবে গভীর শিখন ও মোশন প্ল্যানিং অ্যালগরিদম ব্যবহার করে ফল ক্ষতি না করে তোলার বৈজ্ঞানিক পর্যালোচনা।',
    coverImage: '/images/JapanRobot.jpg',
    author: 'হাসান জুবায়ের (Hasan Zubair)',
    publishedAt: '2026-03-01T10:30:00.000Z',
    category: 'এগ্রো-আইওটি ও রোবোটিক্স',
  },
];

console.log('🚀 Pre-rendering SEO-friendly static article pages...');

for (const art of ARTICLES) {
  const pageUrl = `https://pla.insyt.bd/article/${art.slug}`;
  const pageTitle = `${art.title} · PLAiNSYT`;
  const pageDesc = art.subtitle || art.excerpt;
  const pageImage = art.coverImage.startsWith('http') ? art.coverImage : `https://pla.insyt.bd${art.coverImage}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: art.title,
    description: pageDesc,
    image: [pageImage],
    datePublished: art.publishedAt,
    dateModified: art.publishedAt,
    author: {
      '@type': 'Person',
      name: art.author,
      url: 'https://pla.insyt.bd/profile/hasanzubair',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PLAiNSYT',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pla.insyt.bd/logos/Bangla.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  };

  const metaTags = `
    <title>${pageTitle}</title>
    <meta name="description" content="${pageDesc}" />
    <link rel="canonical" href="${pageUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:title" content="${pageTitle}" />
    <meta property="og:description" content="${pageDesc}" />
    <meta property="og:image" content="${pageImage}" />
    <meta property="og:site_name" content="PLAiNSYT" />
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${pageUrl}" />
    <meta name="twitter:title" content="${pageTitle}" />
    <meta name="twitter:description" content="${pageDesc}" />
    <meta name="twitter:image" content="${pageImage}" />
    <!-- Structured JSON-LD -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  `;

  // Pre-rendered article semantic HTML inside #root
  const semanticArticleHtml = `
    <article class="prerendered-seo-article font-bangla p-4 max-w-4xl mx-auto" style="visibility:visible">
      <header class="mb-4">
        <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">${art.category}</span>
        <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 mb-2">${art.title}</h1>
        <p class="text-base text-slate-600">${art.subtitle}</p>
        <div class="mt-3 text-xs text-slate-500">লেখক: <strong>${art.author}</strong> · তারিখ: ${new Date(art.publishedAt).toLocaleDateString('bn-BD')}</div>
      </header>
      <div class="my-4">
        <img src="${art.coverImage}" alt="${art.title}" class="rounded-xl w-full max-h-[420px] object-cover" />
      </div>
      <div class="text-slate-800 text-sm leading-relaxed">${art.excerpt}</div>
    </article>
  `;

  // Inject into template
  let renderedHtml = template.replace(/<title>.*?<\/title>/i, '');
  renderedHtml = renderedHtml.replace('</head>', `${metaTags}\n</head>`);
  renderedHtml = renderedHtml.replace('<div id="root"></div>', `<div id="root">${semanticArticleHtml}</div>`);

  // Write for both /article/:slug and /article/:id
  const paths = [
    path.join(distDir, 'article', art.slug),
    path.join(distDir, 'article', art.id),
  ];

  for (const targetDir of paths) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), renderedHtml, 'utf-8');
  }

  console.log(`  ✓ Pre-rendered: /article/${art.slug}`);
}

// Update sitemap.xml in dist/
const sitemapPath = path.join(distDir, 'sitemap.xml');
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pla.insyt.bd/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://pla.insyt.bd/explore</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${ARTICLES.map(
  (a) => `  <url>
    <loc>https://pla.insyt.bd/article/${a.slug}</loc>
    <lastmod>${a.publishedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
).join('\n')}
</urlset>`;

fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
const publicSitemap = path.join(rootDir, 'public', 'sitemap.xml');
fs.writeFileSync(publicSitemap, sitemapXml, 'utf-8');

console.log('✓ Prerendering & sitemap complete.');
