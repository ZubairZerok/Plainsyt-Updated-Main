# PLAiNSYT (প্লেইনসাইট) — Complete Enterprise Platform & SaaS Architectural Specification
> **Document Version**: 4.0.0-PROD  
> **Classification**: Production Software Design Specification & Technical Architecture Reference  
> **Target Platform**: Desktop, Tablet, Mobile Web (Progressive Web Application)  
> **Source Repository**: `hasan2104074-hue/Trying`  
> **Author & Architect**: Antigravity Core AI Team & PLAiNSYT Engineering  
> **Last Updated**: November 2026  

---

## 1. Executive Overview & Mission Statement

### 1.1 The Vision of PLAiNSYT
**PLAiNSYT (প্লেইনসাইট)** is Bangladesh's premier bilingual (Bengali & English) agro-tech editorial publication, scientific discovery engine, and specialized social knowledge-sharing ecosystem. Bridging the divide between high-level agronomy researchers (institutes such as BRRI, BARI, BINA, BAU) and grassroots agro-tech innovators, farmers, and students, PLAiNSYT functions as a full-stack media platform, research repository, community dialogue feed, and agri-commerce marketplace.

### 1.2 Core Pillars of the Platform
1. **Curated Scientific Journalism & Publishing**: Peer-reviewed and journalistic long-form articles covering nuclear agriculture, precision agronomy, post-harvest engineering, climate-resilient genetics, and sustainable farming.
2. **Community Social Feed (Agro-Network)**: Real-time microposts, photo collections, technical inquiries, and LinkedIn-style professional peer reactions.
3. **Agro-Stories & Reels Hub**: Vertical micro-learning video reels and 24-hour disappearing agricultural field stories.
4. **Agri-Tech Store & bKash Digital Commerce**: Peer-to-peer specialized farm machinery, organic inputs, biotechnology seeds, and direct-to-consumer bKash checkout with transaction verification.
5. **Open Reader Idea Board & Collaborative Innovation**: Crowdsourced problem-solving board with voting, categorization, and researcher feedback.
6. **Academic & Research Papers Repository**: Digital indexing of whitepapers, DOI links, impact metrics, and author citations.
7. **Events, Seminars & Workshops Calendar**: Real-time event registrations, seat tracking, venue maps, and calendar exports.

---

## 2. Technology Stack & Architectural Blueprint

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                 |
|  +---------------------------------------------------------------------------------+  |
|  | Vite 6.x + React 19 / 18 SPA + TypeScript 5.x + Tailwind CSS v4 / PostCSS       |  |
|  | Typography: 'Hind Siliguri' (Bengali) + 'Newsreader' / Serif + Inter / Sans     |  |
|  | Routing: React Router v7 (Data Router with RouteErrorBoundary & Lazy Fallbacks) |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
                                           |  HTTPS / WebSocket / JSON
                                           v
