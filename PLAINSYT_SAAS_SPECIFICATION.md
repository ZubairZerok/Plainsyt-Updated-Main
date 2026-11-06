# PLAiNSYT (প্লেইনসাইট) — Complete Enterprise Platform & SaaS Architectural Specification
> **Document Version**: 5.0.0-PROD  
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
2. **Community Social Feed (Agro-Network)**: Real-time microposts, photo collections, technical inquiries, and professional peer reactions.
3. **Agro-Stories & Reels Hub**: Vertical micro-learning video reels and 24-hour agricultural field stories.
4. **Agri-Tech Store & bKash Digital Commerce**: Peer-to-peer specialized farm machinery, organic inputs, biotechnology seeds, and direct-to-consumer bKash checkout with transaction verification.
5. **Open Reader Idea Board & Collaborative Innovation**: Crowdsourced problem-solving board with voting, categorization, and researcher feedback.
6. **Academic & Research Papers Repository**: Digital indexing of whitepapers, DOI links, impact metrics, and author citations.
7. **Events, Seminars & Workshops Calendar**: Real-time event registrations, seat tracking, venue maps, and calendar exports.
8. **PLAiNSYT AI Agronomy Assistant**: Ultra-trained localized AI agronomy intelligence engine integrated via OpenRouter.

---

## 2. Technology Stack & Architectural Blueprint

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                 |
|  +---------------------------------------------------------------------------------+  |
|  | Vite 6.x + React 19 / 18 SPA + TypeScript 5.x + Tailwind CSS v4 / PostCSS       |  |
|  | Typography: 'Hind Siliguri' (Bengali) + 'Newsreader' / Serif + Inter / Sans     |  |
|  | Routing: React Router v7 (Data Router with RouteErrorBoundary & Lazy Fallbacks) |  |
|  | Video Splash Engine: Accelerated 2.2x Brand Induction Video with Preload       |  |
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
|  - Storage Engine: 'plainsyt_clean_mirror_v9' (localStorage fallback)                 |
|  - Auth Session Key: 'plainsyt_auth_session'                                          |
|  - Optimistic State Manager with Commit Pipeline & Server Convergence                 |
+---------------------------------------------------------------------------------------+
```

### 2.1 Frontend Engineering
- **Build Tool**: Vite 6.3.5 (ESM bundling, HMR, aggressive tree-shaking, production chunk splitting).
- **Core Runtime**: React (Functional components, custom hooks, deterministic rendering, strict prop interfaces).
- **Routing**: `react-router` v7 (`createBrowserRouter`, `RouterProvider`, dynamic segment routing `/profile/:userId`, `/article/:articleId`, `/events/:eventId`).
- **Styling Architecture**: Vanilla Tailwind CSS + Custom CSS Variables (`theme.css`).
- **Iconography**: `lucide-react` (SVG vectorized icons), custom SVG glyphs, and high-definition brand marks.

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
| **Card Surface (Dark Mode)** | `#071f2d` | `rgb(7, 31, 45)` | Dark mode modal body, popover menus, reaction containers |
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
  - Strict numeric rule: All digits and numbers (both Bengali `০-৯` and Latin `0-9`) must render in Bold 700 version of Hind Siliguri across all statistics, counters, prices, dates, and badges.
- **Editorial Display (`font-display`)**: **'Newsreader'** / High-elegance editorial serif.
- **Interface Sans (`font-sans`)**: **'Inter'** (`sans-serif`).
- **Monospace Code & Plates (`font-mono`)**: **'JetBrains Mono'** / `'SF Mono'`.

---

## 4. Brand Induction & Procedural Splash Screen Engine

### 4.1 Precision Canvas & SVG Geometric Choreography
- **Engine**: Self-contained React procedural canvas and infinite-resolution SVG vector pipeline ported from `splashscreen.html`.
- **Layout Variant**: Horizontal `English.png` wordmark lockup centered with official motto *"insight hidden in plain sight"*.
- **Execution Speed**: Calibrated to **1.75x** speed delivering a brisk, engaging intro in ~2.7s.
- **Dynamic Palette (Lime to White)**:
  - Starts with vibrant deep lime background (`#a6f232` -> `#39a828`) displaying glowing white CAD construction tangents, compass circles, and comets.
  - Dynamically transitions into crisp paper white (`#ffffff` -> `#f3f6f0`) while the wordmark letters resolve in luminous Plainsyt lime gradient (`#b4f535` -> `#7ed928` -> `#36a628`).
- **Interactive Controls & Dismissal**: 1-click tap-to-dismiss anywhere on screen with silky smooth 0.4s fade-out, backed by a 3.2s safety fallback.

---

## 5. Interaction & Engagement Model

### 5.1 Focused 2-Reaction Architecture & Physics States
Derived from `reaction-buttons.html`, PLAiNSYT implements an interactive physics-driven reaction system:
1. **Like (`like`, Heart)**:
   - Icon: Scalable vector heart path.
   - Colors: Light `#E5385F` (text `#C8244B`, soft background `#FDE7EC`); Dark `#FF6B8A` (text `#FF8FA6`, soft background `#3B2030`).
   - Active Animation: `@keyframes react-pop` (scale bounce from 1 → 0.68 → 1.32 → 1) accompanied by 8 radiating particle burst dots and an expanding accent ring.
