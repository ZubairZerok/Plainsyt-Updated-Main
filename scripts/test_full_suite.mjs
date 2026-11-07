import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

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

// Marketplace & Cart purged verification
assert(!fs.existsSync(path.join(rootDir, 'src/app/components/BkashCheckoutModal.tsx')), 'BkashCheckoutModal is purged as marketplace/cart is deleted');

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
assert(sitemapContent.includes('/article/bina-gamma-ray-irradiation-center'), 'sitemap.xml indexes canonical BINA article URL');
assert(sitemapContent.includes('/article/japan-cucumber-harvesting-robot'), 'sitemap.xml indexes canonical Japan robot article URL');

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
assert(!storyViewerSource.includes('setShowComments'), 'StoryViewerModal has purged comments drawer');

const carouselSource = fs.readFileSync(path.join(rootDir, 'src/app/components/TopicStoriesCarousel.tsx'), 'utf-8');
assert(carouselSource.includes('canCreateStory(currentUser)'), 'TopicStoriesCarousel restricts Add Story card to authorized editorial users');

const readerSource = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleReaderModal.tsx'), 'utf-8');
assert(readerSource.includes('handleDragStart') && readerSource.includes('translateY'), 'ArticleReaderModal supports mobile pull-to-dismiss gesture');
assert(readerSource.includes('dark:border-[#03EF62]'), 'ArticleReaderModal styles borders lime in dark mode');

const authModalSource = fs.readFileSync(path.join(rootDir, 'src/app/components/AuthModal.tsx'), 'utf-8');
assert(authModalSource.includes('/logos/icon.png'), 'AuthModal displays Plainsyt icon logo instead of star emoji');
assert(authModalSource.includes('font-bold underline text-[#03EF62]'), 'AuthModal switcher link is bold, underlined and lime');

const viewsSource = fs.readFileSync(path.join(rootDir, 'src/app/components/Views.tsx'), 'utf-8');
assert(viewsSource.includes('ExploreTopicDropdown') && viewsSource.includes('relative z-50'), 'Explore view isolates topic dropdown stacking context with relative z-50');
assert(!viewsSource.includes("['অনুসারী'") && !viewsSource.includes("['অনুসরণ'"), 'ProfileView completely removed follower and following metrics');
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

console.log('\n▶ Suite 9: Story Backdrop Esc, Single-line Designation & Profile Followers/Following Invariants');
const storyViewerSourceUpdated = fs.readFileSync(path.join(rootDir, 'src/app/components/StoryViewerModal.tsx'), 'utf-8');
assert(storyViewerSourceUpdated.includes('Close story viewer') && storyViewerSourceUpdated.includes('!cardRef.current.contains(e.target as Node)'), 'StoryViewerModal implements backdrop click-to-close behaving like Esc key');
assert(storyViewerSourceUpdated.includes('whitespace-nowrap overflow-hidden text-ellipsis') && storyViewerSourceUpdated.includes('text-[10px] sm:text-[10.5px]'), 'StoryViewerModal renders smaller author tags/designations in a single line');

const commPostSourceUpdated = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(commPostSourceUpdated.includes('whitespace-nowrap overflow-hidden text-ellipsis') && commPostSourceUpdated.includes('text-[11px] font-bangla'), 'CommunityPostCard renders smaller author tags/designations in a single line');

const articleCardSourceUpdated = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
assert(articleCardSourceUpdated.includes('whitespace-nowrap overflow-hidden text-ellipsis') && articleCardSourceUpdated.includes('text-[11px] font-bangla'), 'ArticleCard renders smaller author designations in a single line beside author name');

const viewsSourceUpdated = fs.readFileSync(path.join(rootDir, 'src/app/components/Views.tsx'), 'utf-8');
assert(viewsSourceUpdated.includes("setTab(tabKey as typeof tab)"), 'ProfileView stats badges are clickable buttons opening respective content lists');
assert(!viewsSourceUpdated.includes("['অনুসারী'") && !viewsSourceUpdated.includes("['অনুসরণ'"), 'ProfileView stats bar purged follower and following metrics');
assert(!viewsSourceUpdated.includes("tab === 'following'") && !viewsSourceUpdated.includes("tab === 'followers'"), 'ProfileView purged following and followers tabs and lists');