+---------------------------------------------------------------------------------------+
|                                SUPABASE CLOUD BACKEND                                 |
|  +--------------------+  +----------------------+  +-------------------------------+  |
|  | Supabase Auth      |  | Postgres 15+ DB      |  | Row Level Security (RLS)      |  |
|  | - Google OAuth     |  | - 13 Relational Tbls |  | - Public read on feeds        |  |
|  | - Email/Password   |  | - pg_trgm Search     |  | - Scoped write by user id     |  |
|  | - Dual Alias Map   |  | - Real-time Channels |  | - Admin overrides             |  |
|  +--------------------+  +----------------------+  +-------------------------------+  |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                              LOCAL PERSISTENCE & SYNC                                 |
|  - Storage Engine: 'plainsyt_clean_mirror_v5' (localStorage fallback)                 |
|  - Auth Session Key: 'plainsyt_auth_session_v1'                                       |
|  - Optimistic State Manager with Commit Pipeline & Server Convergence                 |
+---------------------------------------------------------------------------------------+
```

### 2.1 Frontend Engineering
- **Build Tool**: Vite 6.3.5 (ESM bundling, HMR, aggressive tree-shaking, production chunk splitting).
- **Core Runtime**: React (Functional components, custom hooks, deterministic rendering, strict prop interfaces).
- **Routing**: `react-router` v7 (`createBrowserRouter`, `RouterProvider`, dynamic segment routing `/profile/:userId`, `/article/:articleId`, `/events/:eventId`).
- **Styling Architecture**: Vanilla Tailwind CSS + Custom CSS Variables (`theme.css`). Zero Tailwind CSS runtime overhead.
- **Iconography**: `lucide-react` (SVG vectorized icons), custom SVG glyphs, and high-definition PNG brand marks.

### 2.2 Backend & Data Layer
- **Database**: Supabase PostgreSQL 15.
- **Search Capabilities**: PostgreSQL Trigram Extension (`pg_trgm`) for fuzzy Bengali and English text indexing across article titles, abstracts, and author handles.
- **Row-Level Security (RLS)**: Fine-grained security policies on all tables allowing public read access while strictly validating user identities for insert/update/delete operations.
- **Dual Email Alias Resolver**: Seamless mapping of canonical admin identities (`plaiinsyt@gmail.com` and `pl@insyt.bd`) to single authoritative `usr-plainsyt-admin`.

---

## 3. Pixel-Level Visual Design System & Color Tokens

### 3.1 Color Palette Specifications
The visual theme relies on high-contrast, eco-scientific tones anchored by the signature **Plainsyt Lime Green**, deep midnight pine obsidian, and clean tactile surfaces.

| Token Name | Hex Code | RGB / HSL | Usage & Placement |
| :--- | :--- | :--- | :--- |
| **Plainsyt Lime Green (Primary)** | `#03EF62` | `rgb(0, 237, 100)` | Primary buttons, active nav icons, brand pills, focus rings, progress bars |
| **Lime Green Hover** | `#02d955` | `rgb(0, 216, 89)` | Hover states for primary buttons, interaction micro-states |
| **Lime Green Light Wash** | `rgba(0, 237, 100, 0.12)` | `#03EF621F` | Subtle badge backgrounds, highlight pills, active state cards |
| **Midnight Obsidian (Canvas Dark)**| `#061621` | `rgb(6, 22, 33)` | Dark mode body background, desktop nav headers, dark buttons |
| **Deep Pine Green** | `#041d13` | `rgb(4, 29, 19)` | Modal headers, gradient stops, premium banner covers |
| **Card Surface (Dark Mode)** | `#071f2d` | `rgb(7, 31, 45)` | Dark mode modal body, popover menus, reaction picker containers |
| **Card Border (Dark Mode)** | `rgba(255, 255, 255, 0.10)` | White @ 10% | Clean, non-brutalist border dividers on dark themes |
| **Canvas Light** | `#f4f6f8` | `rgb(244, 246, 248)` | Light mode platform background, clean paper contrast |
| **Card Surface (Light Mode)** | `#ffffff` | `rgb(255, 255, 255)` | Feed cards, sidebar containers, reader modals |
| **Card Border (Light Mode)** | `#e2e8f0` | `rgb(226, 232, 240)` | Subtle borders, separation rules, divider lines |
| **Text Primary (Dark Mode)** | `#ffffff` | `rgb(255, 255, 255)` | 100% white high-contrast text across all dark mode views |
| **Text Secondary (Dark Mode)** | `#94a3b8` | `rgb(148, 163, 184)` | Muted metadata, timestamps, secondary labels in dark mode |
| **Text Primary (Light Mode)** | `#0f172a` | `rgb(15, 23, 42)` | High-readability slate-900 typography in light mode |
| **Text Secondary (Light Mode)** | `#64748b` | `rgb(100, 116, 139)` | Metadata, bylines, read-time labels in light mode |
| **Pure Glitch Red (Alert/Icon)** | `#FF2E2E` / `#EF4444` | `rgb(255, 46, 46)` | Glitch error icon, system alerts, destructive confirmations |
| **bKash Signature Pink** | `#E2136E` | `rgb(226, 19, 110)` | bKash checkout branding, payment badges, verified transactions |

### 3.2 Typography Standards
- **Bengali Primary (`font-bangla`)**: Google Font **'Hind Siliguri'** (`sans-serif`).
  - Strict rule: All Bengali text, author bylines, titles, descriptions, comments, and form inputs must use `font-bangla`.
  - Fallback stack: `'Hind Siliguri', 'Noto Sans Bengali', -apple-system, sans-serif`.
- **Editorial Display (`font-display`)**: **'Newsreader'** / High-elegance editorial serif.
  - Used for article main headings, section kickoff titles, and quote callouts.
- **Interface Sans (`font-sans`)**: **'Inter'** (`sans-serif`).
  - Used for English text, UI buttons, numerical badges, and technical controls.
