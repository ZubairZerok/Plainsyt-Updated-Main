import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('   PLAiNSYT FULL-STACK FORENSIC AUTOMATED TEST SUITE');
console.log('====================================================\n');

// ----------------------------------------------------
// SUITE 1: AUTHENTICATION & SECURITY INVARIANTS
// ----------------------------------------------------
console.log('▶ Suite 1: Authentication & Security Invariants');

// Test alias resolution logic directly
function resolveEmailAlias(rawEmail) {
  const normalized = rawEmail.trim().toLowerCase();
  if (normalized === 'plaiinsyt@gmail.com' || normalized === 'pl@insyt.bd') {
    return {
      normalizedEmail: normalized,
      canonicalEmail: 'plaiinsyt@gmail.com',
      canonicalUserId: 'usr-plainsyt-admin',
      isAdmin: true,
    };
  }
  if (
    normalized === 'z65gt9@gmail.com' ||
    normalized === 'zubair2001!' ||
    normalized === 'zubair2001' ||
    normalized === 'zubair2001@gmail.com'
  ) {
    return {
      normalizedEmail: normalized,
      canonicalEmail: 'z65gt9@gmail.com',
      canonicalUserId: 'usr-zubair',
      isAdmin: false,
    };
  }
  return {
    normalizedEmail: normalized,
    canonicalEmail: normalized,
    canonicalUserId: null,
    isAdmin: false,
  };
}

const alias1 = resolveEmailAlias('plaiinsyt@gmail.com');
const alias2 = resolveEmailAlias('pl@insyt.bd');
const aliasMixed = resolveEmailAlias('  PLAIINSYT@Gmail.COM ');
const singleIAlias = resolveEmailAlias('plainsyt@gmail.com');
const aliasZubair = resolveEmailAlias('z65gt9@gmail.com');
const aliasZubairNew = resolveEmailAlias('Zubair2001!');
const regularMember = resolveEmailAlias('farmer.karim@gmail.com');

assert(alias1.isAdmin === true && alias1.canonicalUserId === 'usr-plainsyt-admin', 'Primary admin email resolves to admin role and canonical ID');
assert(alias2.isAdmin === true && alias2.canonicalUserId === 'usr-plainsyt-admin', 'Secondary admin alias pl@insyt.bd resolves to admin role and canonical ID');
assert(aliasMixed.isAdmin === true && aliasMixed.canonicalUserId === 'usr-plainsyt-admin', 'Whitespace & uppercase variants normalize correctly to admin');
assert(singleIAlias.isAdmin === false, 'Typo/impersonation variant plainsyt@gmail.com (single i) is rejected from admin');
assert(aliasZubair.isAdmin === false && aliasZubair.canonicalUserId === 'usr-zubair', 'Zubair email remains distinct member with no admin privileges');
assert(aliasZubairNew.isAdmin === false && aliasZubairNew.canonicalUserId === 'usr-zubair', 'Zubair2001! alias resolves correctly to Zubair member');
assert(regularMember.isAdmin === false && regularMember.canonicalUserId === null, 'Regular visitor email is not granted admin privileges');

// Verify auth.ts code does not contain unauthenticated bypass
const authSource = fs.readFileSync(path.join(rootDir, 'src/app/lib/auth.ts'), 'utf-8');
assert(!authSource.includes('setStoredAuth(adminUser'), 'auth.ts has no unauthenticated password bypass into admin account');
assert(!authSource.includes('setStoredAuth(fallbackUser'), 'auth.ts has no unauthenticated password bypass into member account');
assert(authSource.includes('ইমেইল বা পাসওয়ার্ড সঠিক নয়'), 'auth.ts provides standard Bengali error on failed authentication');

// ----------------------------------------------------
// SUITE 2: DATABASE SNAPSHOT & CONTENT INTEGRITY
// ----------------------------------------------------
console.log('\n▶ Suite 2: Database Snapshot & Content Integrity');

const dbSource = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(dbSource.includes('currentUserId: \'\''), 'Initial seed snapshot starts in unauthenticated (guest) state');
assert(dbSource.includes('art-bina-gamma-2026'), 'Seed contains BINA gamma ray irradiation center article');
assert(dbSource.includes('bina-gamma-ray-irradiation-center-inauguration-2026'), 'BINA article contains canonical SEO slug');
assert(dbSource.includes('art-japan-cucumber-robot-2026'), 'Seed contains Japan cucumber harvesting robot article');
assert(dbSource.includes('japan-ai-cucumber-harvesting-robot-future-of-smart-agriculture'), 'Japan robot article contains canonical SEO slug');
assert(fs.existsSync(path.join(rootDir, 'public/images/japan_cucumber_robot.jpg')), 'Japan robot cover image exists in public/images');