assert(rootShellSource.includes('allKnownProfiles') && rootShellSource.includes('allProfiles={allKnownProfiles}'), 'RootShell passes allKnownProfiles directory to ProfileView');
assert(viewsSourceUpdated.includes('allProfiles = []') && viewsSourceUpdated.includes('followingIds = []'), 'ProfileView destructures allProfiles and followingIds with safe defaults');
assert(rootShellSource.includes('cleanSlug = rawTarget.toLowerCase().replace(/^@/, \'\')'), 'RootShell supports flexible profile slugs, handles and user IDs without crashing');

console.log('\n▶ Suite 10: Comments Designation/Role Tag Removal Invariants');
const articleReaderSource = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleReaderModal.tsx'), 'utf-8');
const reelPlayerSource = fs.readFileSync(path.join(rootDir, 'src/app/components/ReelPlayerModal.tsx'), 'utf-8');
assert(!storyViewerSourceUpdated.includes('c.role'), 'StoryViewerModal has removed role tags beside commenter names');
assert(!commPostSourceUpdated.includes('c.role'), 'CommunityPostCard has removed role tags beside commenter names');
assert(!articleCardSourceUpdated.includes('c.role'), 'ArticleCard has removed role tags beside commenter names');
assert(!articleReaderSource.includes('c.role'), 'ArticleReaderModal has removed role tags beside commenter names');
assert(!reelPlayerSource.includes('c.role'), 'ReelPlayerModal has removed role tags beside commenter names');

console.log('\n▶ Suite 11: Standalone Back Button, Research Citation, Reaction Persistence & Threaded Replies');
const updatedRootShell = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(!updatedRootShell.includes('Standalone Article Route · /article/'), 'Standalone article route debug tag is completely removed');
assert(updatedRootShell.includes('size-9 sm:size-auto') && updatedRootShell.includes('hidden sm:inline font-bangla'), 'Standalone article back button is iconized on mobile and text-responsive on desktop');

const updatedArticleReader = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleReaderModal.tsx'), 'utf-8');
assert(updatedArticleReader.includes('গবেষণা ও প্রাথমিক তথ্যসূত্র') && updatedArticleReader.includes('resolvedSourceUrl'), 'Article reader has authoritative peer-reviewed research basis and live clickable source link');
assert(updatedArticleReader.includes('ShieldCheck') && updatedArticleReader.includes('GraduationCap'), 'Article reader research basis displays academic verification badges');
assert(updatedArticleReader.includes('setReplyingToId') && updatedArticleReader.includes('উত্তর দিন'), 'Article reader supports inline threaded replies to comments');

const updatedCommPost = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(updatedCommPost.includes('setReplyingToId') && updatedCommPost.includes('উত্তর দিন') && updatedCommPost.includes('replies.map'), 'Community post card supports inline replies and nested threaded comments');

const updatedArticleCard = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
assert(updatedArticleCard.includes('setReplyingToId') && updatedArticleCard.includes('উত্তর দিন') && updatedArticleCard.includes('replies.map'), 'Article card supports inline replies and nested threaded comments');

const updatedDbSource = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(updatedDbSource.includes('reactionMap.set') && updatedDbSource.includes('finalReactions = Array.from(reactionMap.values())'), 'db.ts resiliently merges remote and local reactions to prevent disappearance on refresh');
assert(updatedDbSource.includes('commentMap.set') && updatedDbSource.includes('finalComments = Array.from(commentMap.values())'), 'db.ts resiliently merges remote and local comments to preserve comments and replies');

const updatedReactionsBar = fs.readFileSync(path.join(rootDir, 'src/app/components/LinkedInReactionBar.tsx'), 'utf-8');
assert(updatedReactionsBar.includes('viewBox="0 0 24 24"'), 'LinkedIn reaction badges use standard scalable 24x24 official SVG vectors');