- **Monospace Code & Plates (`font-mono`)**: **'JetBrains Mono'** / `'SF Mono'`.
  - Used for figure tags (`FIG. ART-001`), SKU numbers, order numbers, and timestamps where monospacing prevents layout jitter.

### 3.3 Geometry, Radii & Elevations
- **Corner Radii**:
  - `rounded-full` (9999px): Primary buttons, pill tags, navigation indicators, user avatars.
  - `rounded-3xl` (24px): Floating modals, error cards, auth dialogues.
  - `rounded-2xl` (16px): Feed cards, article cards, product tiles, story thumbnails.
  - `rounded-xl` (12px): Form input fields, dropdown menus, comment boxes.
  - `rounded-lg` (8px): Icon containers, sub-buttons, small status chips.
- **Shadow Standards**:
  - `shadow-tactile-xs`: `0 1px 2px rgba(6, 22, 33, 0.06), 0 2px 4px rgba(6, 22, 33, 0.04)`.
  - `shadow-sm`: Standard card separation in light mode.
  - `shadow-2xl`: Modals, lightboxes, and overlay menus.
  - Clean styling directive: Avoid harsh brutalist black outlines. Use soft borders (`border-slate-200/80` or `border-white/10`) with gentle ambient occlusion.

---

## 4. Comprehensive Layout & Shell Architecture

### 4.1 Global Desktop Grid Structure
On desktop screens (`>= 1024px`), the shell employs a three-column layout:
- **Left Sidebar**: 224px (14rem) to 240px (15rem) fixed column. Contains navigation shortcuts, research topics, and quick category jumps.
- **Center Main Content**: Flexible responsive column (`max-w-[760px]`, centered). Houses the active feed, articles, discussions, or marketplace.
- **Right Sidebar**: 224px to 240px sticky column. Houses Top Trending Articles (ranked 1–5), Upcoming Events with registration, and Recommended Researchers.

```
+---------------------------------------------------------------------------------------------------+
|  HEADER (Top Navigation: 56px / 64px)                                                             |
|  [Logo: Plainsyt]   [Search ⌘K]       [Home] [Explore] [Events] [Store] [Ideas]       [Theme] [Login] |
+---------------------------------------------------------------------------------------------------+
|               |                                                          |                        |
|  LEFT SIDEBAR |  CENTER FEED / ACTIVE VIEW                               |  RIGHT SIDEBAR         |
|  - Shortcuts  |  - Story & Reel Bar                                      |  - Trending Articles   |
|  - Topics     |  - Post Creation Card                                    |  - Upcoming Events     |
|  - Pillars    |  - Dynamic Feed Cards (Articles, Community Posts, Reels) |  - Researcher Follows  |
|  - Ecosystem  |  - Infinite Scroll / Pagination                          |                        |
|               |                                                          |                        |
+---------------------------------------------------------------------------------------------------+
|  MOBILE BOTTOM BAR (Hidden on Desktop; Fixed at Bottom on Screens < 768px: Home, Explore, etc.)   |
+---------------------------------------------------------------------------------------------------+
```

### 4.2 Header (Top Navigation) Specifications
- **Height**: 52px on mobile (`< 768px`), 64px on tablet and desktop (`>= 768px`).
- **Background**: High-visibility `#03EF62` (Lime Green) with subtle bottom border `rgba(6, 22, 33, 0.15)`.
- **Brand Mark**: Responsive `PlainsytLogo`:
  - Desktop: Full white/dark wordmark `প্লেইনসাইট / PLAiNSYT`.
  - Mobile: Clean circular logo icon with zero awkward borders.
- **Global Search Button**:
  - Triggers interactive search modal (`⌘K` or `Ctrl+K` keybinding listener).
  - Searches across articles, authors, community posts, and category tags simultaneously.
- **Center Desktop Navigation Tabs**:
  - Icons: Home (`Home`), Explore (`Compass`), Events (`CalendarDays`), Store (`Store`), Ideas (`Lightbulb`).
  - Active State: High-contrast midnight obsidian pill (`bg-[#061621] text-white shadow-md scale-105`).
  - Hover State: Gentle lift (`hover:bg-[#061621]/15 hover:scale-105`) with smooth animated floating tooltip in Bengali.
