import { useEffect } from 'react';
import type { Article } from '../types';

interface SEOHeadProps {
  article?: Article | null;
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export function SEOHead({
  article,
  title,
  description,
  url,
  image,
}: SEOHeadProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const pageTitle = article ? `${article.title} · PLAiNSYT` : (title ? `${title} · PLAiNSYT` : 'PLAiNSYT · উন্মুক্ত কৃষি ও প্রযুক্তি গবেষণা প্ল্যাটফর্ম');
    const pageDesc = article ? (article.subtitle || article.content.join(' ').slice(0, 160)) : (description || 'কৃষি, পরমাণু প্রযুক্তি, স্মার্ট রোবোটিক্স ও জীবপ্রযুক্তি নিয়ে উন্মুক্ত গবেষণা ও উদ্ভাবন প্ল্যাটফর্ম।');
    const rawImage = article?.coverImageUrl || image || '/logos/Bangla.png';
    const pageImage = rawImage.startsWith('http') ? rawImage : `${window.location.origin}${rawImage}`;
    const rawUrl = url || (article ? `/article/${article.slug || article.id}` : window.location.pathname);
    const pageUrl = rawUrl.startsWith('http') ? rawUrl : `https://pla.insyt.bd${rawUrl}`;

    document.title = pageTitle;

    const setMeta = (name: string, content: string, isProp = false) => {
      const selector = isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProp) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', pageDesc);
    setMeta('keywords', 'কৃষিপ্রযুক্তি, এগ্রো-আইওটি, বাংলাদেশ কৃষি বিশ্ববিদ্যালয়, পরমাণু কৃষি, PLAiNSYT, Agritech BD, Bangladesh Agronomy');
    setMeta('og:title', pageTitle, true);
    setMeta('og:description', pageDesc, true);
    setMeta('og:image', pageImage, true);
    setMeta('og:url', pageUrl, true);
    setMeta('og:type', article ? 'article' : 'website', true);
    setMeta('og:site_name', 'PLAiNSYT', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle);
    setMeta('twitter:description', pageDesc);
    setMeta('twitter:image', pageImage);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', pageUrl);

    // Structured JSON-LD Data for Search Engines
    const scriptId = 'plainsyt-seo-jsonld';
    let scriptEl = document.getElementById(scriptId);
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptEl);
    }

    if (article) {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: pageDesc,
        image: [pageImage],
        datePublished: article.publishedAt || new Date().toISOString(),
        dateModified: article.publishedAt || new Date().toISOString(),
        author: {
          '@type': 'Person',
          name: article.author?.name || 'PLAiNSYT',
          url: `https://pla.insyt.bd/profile/${article.author?.id || ''}`,
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
      scriptEl.textContent = JSON.stringify(jsonLd);
    }
  }, [article, title, description, url, image]);

  return null;
}