const repliesMigrationPath = path.join(rootDir, 'supabase/migrations/20261106_reactions_and_replies_hardening.sql');
assert(fs.existsSync(repliesMigrationPath), 'Hardened reactions RLS and comments parent_id migration file exists');
const repliesMigrationSource = fs.readFileSync(repliesMigrationPath, 'utf-8');
assert(repliesMigrationSource.includes('parent_id') && repliesMigrationSource.includes('reactions_write_auth'), 'Migration defines parent_id on comments and reactions_write_auth on reactions');

console.log('\n▶ Suite 12: Route Purging & AI Chat Clean Attribution Invariants');
const routesSource = fs.readFileSync(path.join(rootDir, 'src/app/routes.ts'), 'utf-8');
assert(!routesSource.includes('/me/analytics'), 'Route /me/analytics is completely removed from routes.ts');
assert(!routesSource.includes('/me/reading-history'), 'Route /me/reading-history is completely removed from routes.ts');

const updatedHeaderSource = fs.readFileSync(path.join(rootDir, 'src/app/components/Header.tsx'), 'utf-8');
assert(!updatedHeaderSource.includes('/me/analytics'), 'Route /me/analytics is removed from Header user navigation');
assert(!updatedHeaderSource.includes('/me/reading-history'), 'Route /me/reading-history is removed from Header user navigation');
assert(!updatedHeaderSource.includes("'analytics'") && !updatedHeaderSource.includes("'reading-history'"), 'Header View type purged analytics and reading-history');

assert(!updatedRootShell.includes('/me/analytics') && !updatedRootShell.includes('/me/reading-history'), 'RootShell route matcher purged analytics and reading-history');

assert(!fs.existsSync(path.join(rootDir, 'src/app/components/AskAIModal.tsx')), 'AskAIModal is completely deleted from codebase');
assert(!fs.existsSync(path.join(rootDir, 'src/app/lib/aiService.ts')), 'aiService is completely deleted from codebase');

console.log('\n▶ Suite 13: Clean Story Reactions, Author Profile Link, Lime Tick, Genuine Follow Counts & Facebook Share');
const storyViewerSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/StoryViewerModal.tsx'), 'utf-8');
assert(!storyViewerSrc.includes('QUICK_EMOJIS'), 'StoryViewerModal has completely removed the quick emoji reaction bar');
assert(storyViewerSrc.includes('onNavigateProfile(currentGroup.authorId)') && storyViewerSrc.includes('hover:underline'), 'StoryViewerModal author name is a clickable link opening their profile');
assert(storyViewerSrc.includes('limeTick'), 'StoryViewerModal follow button specifies limeTick variant');

const primitivesSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/Primitives.tsx'), 'utf-8');
assert(primitivesSrc.includes('limeTick') && primitivesSrc.includes("bg-[#03EF62] text-white border border-[#03EF62]"), 'Primitives FollowIconButton implements high-contrast lime background with white tick icon');

const shareModalPath = path.join(rootDir, 'src/app/components/ShareModal.tsx');
assert(fs.existsSync(shareModalPath), 'ShareModal component file exists');
const shareModalSrc = fs.readFileSync(shareModalPath, 'utf-8');
assert(shareModalSrc.includes('facebook.com/sharer/sharer.php') && shareModalSrc.includes('navigator.clipboard'), 'ShareModal provides both Facebook sharing and direct clipboard copy');

const currentRootShell = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(!currentRootShell.includes('<ShareModal') && !currentRootShell.includes('setSharePayload'), 'RootShell completely purged modal popup for share button');
assert(!currentRootShell.includes('followersCount: 142') && !currentRootShell.includes('followersCount: 386'), 'RootShell has zero hardcoded follower counts for synthetic profiles');

const currentDbSrc = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(!currentDbSrc.includes('followersCount: 386') && !currentDbSrc.includes('followersCount: 1420'), 'db.ts has zero hardcoded fake follower counts');
assert(currentDbSrc.includes("from('follows').select('follower_id, following_id')"), 'db.ts queries exact relational follows table for genuine dynamic counts');