2. **Idea / New Insight (`insightful`, Light Bulb / নতুন জানলাম)**:
   - Icon: Scalable vector bulb with filament glass, metallic base, and radiating rays.
   - Colors: Light `#F2A900` (text `#7A5400`, soft background `#FFF2C4`); Dark `#FFC933` (text `#FFD966`, soft background `#3A3114`).
   - Active Animation: Glass fills with amber glow, rays shine with `@keyframes react-shine`, bulb flickers with `@keyframes react-flicker`, drop-shadow glow `drop-shadow(0 0 5px var(--idea))`, accompanied by 6 radiating particle burst dots and an expanding ring.

### 5.2 Interactive Button States & Rolling Numerals
- **Idle**: Clean pill border (`1.5px solid var(--react-line)`), card surface background, muted typography.
- **Hover**: Subtle elevation (`translateY(-1px)`), colored border matching reaction accent, and colored glow shadow (`0 4px 14px -6px var(--c)`).
- **Pressed**: Tactile spring compression (`scale(0.94)`).
- **Active (Toggled On)**: Soft background wash (`var(--soft)`), solid colored border (`var(--c)`), and vibrant text (`var(--t)`).
- **Rolling Number Animation**: Hind Siliguri bold 700 counters roll vertically (`react-rollUp` on react, `react-rollDown` on unreact).

### 5.2 Resilient Reaction & Comment Persistence
- **State Convergence**: Reactions and comments are stored in Supabase tables `public.reactions` and `public.comments`.
- **Deduplication Engine**: Client-side resilient merge index (`targetType:targetId:userId`) merges local storage and remote Supabase reactions. Reactions never disappear on page refresh, navigation, or temporary network interruptions.
- **Threaded Inline Replies**: Comments support nested hierarchy via `parentId`. Users can reply directly to any comment with `@author` tagging and visual indentation.

### 5.3 Icon-Only Clean Card Actions
- **MessageCircle**: Comment buttons across article cards, community posts, and reels render strictly the `MessageCircle` SVG icon and numeral badge `(<Num>{count}</Num>)` when `count > 0`. Textual "Comment" strings are completely eliminated for clean, uncluttered visual rhythm.
- **Dual-Action ShareModal**:
  - Direct Facebook share integration (`https://www.facebook.com/sharer/sharer.php?u=...`).
  - 1-click copy link action with instant visual feedback and toast confirmation.

### 5.4 Follow Graph & Verification
- **Relational Integrity**: Following/follower metrics are 100% computed from the relational `public.follows` table. Zero hardcoded numbers exist across the platform.
- **Instant Toggle**: Following someone updates both local state and Supabase table optimistically with feedback.

---

## 6. Standalone Article Route (`/article/:articleId`)

- **Dynamic Routing**: Standalone permalink views for articles (`/article/:articleId`).
- **Iconized Mobile Navigation**: The back button on mobile is a clean, circular icon button (`size-9 rounded-full border border-slate-200/90 dark:border-white/10 flex items-center justify-center`). On desktop screens, it smoothly expands to include `ফিডে ফিরে যান`.
- **Purged Debug Routes**: All internal route labels (`Standalone Article Route · /article/...`) are permanently purged.
- **Peer-Reviewed Citation Card**: Research articles feature verified academic methodology cards displaying research institute badges (e.g. BRRI, BINA, BAU), DOI links, and direct source URLs.

---

## 7. PLAiNSYT AI Agronomy Intelligence Engine

- **Localized Agro-Knowledge**: Ultra-trained conversational assistant specialized in Bangladesh's 30 agro-ecological zones (AEZ 1 to 30), Haor basin agriculture, coastal salinity management, nuclear mutation crop varieties (BINA), and BRRI rice strains.
- **OpenRouter Engine**: Directly connected to OpenRouter API supporting high-performance LLMs with graceful offline fallback.
- **Clean UI**: Removed generic subtitle text; streamlined header with direct query inputs and suggested prompt chips.

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
|  | handle             | Unique handle (e.g. 'plainsyt', 'hasanzubair')                           | |
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
|  - category               - images (JSONB)        - type ('like',        - parent_id (FK, self)    |
|  - author_id (FK)         - reaction_counts              'insightful')   - text                    |
|  - content (JSONB)        - stats (JSONB)         - created_at           - reaction_counts         |
|  - takeaways (JSONB)      - created_at                                   - created_at              |
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

## 9. Purged Routes & Clean Architecture Policy

To guarantee an uncluttered, high-utility product experience, the following obsolete views and routes have been **completely eliminated** from the application router, headers, and view switchboards:
- `/help`: Editorial guidelines and help view removed.
- `/me/analytics`: Generic user analytics dashboard purged.
- `/me/reading-history`: Reading log history view purged.
- Dummy seed posts (`post-zubair-1` and synthetic dummy items) completely eliminated from database queries and storage mirrors.

---

## 10. Summary & Maintenance Runbook

| Operation | Command / Procedure | Notes |
| :--- | :--- | :--- |
| **Development Server** | `npm run dev` | Runs Vite dev server at `http://localhost:5173` |
| **Production Build** | `npm run build` | Compiles TypeScript and outputs optimized assets to `dist/` |
| **Run Full Test Suite**| `node scripts/test_full_suite.mjs` | Executes automated assertions across all views & APIs |
| **Database Migration** | Supabase SQL Dashboard | Apply SQL scripts from `supabase/migrations/` |
| **Verify Fonts** | Check `font-bangla` class | Guarantees 'Hind Siliguri' font across Bengali text elements |

*This document represents the complete, definitive technical reference for the PLAiNSYT SaaS Platform.*