- **Right Action Cluster — Logged-In State**:
  1. **AI Assistant (`Sparkles`)**: Opens Plainsyt Intelligent Agri-Knowledge Assistant.
  2. **Shopping Cart (`ShoppingBag`)**: Opens slide-over cart drawer with badge count.
  3. **Theme Toggle (`Sun` / `Moon`)**: Seamless dark mode and light mode switcher.
  4. **Saved Bookmarks (`Bookmark`)**: Opens modal listing saved articles and posts.
  5. **Notifications (`Bell`)**: Shows unread counter badge; opens notifications popover.
  6. **User Avatar Profile Button**: Displays user profile avatar with green online badge; on click, reveals dropdown with Profile link, Account Switch, and Log Out.
- **Right Action Cluster — Logged-Out State**:
  - Search icon.
  - Theme toggle (Sun/Moon).
  - **Single Primary Action Button**: **"লগইন"** (`bg-[#061621] text-white rounded-full font-bold px-4 py-2`).
  - All clutter (AI button, Cart, Saved posts, Notifications, separate "Sign up" button) is strictly hidden for guests.

---

## 5. Screen & View Deep Dives

### 5.1 Home View (`/`)
The primary social and editorial stream:
1. **Stories & Reels Carousel**:
   - Horizontal scroll container featuring 24-hour agricultural stories and short-form video reels.
   - Creator avatar with glowing lime border, topic title, and duration badge.
   - Click opens the full-screen reel player or story viewer.
2. **Post Creator Card**:
   - Shows user's avatar and prompt: `"আপনার কৃষি ভাবনা বা অভিজ্ঞতা শেয়ার করুন..."`.
   - Text theme picker (vibrant gradients: emerald-green, sunset-gold, electric-purple, midnight-pine).
   - Multi-photo attachment support with preview and removal.
   - Post button with loading spinner and instant optimistic feed integration.
3. **Article Cards**:
   - Clean aspect ratio (16:9 for featured, 2:1 for standard).
   - High-fidelity figure plate (`FIG. ART-BINA-GAMMA-2026`).
   - Category pill (`বিজ্ঞান`, `কৃষি প্রযুক্তি`, `মৃত্তিকা বিজ্ঞান`) in brand lime wash.
   - **Published Date & Time**: Displayed prominently with `<Calendar />` icon (e.g. `০১ নভেম্বর ২০২৬, ০৩:০৭`).
   - **Read Time**: `<Clock />` icon + Bengali numerals (e.g. `৫ মিনিট পড়া`).
   - Title: `font-display text-[20px] sm:text-[22px] font-bold text-pine-950 hover:underline`.
   - Subtitle: Summarized context in `font-bangla`.
   - Author Byline: Avatar, author name, designation, and organization rendered strictly in `font-bangla` (`Hind Siliguri`).
   - **LinkedIn-Style 6-Way Reactions Bar**: Like, Celebrate, Support, Love, Insightful, Curious.
   - **Nested Commenting**: Real-time comment input, comment count, and threaded discussions.
4. **Community Post Cards**:
   - Microposts with optional text gradient themes for high visual impact.
   - Photo grids (1, 2, 3, or 4+ images with "+N more" overlay).
   - Verified researcher badge for verified faculty and scientists.
   - Real-time timestamp (e.g. `৩ ঘণ্টা আগে`).

### 5.2 Article Reader Modal & Standalone Route (`/article/:articleId`)
- **Dual Presentation**: Can be viewed as an in-place lightbox modal without losing feed position, or directly accessed via permalink `/article/:articleId`.
- **Hero Cover Image**: Full-width high-resolution photograph with scientific photo credits and source attribution.
- **Metadata Header**:
  - Full article category chip.
  - Published timestamp in Bengali.
  - Estimated read time.
  - Author profile link and institutional designation.
- **Key Takeaways Box (মূল কথা)**:
  - Green-tinted callout containing 3–5 bulleted research takeaways for rapid scanning.
- **Body Content**:
  - Multi-paragraph editorial text formatted with readable line heights (`leading-[1.8]`), comfortable column widths, and responsive font sizes (`text-[16px] sm:text-[17.5px]`).
- **Research Basis / Methodology**:
  - Specific DOI links, research institute badges, and key metrics (e.g. `500 kCi Cobalt-60`).
- **Reader Engagement**:
  - Full reaction bar, bookmark toggle, share to social channels, and complete comments thread.