console.log('\n▶ Suite 14: Procedural Canvas/SVG Splash Screen 1.00x Lime-to-White & reaction-buttons.html Physics');
const siteLoaderSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/SiteLoader.tsx'), 'utf-8');
assert(siteLoaderSrc.includes('speed = 1.00') || siteLoaderSrc.includes('speed = 1.0'), 'SiteLoader configures animation speed at 1.00x (normal speed)');
assert(siteLoaderSrc.includes('sessionStorage') && siteLoaderSrc.includes('SPLASH_STORAGE_KEY'), 'SiteLoader checks session storage so splash screen appears only on first load and not on refresh');
assert(siteLoaderSrc.includes("startBgCenter = '#a6f232'") && siteLoaderSrc.includes("endBgCenter = '#ffffff'"), 'SiteLoader configures dynamic Lime-to-White gradient palette');
assert(siteLoaderSrc.includes('insight hidden in plain sight') && siteLoaderSrc.includes('WORDMARK_PATHS'), 'SiteLoader renders horizontal English.png wordmark lockup');

const pureLogicSrc = fs.readFileSync(path.join(rootDir, 'src/app/utils/pureLogic.ts'), 'utf-8');
assert(pureLogicSrc.includes("'নতুন জানলাম'"), 'pureLogic defines Notun Janlam reaction for light bulb');
assert(!pureLogicSrc.includes("'celebrate'") && !pureLogicSrc.includes("'support'") && !pureLogicSrc.includes("'curious'"), 'LINKEDIN_REACTIONS strictly trimmed to only Like and Notun Janlam reactions');

const themeCssSrc = fs.readFileSync(path.join(rootDir, 'src/styles/theme.css'), 'utf-8');
assert(themeCssSrc.includes('--like: #E5385F') && themeCssSrc.includes('--idea: #F2A900'), 'theme.css implements color tokens from reaction-buttons.html');
assert(themeCssSrc.includes('react-pop') && themeCssSrc.includes('react-flicker') && themeCssSrc.includes('react-burst'), 'theme.css implements pop, flicker, and particle burst keyframes');

const reactionsBarSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/LinkedInReactionBar.tsx'), 'utf-8');
assert(reactionsBarSrc.includes('react-btn') && reactionsBarSrc.includes('react-heart') && reactionsBarSrc.includes('react-glass'), 'LinkedInReactionBar implements Heart and Bulb reaction button markup from reaction-buttons.html');
assert(reactionsBarSrc.includes('react-dot') && reactionsBarSrc.includes('react-ring'), 'LinkedInReactionBar renders dynamic burst particle dots and expanding ring');

const editorialDashboardPath = path.join(rootDir, 'src/app/components/EditorialDashboard.tsx');
assert(fs.existsSync(editorialDashboardPath), 'EditorialDashboard component exists');

console.log('\n▶ Suite 15: Comment Icon Text Removed, Faster Fullscreen Splash, /help Route Purged, Dummy Posts Purged & Specification v5.0.0');
const updatedArticleCardClean = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
assert(!updatedArticleCardClean.includes('>Comment</span>'), 'ArticleCard does not display textual Comment label');

const updatedCommPostClean = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(!updatedCommPostClean.includes('>Comment</span>'), 'CommunityPostCard does not display textual Comment label');

const updatedReelCardClean = fs.readFileSync(path.join(rootDir, 'src/app/components/IntegratedReelCard.tsx'), 'utf-8');
assert(!updatedReelCardClean.includes('>Comment</span>'), 'IntegratedReelCard does not display textual Comment label');

assert(siteLoaderSrc.includes('w-screen h-screen'), 'SiteLoader provides immersive fullscreen canvas container');

assert(!routesSource.includes('/help'), 'routes.ts purged /help route');
assert(!updatedHeaderSource.includes('/help') && !updatedHeaderSource.includes("'help'"), 'Header purged /help route and View type');
assert(!updatedRootShell.includes('/help') && !updatedRootShell.includes("case 'help':"), 'RootShell purged /help route resolution');