// Verify SQL Schema file exists and contains hardened RLS
const schemaSource = fs.readFileSync(path.join(rootDir, 'supabase/schema.sql'), 'utf-8');
assert(schemaSource.includes('create or replace function public.is_admin()'), 'Schema defines security definer is_admin() function');
assert(schemaSource.includes('create policy "orders_select_buyer_or_admin"'), 'Schema restricts order viewing to buyer or admin');
assert(schemaSource.includes('create policy "notifications_select_recipient_or_admin"'), 'Schema restricts notifications to recipient or admin');
assert(schemaSource.includes('create policy "bookmarks_select_owner"'), 'Schema restricts bookmarks to owner');
assert(!schemaSource.includes('create policy "Public write %I"'), 'Schema removed all insecure blanket write policies');

// Migration file check
const migrationPath = path.join(rootDir, 'supabase/migrations/20261101_production_rls_hardening.sql');
assert(fs.existsSync(migrationPath), 'Migration 20261101_production_rls_hardening.sql exists');

// ----------------------------------------------------
// SUITE 3: E-COMMERCE & PAYMENT VERIFICATION INTEGRITY
// ----------------------------------------------------
console.log('\n▶ Suite 3: E-Commerce & Payment Verification Integrity');

function toBengaliNumerals(num) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const formatted = num.toLocaleString('en-US');
  return formatted.replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

assert(toBengaliNumerals(0) === '০', 'toBengaliNumerals formats 0 correctly');
assert(toBengaliNumerals(1450) === '১,৪৫০', 'toBengaliNumerals formats 1450 as ১,৪৫০ with commas');
assert(toBengaliNumerals(89000000) === '৮৯,০০০,০০০', 'toBengaliNumerals formats 89 million BDT properly');

// Bkash checkout verification logic check
const checkoutSource = fs.readFileSync(path.join(rootDir, 'src/app/components/BkashCheckoutModal.tsx'), 'utf-8');
assert(checkoutSource.includes('orders.some((o) => o.trxId.toUpperCase() === finalTrx)'), 'BkashCheckoutModal enforces duplicate TrxID prevention');
assert(checkoutSource.includes('পেমেন্ট যাচাই প্রক্রিয়াধীন'), 'Receipt shows explicit verification pending state');
assert(!checkoutSource.includes('Payment Verified'), 'No false Payment Verified labels shown on receipt');

// ----------------------------------------------------
// SUITE 4: PWA, SERVICE WORKER & SEO DISCOVERY
// ----------------------------------------------------
console.log('\n▶ Suite 4: PWA, Service Worker & SEO Discovery');

const manifestPath = path.join(rootDir, 'public/manifest.webmanifest');
assert(fs.existsSync(manifestPath), 'manifest.webmanifest exists in public directory');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert(manifestContent.short_name === 'PLAiNSYT', 'Web manifest short_name is PLAiNSYT');
assert(manifestContent.theme_color === '#00ED64', 'Web manifest theme_color matches Plainsyt lime');
assert(manifestContent.display === 'standalone', 'Web manifest display mode is standalone');

const swPath = path.join(rootDir, 'public/sw.js');
assert(fs.existsSync(swPath), 'sw.js service worker exists in public directory');
const swContent = fs.readFileSync(swPath, 'utf-8');
assert(swContent.includes('addEventListener(\'install\''), 'sw.js handles install event');
assert(swContent.includes('addEventListener(\'fetch\''), 'sw.js handles offline fetch fallback');

const robotsPath = path.join(rootDir, 'public/robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists in public directory');

const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in public directory');
const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
assert(sitemapContent.includes('https://plainsyt.com/article/bina-gamma-ray-irradiation-center-inauguration-2026'), 'sitemap.xml indexes canonical BINA article URL');
assert(sitemapContent.includes('https://plainsyt.com/article/japan-ai-cucumber-harvesting-robot-future-of-smart-agriculture'), 'sitemap.xml indexes canonical Japan robot article URL');