### 5.3 Agro-Tech Store (`/store`)
- **Product Grid**: Specialized agro-inputs, IoT soil sensors, drip irrigation kits, organic bio-fertilizers, and certified seeds.
- **Product Cards**: High-resolution product photography, seller name, stock badge, tag (`Agri-Tech`, `Organic`, `Hardware`), price in Bangladeshi Taka (`৳ ১,৮৫০ / পিস`).
- **Add-to-Cart Flow**: Instant optimistic cart badge update, slide-over cart drawer.
- **bKash Direct Send-Money Checkout**:
  1. Delivery address form (District, Full address, Phone number).
  2. Delivery zone selector: Inside Dhaka (৳ ৬০) vs Outside Dhaka (৳ ১২০).
  3. Real-time subtotal, delivery fee, and grand total calculation in BDT.
  4. Designated official receiver bKash number (`01771047033`).
  5. Buyer enters their Sender bKash Number and Transaction ID (`TrxID`).
  6. Instant validation and order submission with generated unique Order Number (e.g. `ORD-2026-9481`).
  7. Orders tracked in user profile under "অর্ডার ইতিহাস" (Orders Tab).

### 5.4 Events & Seminars Hub (`/events` & `/events/:eventId`)
- **Events Calendar**: Categorized upcoming agricultural conferences, workshops, drone training sessions, and field expos.
- **Date Badge**: Stylized calendar card with month in Bengali (`নভেম্বর`) and bold day number (`০৫`).
- **Event Metadata**: Venue location (`কৃষিবিদ ইনস্টিটিউট বাংলাদেশ (KIB), ঢাকা`), registered attendee counter, organizer name.
- **1-Click Registration**:
  - Logged-in users can register with one click.
  - Real-time registration state stored in Supabase table `public.event_registrations`.
  - Registered events display "নিবন্ধিত" (Registered) badge with option to cancel or download calendar invite.

### 5.5 Reader Ideas Board (`/ideas`)
- **Collaborative Innovation**: Readers and grassroots innovators submit agricultural problems and proposed technological solutions.
- **Upvoting Engine**: Users upvote practical ideas; counts update optimistically and persist in Supabase table `public.ideas`.
- **Category Filter**: Filter ideas by tags (`ড্রোন প্রযুক্তি`, `স্মার্ট সেচ`, `শস্য প্রক্রিয়াজাতকরণ`, `জৈব সার`).

### 5.6 Researcher & User Profiles (`/profile` & `/profile/:userId`)
- **Cover Banner**: High-elegance organic gradient (customizable per user) with 1-click palette editor for profile owners.
- **Profile Header**:
  - High-resolution circular avatar with online status indicator.
  - Verified researcher badge (`VerifiedBadge`).
  - Full Name in Bengali and English.
  - Academic / Institutional Role & Designation (`Research Fellow · Bangladesh Agricultural University`).
  - Username handle (`@zubair`).
  - Geographic location (`ময়মনসিংহ, বাংলাদেশ`).
  - Research focus area pill (`Agri-Tech & Agronomy`).
  - Follower & Following counters with instant follow/unfollow capability.
- **Profile Control Bar (for Profile Owner)**:
  - **সেটিংস (Settings)**: Opens `ProfileSettingsModal` for photo upload, bio editing, and username modification.
  - **লগইন / সুইচ (Switch Account)**: Opens `AuthModal`.
  - **সাইন আউট (Log Out)**: Safely terminates Supabase session, resets local state, and toasts feedback.
  - **Dark Mode Toggle**: Light / Dark mode toggle button.
- **Content Tabs**:
  1. **নিবন্ধসমূহ (Articles)**: Articles authored by this researcher.
  2. **পোস্টসমূহ (Posts)**: Community updates and field notes published by this user.
  3. **সংরক্ষিত (Saved)**: Bookmarked articles and posts (visible to own profile).
  4. **অর্ডার ইতিহাস (Orders)**: Status of store orders placed via bKash.

---

## 6. Authentication & User Session Management

### 6.1 Smart Unified Authentication Flow
The authentication system is designed to eliminate user friction. There are no confusing tabs or separate registration mazes.