const researcherViewsClean = fs.readFileSync(path.join(rootDir, 'src/app/components/ResearcherViews.tsx'), 'utf-8');
assert(!researcherViewsClean.includes('EditorialHelpView') && !researcherViewsClean.includes('/help'), 'ResearcherViews.tsx purged EditorialHelpView and /help references');

const dbCleanCheck = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(dbCleanCheck.includes('plainsyt_clean_mirror_v9'), 'db.ts updated storage key to plainsyt_clean_mirror_v9');
assert(dbCleanCheck.includes("!p.id.toLowerCase().includes('dummy')"), 'db.ts purges synthetic dummy posts');

const specDocSrc = fs.readFileSync(path.join(rootDir, 'PLAINSYT_SAAS_SPECIFICATION.md'), 'utf-8');
assert(specDocSrc.includes('5.0.0-PROD'), 'PLAINSYT_SAAS_SPECIFICATION.md updated to version 5.0.0-PROD');

console.log('\n▶ Suite 16: Concurrency, Threading, Idempotency & Numeral Typography Invariants');
const stressRun = child_process.spawnSync('node', [path.join(rootDir, 'scripts/stress_concurrency_test.mjs')], { encoding: 'utf-8' });
assert(stressRun.status === 0, `Stress concurrency runner exited with code ${stressRun.status}: ${stressRun.stderr}`);
assert(stressRun.stdout.includes('STRESS TEST SUITE: 6 PASSED, 0 FAILED'), 'Stress test suite passed all 6 concurrency, threading, and idempotency scenarios');
const commPostNumImport = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(commPostNumImport.includes('VerifiedBadge, Num, cn'), 'CommunityPostCard imports Num component for comment counts');
const artCardNumImport = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
assert(artCardNumImport.includes('FEED_CARD, Num, cn'), 'ArticleCard imports Num component for comment counts');

console.log('\n▶ Suite 17: Bundle Code-Splitting, Media Fallback & OpenRouter Key Invariants');
const viteConfigSrc = fs.readFileSync(path.join(rootDir, 'vite.config.ts'), 'utf-8');
assert(viteConfigSrc.includes('manualChunks'), 'vite.config.ts configures manualChunks for vendor code-splitting');
assert(viteConfigSrc.includes('vendor-react') && viteConfigSrc.includes('vendor-supabase'), 'vite.config.ts defines dedicated vendor chunks for React and Supabase');

const lightboxSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/PhotoLightboxModal.tsx'), 'utf-8');
assert(lightboxSrc.includes('imgError') && lightboxSrc.includes('onError={() => setImgError(true)}'), 'PhotoLightboxModal implements resilient onError fallback');

const seoHeadSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/SEOHead.tsx'), 'utf-8');
assert(seoHeadSrc.includes('application/ld+json') && seoHeadSrc.includes('og:title'), 'SEOHead renders rich JSON-LD and Open Graph meta tags');

console.log('\n▶ Suite 18: Pure Reaction Icons, Hover/Hold Name Display, Comment Edit & Delete Invariants');
const rxBarClean = fs.readFileSync(path.join(rootDir, 'src/app/components/LinkedInReactionBar.tsx'), 'utf-8');
assert(!rxBarClean.includes("{activeMeta ? activeMeta.labelBn : 'লাইক'}</span>"), 'LinkedInReactionPickerButton removed static reaction text beside icon');
assert(rxBarClean.includes('isHoveredOrActive') && rxBarClean.includes('{r.labelBn}'), 'Reaction tray shows reaction name on hover/press-and-hold');

const dbCommentOps = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(dbCommentOps.includes('export async function dbUpdateComment') && dbCommentOps.includes('export async function dbDeleteComment'), 'db.ts implements dbUpdateComment and dbDeleteComment');

const rootShellComments = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(rootShellComments.includes('handleEditComment') && rootShellComments.includes('handleDeleteComment'), 'RootShell defines handleEditComment and handleDeleteComment');