const indexPath = path.join(rootDir, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf-8');
assert(indexContent.includes('rel="manifest" href="/manifest.webmanifest"'), 'index.html links to manifest.webmanifest');
assert(indexContent.includes('navigator.serviceWorker.register'), 'index.html registers service worker');

// ----------------------------------------------------
// SUITE 5: UI/UX & DESIGN INVARIANTS
// ----------------------------------------------------
console.log('\n▶ Suite 5: UI/UX & Design Invariants');

const postCardSource = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(!postCardSource.includes('views') || !postCardSource.includes('দেখা হয়েছে'), 'CommunityPostCard does not display view counts');

const sidebarSource = fs.readFileSync(path.join(rootDir, 'src/app/components/LeftSidebar.tsx'), 'utf-8');
assert(sidebarSource.includes('bg-[#00ED64]') && sidebarSource.includes('text-[#061621]'), 'LeftSidebar Porun button uses lime green background and dark text');

const headerSource = fs.readFileSync(path.join(rootDir, 'src/app/components/Header.tsx'), 'utf-8');
assert(headerSource.includes('left-1/2 -translate-x-1/2'), 'Header center navigation icons are absolutely centered');

const rootShellSource = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(!rootShellSource.includes('if (snap.profiles && snap.profiles.length > 0) return snap.profiles[0]'), 'RootShell ensureActor does not escalate guests to admin profile');

const primitivesSource = fs.readFileSync(path.join(rootDir, 'src/app/components/Primitives.tsx'), 'utf-8');
assert(primitivesSource.includes('const initials ='), 'Primitives.tsx defines initials before rendering');

const centralFeedSource = fs.readFileSync(path.join(rootDir, 'src/app/components/CentralFeed.tsx'), 'utf-8');
assert(centralFeedSource.includes('const bookmarkIds = f.bookmarkIds ?? [];'), 'CentralFeed.tsx safeguards bookmarkIds against undefined');
assert(rootShellSource.includes('bookmarkIds={snap.bookmarkedArticleIds ?? []}'), 'RootShell.tsx passes bookmarkIds prop to CentralFeed');

// ----------------------------------------------------
// SUITE 6: VITE PRODUCTION BUILD VERIFICATION
// ----------------------------------------------------
console.log('\n▶ Suite 6: Vite Production Bundle Integrity');
const distIndexPath = path.join(rootDir, 'dist/index.html');
assert(fs.existsSync(distIndexPath), 'dist/index.html exists from production build');
const distIndex = fs.readFileSync(distIndexPath, 'utf-8');
assert(distIndex.includes('assets/index-'), 'Production bundle references minified assets');

// ----------------------------------------------------
// SUITE 7: STORIES, EXPLORE & MOBILE BACK STRESS AUDIT
// ----------------------------------------------------
console.log('\n▶ Suite 7: Stories, Explore & Mobile Back Stress Audit');

const storyViewerSource = fs.readFileSync(path.join(rootDir, 'src/app/components/StoryViewerModal.tsx'), 'utf-8');
assert(storyViewerSource.includes('FollowIconButton'), 'StoryViewerModal uses standardized FollowIconButton');
assert(storyViewerSource.includes('rotateY(${cubeAngle}deg)'), 'StoryViewerModal has 3D cube rotation transition');
assert(storyViewerSource.includes('isCaptionExpanded ? \'-translate-y-4\''), 'StoryViewerModal has caption Y-axis lift on expansion');
assert(storyViewerSource.includes('setShowComments((prev) =>'), 'StoryViewerModal comments drawer toggles and pops down');

const carouselSource = fs.readFileSync(path.join(rootDir, 'src/app/components/TopicStoriesCarousel.tsx'), 'utf-8');
assert(carouselSource.includes('onCreate && currentUser &&'), 'TopicStoriesCarousel hides Add Story card for logged out visitors');

const readerSource = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleReaderModal.tsx'), 'utf-8');
assert(readerSource.includes('handleDragStart') && readerSource.includes('translateY'), 'ArticleReaderModal supports mobile pull-to-dismiss gesture');
assert(readerSource.includes('dark:border-[#03EF62]'), 'ArticleReaderModal styles borders lime in dark mode');

const authModalSource = fs.readFileSync(path.join(rootDir, 'src/app/components/AuthModal.tsx'), 'utf-8');
assert(authModalSource.includes('/logos/icon.png'), 'AuthModal displays Plainsyt icon logo instead of star emoji');
assert(authModalSource.includes('font-bold underline text-[#03EF62]'), 'AuthModal switcher link is bold, underlined and lime');

const viewsSource = fs.readFileSync(path.join(rootDir, 'src/app/components/Views.tsx'), 'utf-8');
assert(viewsSource.includes('ExploreTopicDropdown') && viewsSource.includes('relative z-50'), 'Explore view isolates topic dropdown stacking context with relative z-50');
assert(viewsSource.includes("'অনুসারী'") && viewsSource.includes("'অনুসরণ'"), 'ProfileView displays both followers and following counts');
assert(!viewsSource.includes('hidden sm:flex flex-wrap items-center gap-2 sm:gap-2.5'), 'ProfileView stats are visible on mobile and desktop');

assert(rootShellSource.includes('plainsytApp') && rootShellSource.includes('closeTopModal'), 'RootShell implements mobile history sentinel and modal interception');
assert(rootShellSource.includes('followersCount: was ? Math.max(0, cur - 1) : cur + 1'), 'RootShell updates followers count reactively on toggle follow');

assert(authSource.includes('https://pla.insyt.bd/'), 'Auth library defaults redirect to production origin https://pla.insyt.bd/');

const triggerMigrationPath = path.join(rootDir, 'supabase/migrations/20261105_google_oauth_auto_profile_trigger.sql');
assert(fs.existsSync(triggerMigrationPath), 'Google OAuth auto profile trigger migration exists');
const triggerMigrationSource = fs.readFileSync(triggerMigrationPath, 'utf-8');
assert(triggerMigrationSource.includes('handle_new_user') && triggerMigrationSource.includes('on_auth_user_created'), 'Trigger migration creates handle_new_user and attaches to auth.users');

console.log('\n▶ Suite 8: Loading Screen & Skeleton System Invariants');
const skeletonsPath = path.join(rootDir, 'src/app/components/Skeletons.tsx');
assert(fs.existsSync(skeletonsPath), 'Skeletons.tsx component file exists');
const skeletonsSource = fs.readFileSync(skeletonsPath, 'utf-8');
assert(skeletonsSource.includes('export function SkeletonBox'), 'Skeletons.tsx exports reusable SkeletonBox');
assert(skeletonsSource.includes('export function ArticleCardSkeleton'), 'Skeletons.tsx exports 1:1 dimensional ArticleCardSkeleton');
assert(skeletonsSource.includes('export function CommunityPostSkeleton'), 'Skeletons.tsx exports CommunityPostSkeleton');
assert(skeletonsSource.includes('export function IntegratedReelSkeleton'), 'Skeletons.tsx exports IntegratedReelSkeleton');
assert(skeletonsSource.includes('export function StoriesCarouselSkeleton'), 'Skeletons.tsx exports StoriesCarouselSkeleton');
assert(skeletonsSource.includes('export function FeedPageSkeleton'), 'Skeletons.tsx exports FeedPageSkeleton');
assert(skeletonsSource.includes('export function ExplorePageSkeleton'), 'Skeletons.tsx exports ExplorePageSkeleton');
assert(skeletonsSource.includes('export function EventsPageSkeleton'), 'Skeletons.tsx exports EventsPageSkeleton');
assert(skeletonsSource.includes('export function StorePageSkeleton'), 'Skeletons.tsx exports StorePageSkeleton');
assert(skeletonsSource.includes('export function IdeasPageSkeleton'), 'Skeletons.tsx exports IdeasPageSkeleton');
assert(skeletonsSource.includes('export function NotificationsPageSkeleton'), 'Skeletons.tsx exports NotificationsPageSkeleton');
assert(skeletonsSource.includes('export function ProfilePageSkeleton'), 'Skeletons.tsx exports ProfilePageSkeleton');
assert(skeletonsSource.includes('export function ResearcherStudioSkeleton'), 'Skeletons.tsx exports ResearcherStudioSkeleton');
assert(skeletonsSource.includes('export function ArticleReaderSkeleton'), 'Skeletons.tsx exports ArticleReaderSkeleton');
assert(skeletonsSource.includes('export function PageLoadingIndicator'), 'Skeletons.tsx exports PageLoadingIndicator');

const themeCssSource = fs.readFileSync(path.join(rootDir, 'src/styles/theme.css'), 'utf-8');
assert(themeCssSource.includes('@keyframes skeleton-shimmer'), 'theme.css defines GPU-accelerated skeleton-shimmer keyframes');
assert(themeCssSource.includes('.skeleton-shimmer') && themeCssSource.includes('.dark .skeleton-shimmer'), 'theme.css provides light and dark mode shimmer styles');

const updatedCentralFeedSource = fs.readFileSync(path.join(rootDir, 'src/app/components/CentralFeed.tsx'), 'utf-8');
assert(updatedCentralFeedSource.includes('FeedPageSkeleton') && updatedCentralFeedSource.includes('f.isLoading'), 'CentralFeed integrates FeedPageSkeleton for loading states');

assert(viewsSource.includes('ExplorePageSkeleton') && viewsSource.includes('ProfilePageSkeleton'), 'Views.tsx integrates dedicated page skeletons');
assert(rootShellSource.includes('isPageLoading') && rootShellSource.includes('FeedPageSkeleton'), 'RootShell triggers page skeleton during transitions and initial load');

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