```
+-------------------------------------------------------------------------------------------------+
|                                USER CLICKS "লগইন" IN HEADER                                     |
+-------------------------------------------------------------------------------------------------+
                                                |
                                                v
+-------------------------------------------------------------------------------------------------+
|                                     AUTH MODAL OPENS                                            |
|                                                                                                 |
|   [ G ] Google দিয়ে এক ক্লিকে এগিয়ে যান  (Direct OAuth for both new and existing users)        |
|                                                                                                 |
|   ------------------------------ অথবা ইমেইল দিয়ে প্রবেশ করুন ---------------------------------  |
|                                                                                                 |
|   ইমেইল ঠিকানা:   [ your.email@example.com                                                    ] |
|   পাসওয়ার্ড:       [ ••••••••                                                                👁 ] |
|                                                                                                 |
|   [                                     লগইন করুন  ->                                         ] |
+-------------------------------------------------------------------------------------------------+
                                                |
                       +------------------------+------------------------+
                       | User enters Email & Password and clicks Submit   |
                       v                                                 v
         [ Case A: Email Exists in DB ]                     [ Case B: Email NOT Found in DB ]
                       |                                                 |
                       v                                                 v
         Verify Password via Supabase Auth                  **SMART AUTO-DETECTION TRIGGERS!**
          /                         \                       Modal smoothly expands and states:
     [ Matches ]               [ Incorrect ]                "স্বাগতম! আপনি নতুন সদস্য হিসেবে
          |                          |                      শনাক্ত হয়েছেন। অনুগ্রহ করে শুধু আপনার
          v                          v                      নামটি লিখুন, এখনই অ্যাকাউন্ট তৈরি হবে।"
     LOGGED IN!              Shows error message                         |
     Toast: "স্বাগতম!"       "পাসওয়ার্ড সঠিক নয়"                         v
     Modal Closes            Offers password reset          [ আপনার পূর্ণ নাম: যেমন জুবায়ের হাসান ]
                                                            Button updates to:
                                                            [ অ্যাকাউন্ট তৈরি ও প্রবেশ করুন -> ]
                                                                         |
                                                                         v
                                                            Submits name, email & password
                                                            Creates auth user + public profile
                                                            LOGGED IN IMMEDIATELY!
```

### 6.2 Session Persistence
- **Tokens**: Supabase JWT tokens are stored securely in browser storage.
- **Cross-Tab Synchronization**: Real-time window storage listeners keep all open tabs synchronized when a user signs in, updates their profile, or signs out.
- **Security Attestation**: Every transaction and mutation requires valid session identity enforced by PostgreSQL RLS.

---

## 7. Error Screen & Fallback Architecture

### 7.1 Developer Error Sanitization
Internal JavaScript runtime errors, minified bundle exceptions, and React rendering failures (such as `useState is not defined`, `ReferenceError`, or unhandled promise rejections) are **strictly shielded** from end users.
- The `getSafeErrorMessage()` filter inspects error payloads.
- Any technical stack traces or variable reference errors are converted into a courteous, professional Bengali notification:
  > *"একটি সাময়িক কারিগরি জটিলতা দেখা দিয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা মূল পাতায় ফিরে যান।"*

### 7.2 Standalone Red Glitch Logo
Replacing traditional generic alert triangles (`!`), the error screen features a custom high-tech **Glitch Logo**:
- **Pure Red Formulation**: Implemented via CSS `mask-image` referencing `/logos/icon.png` with background color `#FF2E2E`. This guarantees an intense, vivid red with zero yellowish or amber color distortion.
- **Chromatic Aberration & Jitter**: Layered offset clones animated with `@keyframes red-glitch-anim` and `@keyframes red-glitch-jitter`.
- **Clean Silhouette**: No square border box, no horizontal scanlines, and no distracting footer labels.
- **Dimensions**: Large, prominent 112px–128px center emblem with soft ambient red pulse glow.
- **Primary Recovery Action**: Prominent button in brand **Lime Green** (`bg-[#03EF62] hover:bg-[#02d955] text-[#061621] font-bold`) titled **"রিফ্রেশ করুন"**, alongside a secondary **"মূল পাতা"** navigation button.

---

## 8. Relational Database Schema & Supabase Architecture

The database schema consists of 13 fully normalized, interconnected tables with BRIN and B-Tree indexes:

```
+----------------------------------------------------------------------------------------------------+
|                                    PLAINSYT RELATIONAL SCHEMA                                      |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  profiles (Users & Researchers)                                                                    |
|  +--------------------+--------------------------------------------------------------------------+ |
|  | id (TEXT, PK)      | 'usr-plainsyt-admin', 'usr-zubair', 'u-...'                              | |
|  | name / name_bn     | Bengali and English user display names                                   | |
|  | handle             | Unique handle (e.g. 'plainsyt', 'zubair')                                | |
|  | role / organization| Academic rank and institutional affiliation                              | |
|  | avatar / cover     | Media storage URLs and gradient configurations                           | |
|  | is_verified        | Boolean indicating institutional researcher accreditation                | |
|  +--------------------+--------------------------------------------------------------------------+ |
|            |                                                                                       |
|            | 1:N                                                                                   |
|            +-----------------------+-----------------------+----------------------+                |
|            |                       |                       |                      |                |
|            v                       v                       v                      v                |
|  articles                 posts                   reactions              comments                  |
|  - id (PK)                - id (PK)               - target_type          - target_type             |
|  - title, subtitle        - author_id (FK)        - target_id            - target_id               |
|  - slug (UNIQUE)          - content               - user_id (FK)         - author_id (FK)          |
|  - category               - images (JSONB)        - type (like, love...) - text                    |
|  - author_id (FK)         - reaction_counts       - created_at           - reaction_counts         |
|  - content (JSONB)        - stats (JSONB)                                - created_at              |
|  - takeaways (JSONB)      - created_at                                                             |
|  - published_at                                                                                    |
|  - stats (JSONB)                                                                                   |
|                                                                                                    |
|  Other Core Tables:                                                                                |
|  - profile_login_aliases: Handles dual email alias mapping (plaiinsyt@gmail.com -> admin).         |
|  - reels: Vertical short videos with duration, media URLs, and reactions.                         |
|  - stories: 24-hour agricultural field stories with auto-expiration intervals.                    |
|  - events: Agricultural conferences, seminars, dates, venues, and registration limits.             |
|  - event_registrations: Composite PK (event_id, user_id) tracking confirmed attendee roster.        |
|  - store_products: Agri-tech hardware, bio-inputs, SKU, pricing, and merchant attributes.        |
|  - orders: bKash e-commerce orders, delivery address, TrxID, and payment verification states.     |
|  - ideas: Reader crowdsourced agro-tech challenges and upvote counts.                             |
|  - bookmarks: Saved articles, reels, and community posts per user.                                 |
|  - follows: Social graph relations (follower_id -> following_id).                                  |
|  - notifications: Targeted real-time alerts for reactions, comments, bookmarks, and follows.      |
+----------------------------------------------------------------------------------------------------+
```

---

## 9. Performance, Accessibility & SEO Best Practices

1. **Font Optimization**: Bengali fonts are preloaded via Google Fonts (`family=Hind+Siliguri:wght@400;500;600;700`) with `font-display: swap` to ensure instant visual readiness without layout shifts.
2. **Asset CDN Fallbacks**: Logos and hero photography utilize dual-path resolution (local asset `/logos/icon.png` with automatic failover to remote unpkg / GitHub CDN).
3. **Semantic HTML5 Structure**: Every view implements a single logical `<h1>`, structured `<article>`, `<header>`, `<main>`, `<aside>`, and `<nav>` landmarks.
4. **WCAG Color Contrast**: High contrast is preserved across all states. In dark mode, all text is pure `#FFFFFF` or high-luminance `#E2E8F0` on `#061621` background, completely avoiding low-contrast dark fonts on dark backgrounds.
5. **Mobile Viewport Ergonomics**: Essential interaction targets maintain a minimum hit area of 44×44 pixels. The mobile bottom navigation is pinned with iOS safe-area padding (`pb-[max(0.4rem,env(safe-area-inset-bottom))]`).

---

## 10. Summary & Maintenance Runbook

| Operation | Command / Procedure | Notes |
| :--- | :--- | :--- |
| **Development Server** | `npm run dev` | Runs Vite dev server at `http://localhost:5173` |
| **Production Build** | `npm run build` | Compiles TypeScript and outputs optimized assets to `dist/` |
| **Preview Build** | `npm run preview` | Spins up local HTTP server serving production build |
| **Database Migration** | Supabase SQL Dashboard | Run `src/app/lib/schemaSql.ts` to re-seed or update schema |
| **Verify Fonts** | Check `font-bangla` class | Guarantees 'Hind Siliguri' font across Bengali text elements |

*This document represents the complete, definitive technical reference for the PLAiNSYT SaaS Platform.*