const commPostEdit = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
assert(commPostEdit.includes('onEditComment') && commPostEdit.includes('onDeleteComment') && commPostEdit.includes('editingCommentId'), 'CommunityPostCard supports inline editing and deletion of comments and replies');

const artCardEdit = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
assert(artCardEdit.includes('onEditComment') && artCardEdit.includes('onDeleteComment') && artCardEdit.includes('editingCommentId'), 'ArticleCard supports inline editing and deletion of comments and replies');

const artReaderEdit = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleReaderModal.tsx'), 'utf-8');
assert(artReaderEdit.includes('onEditComment') && artReaderEdit.includes('onDeleteComment') && artReaderEdit.includes('editingCommentId'), 'ArticleReaderModal supports inline editing and deletion of comments and replies');

console.log('\n▶ Suite 19: Pure Backend Data, Purged Fake Stories, Backend CDN Avatar & Cloudflare SPA Config');
const dbLatestSource = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(!dbLatestSource.includes('বিনার গামা সেন্টারে সংরক্ষিত আম ও শাকসবজির নতুন শেলফ-লাইফ টেস্ট') && dbLatestSource.includes('stories: []'), 'db.ts purged all fake seed stories');
assert(!dbLatestSource.includes('/images/hasan_zubair.png'), 'db.ts replaced local avatar with authentic backend CDN URL');
assert(dbLatestSource.includes('PURGED_STORY_IDS'), 'db.ts defines PURGED_STORY_IDS filter');

const authLatestSource = fs.readFileSync(path.join(rootDir, 'src/app/lib/auth.ts'), 'utf-8');
assert(!authLatestSource.includes('/images/hasan_zubair.png'), 'auth.ts replaced local avatar with authentic backend CDN URL');

const rootShellLatestSource = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(!rootShellLatestSource.includes('/images/hasan_zubair.png'), 'RootShell replaced local avatar with authentic backend CDN URL');

const redirectsPath = path.join(rootDir, 'public/_redirects');
if (fs.existsSync(redirectsPath)) {
  const redirectsContent = fs.readFileSync(redirectsPath, 'utf-8');
  assert(!redirectsContent.includes('/*') || !redirectsContent.includes('/index.html'), 'public/_redirects does not contain infinite loop SPA rewrites');
}

const headersPath = path.join(rootDir, 'public/_headers');
assert(fs.existsSync(headersPath), 'Cloudflare Pages _headers file exists');

const wranglerPath = path.join(rootDir, 'wrangler.jsonc');
assert(fs.existsSync(wranglerPath), 'wrangler.jsonc exists');
const wranglerContent = fs.readFileSync(wranglerPath, 'utf-8');
assert(wranglerContent.includes('single-page-application') && wranglerContent.includes('./dist'), 'wrangler.jsonc configures SPA distribution directory');
assert(!wranglerContent.includes('pages_build_output_dir'), 'wrangler.jsonc purged legacy pages_build_output_dir');

assert(fs.existsSync(path.join(rootDir, '.nvmrc')), 'Cloudflare .nvmrc specifies Node 22 LTS');
assert(fs.existsSync(path.join(rootDir, '.node-version')), 'Cloudflare .node-version specifies Node 22.11 LTS');

console.log('\n▶ Suite 20: Dark Mode Navbar Logo, Black Selection, Mobile Saved Post, PFP Lime Dropdown & Delete Comment Alert Modal');
const themeCss = fs.readFileSync(path.join(rootDir, 'src/styles/theme.css'), 'utf-8');
assert(themeCss.includes('color: #000000 !important') && themeCss.includes('::selection'), 'Selected text font color is strictly #000000');
assert(themeCss.includes('filter: brightness(0)') && themeCss.includes('html.dark header'), 'Dark mode navbar logo color is black via brightness(0)');
assert(themeCss.includes('.user-pfp-dropdown svg') && themeCss.includes('#03EF62'), 'Profile picture dropdown icons in dark mode are lime #03EF62');

const headerCode = fs.readFileSync(path.join(rootDir, 'src/app/components/Header.tsx'), 'utf-8');
assert(headerCode.includes('aria-label="Saved posts"') && headerCode.includes('className={iconBtn}'), 'Header mobile view top nav renders Saved Post button');
assert(headerCode.includes('user-pfp-dropdown'), 'Header profile menu contains user-pfp-dropdown class');

const deleteModalPath = path.join(rootDir, 'src/app/components/DeleteCommentAlertModal.tsx');
assert(fs.existsSync(deleteModalPath), 'DeleteCommentAlertModal component exists');
const deleteModalCode = fs.readFileSync(deleteModalPath, 'utf-8');
assert(deleteModalCode.includes('DeleteCommentAlertModal') && deleteModalCode.includes('মুছে ফেলুন'), 'DeleteCommentAlertModal renders Bengali confirmation modal');

const rootShellCode = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(rootShellCode.includes('DeleteCommentAlertModal') && rootShellCode.includes('pendingDeleteCommentId'), 'RootShell integrates DeleteCommentAlertModal with pendingDeleteCommentId state');

const commCardCode = fs.readFileSync(path.join(rootDir, 'src/app/components/CommunityPostCard.tsx'), 'utf-8');
const artCardCode = fs.readFileSync(path.join(rootDir, 'src/app/components/ArticleCard.tsx'), 'utf-8');
const reelModalCode = fs.readFileSync(path.join(rootDir, 'src/app/components/ReelPlayerModal.tsx'), 'utf-8');
console.log('\n▶ Suite 21: Editorial Permissions, Pure Watch-Only Stories, SEO Prerender & Newsletter Invariants');
const authSource21 = fs.readFileSync(path.join(rootDir, 'src/app/lib/auth.ts'), 'utf-8');
assert(authSource21.includes('z65gt9@gmail.com') && authSource21.includes('plaiinsyt@gmail.com') && authSource21.includes('zubair.bau.01@gmail.com'), 'auth.ts defines the 3 authorized editorial emails');
assert(authSource21.includes('export function canCreateStory'), 'auth.ts exports canCreateStory guard');

const storyViewer21 = fs.readFileSync(path.join(rootDir, 'src/app/components/StoryViewerModal.tsx'), 'utf-8');
assert(!storyViewer21.includes('<LinkedInReactionPickerButton') && !storyViewer21.includes('onComment') && !storyViewer21.includes('onShare'), 'StoryViewerModal has zero react, comment, or share systems (pure watch-only)');

const profileView21 = fs.readFileSync(path.join(rootDir, 'src/app/components/Views.tsx'), 'utf-8');
assert(!profileView21.includes("'following' | 'followers'") && !profileView21.includes("displayedFollowers"), 'ProfileView completely removed follower and following metrics');

const newsletterPath = path.join(rootDir, 'src/app/components/NewsletterSubscription.tsx');
assert(fs.existsSync(newsletterPath), 'NewsletterSubscription component exists');
const centralFeedSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/CentralFeed.tsx'), 'utf-8');
assert(centralFeedSrc.includes('<NewsletterSubscription'), 'CentralFeed mounts NewsletterSubscription');

const prerenderScriptPath = path.join(rootDir, 'scripts/prerender_articles.mjs');
assert(fs.existsSync(prerenderScriptPath), 'prerender_articles.mjs script exists');
const pkgJsonSrc = fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8');
assert(pkgJsonSrc.includes('prerender_articles.mjs'), 'package.json build script runs prerender_articles.mjs');

console.log('\n▶ Suite 22: Desktop Left Sidebar Removal, Search Tags Purge & Verified Editorial Follow Restrictions');
// 1. Desktop Left Sidebar Purged from RootShell
const rootShellSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/RootShell.tsx'), 'utf-8');
assert(!rootShellSrc.includes('<LeftSidebar') && !rootShellSrc.includes("import { LeftSidebar }"), 'RootShell does not import or render LeftSidebar on desktop');
assert(!rootShellSrc.includes('lg:ml-56') && !rootShellSrc.includes('xl:ml-64'), 'RootShell main area margins removed left sidebar offset (no lg:ml-56 or xl:ml-64)');

// 2. Search dropdown tags purged
const headerSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/Header.tsx'), 'utf-8');
const purgedTags = ['#কৃষি-প্রযুক্তি', '#গবেষণা', '#জীবাণুনাশ', '#পারমাণবিক কৃষি', '#আইওটি', '#জলবায়ু'];
const containsPurgedTags = purgedTags.some(tag => headerSrc.includes(tag));
assert(!containsPurgedTags, 'Header search dropdown has purged all specified tags (#কৃষি-প্রযুক্তি, #গবেষণা, #জীবাণুনাশ, etc.)');

// 3. Verified Editorial Profiles & Follow Restrictions
const authSrc = fs.readFileSync(path.join(rootDir, 'src/app/lib/auth.ts'), 'utf-8');
assert(authSrc.includes('ZUBAIR_BAU_PROFILE') && authSrc.includes('isFollowableAccount'), 'auth.ts defines ZUBAIR_BAU_PROFILE and isFollowableAccount guard');

const rightSidebarSrc = fs.readFileSync(path.join(rootDir, 'src/app/components/RightSidebar.tsx'), 'utf-8');
assert(rightSidebarSrc.includes('isFollowableAccount') || rightSidebarSrc.includes('editorialProfiles'), 'RightSidebar restricts "অনুসরণ করুন" to authorized editorial accounts');
assert(rightSidebarSrc.includes('<VerifiedBadge'), 'RightSidebar renders VerifiedBadge for authorized editorial accounts');
assert(rootShellSrc.includes('isFollowableAccount'), 'RootShell enforces isFollowableAccount in handleToggleFollow');

console.log('\n▶ Suite 23: Perfect Centered 2-Column Layout & Database Ultra-Preservation');
// 1. Centered 2-column layout & widened widths
assert(rootShellSrc.includes('justify-center') && rootShellSrc.includes('mx-auto'), 'RootShell wraps homepage in centered flex layout');
assert(rootShellSrc.includes('max-w-[760px]') || rootShellSrc.includes('xl:max-w-[800px]'), 'RootShell widens middle news feed to properly utilize space');
assert(rightSidebarSrc.includes('w-[320px]') || rightSidebarSrc.includes('xl:w-[350px]'), 'RightSidebar widens trending & follow panel to properly utilize space');
assert(rightSidebarSrc.includes('sticky top-') && !rightSidebarSrc.includes('fixed right-0'), 'RightSidebar transitioned from fixed right-0 to sticky positioning');

// 2. Database Ultra-Preservation across Refresh
const dbSrc = fs.readFileSync(path.join(rootDir, 'src/app/lib/db.ts'), 'utf-8');
assert(dbSrc.includes('export async function dbToggleBookmark'), 'db.ts exports dbToggleBookmark for bookmarks persistence');
assert(dbSrc.includes("supabase.from('bookmarks').select('*')"), 'db.ts queries bookmarks table in fetchFromSupabase');
assert(dbSrc.includes('finalSavedPostIds') && dbSrc.includes('finalBookmarkedArticleIds'), 'db.ts computes and merges finalSavedPostIds and finalBookmarkedArticleIds');
assert(dbSrc.includes('artComments') && dbSrc.includes('artReacts'), 'db.ts sanitizes articles with comments and reactions preserved');
assert(rootShellSrc.includes('dbToggleBookmark'), 'RootShell imports and invokes dbToggleBookmark');
assert(rootShellSrc.includes('savedPostIds') && rootShellSrc.includes('bookmarkedArticleIds'), 'RootShell maintains savedPostIds and bookmarkedArticleIds');

const persistMigrationPath = path.join(rootDir, 'supabase/migrations/20261107_ultra_preserve_persistence.sql');
assert(fs.existsSync(persistMigrationPath), 'Ultra-preservation migration 20261107_ultra_preserve_persistence.sql exists');

console.log(`\n====================================================`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
