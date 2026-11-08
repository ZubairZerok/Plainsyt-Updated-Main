import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Sun, Moon, Bookmark, Bell, Home, Compass, CalendarDays, FileText, ArrowUpRight, Trash2, LogIn, User, LogOut, Settings, ShieldCheck, BarChart3 } from 'lucide-react';
import type { Article, CommunityPost, NotificationItem, TopicStory, UserProfile } from '../types';
import { isEditorialAuthorized } from '../lib/auth';
import { PlainsytLogo } from './PlainsytLogo';
import { Avatar, cn } from './Primitives';

export type View =
  | 'home'
  | 'explore'
  | 'events'
  | 'editorial'
  | 'notifications'
  | 'profile'
  | 'publications'
  | 'security';

export const LAYOUT_GRID = 'lg:grid-cols-[13rem_minmax(0,1fr)_14rem] xl:grid-cols-[14rem_minmax(0,1fr)_15rem]';
export const FEED_WIDTH = 'mx-auto w-full max-w-[760px] flex-1';

const DESKTOP_TABS: { key: View; path: string; label: string; icon: typeof Home }[] = [
  { key: 'home', path: '/', label: 'হোম ফিড · Home', icon: Home },
  { key: 'explore', path: '/explore', label: 'এক্সপ্লোর · Explore', icon: Compass },
  { key: 'events', path: '/events', label: 'ইভেন্টস · Events', icon: CalendarDays },
];

interface Props {
  activeView: View;
  onNavigate: (path: string) => void;
  currentUser: UserProfile | null;
  dark: boolean;
  onToggleDark: () => void;
  savedCount: number;
  cartCount?: number;
  reelsCount: number;
  onOpenCart?: () => void;
  onOpenSaved: () => void;
  onOpenReels: () => void;
  onOpenAI?: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenProfileSettings?: () => void;
  notifications: NotificationItem[];
  onReadNotifications: () => void;
  onToggleNotificationRead?: (id: string, isRead: boolean) => void;
  onDeleteNotification?: (id: string) => void;
  articles: Article[];
  posts: CommunityPost[];
  stories?: TopicStory[];
  onOpenArticle: (id: string) => void;
  onNavigateProfile: (userId: string) => void;
}

export function Header(p: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const unread = p.notifications.filter((n) => n.unread).length;

  const storyAuthorIds = useMemo(
    () => new Set((p.stories || []).map((s) => s.authorId).filter(Boolean)),
    [p.stories],
  );

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > 60) {
        if (currentY > lastScrollY.current + 8) {
          // Scrolling down -> hide mobile nav
          setNavVisible(false);
        } else if (currentY < lastScrollY.current - 6) {
          // Scrolling up -> reveal mobile nav
          setNavVisible(true);
        }
      } else {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setBellOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 20);
  }, [searchOpen]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { a: p.articles.slice(0, 5), c: [] as CommunityPost[] };
    return {
      a: p.articles.filter((x) =>
        (x.title + x.subtitle + x.categoryEn + x.author.name).toLowerCase().includes(term),
      ),
      c: p.posts.filter((x) => (x.content + x.author.name).toLowerCase().includes(term)).slice(0, 3),
    };
  }, [q, p.articles, p.posts]);

  const searchPanel = searchOpen && (
    <>
      <button
        type="button"
        aria-label="Close search"
        className="fixed inset-0 z-40 cursor-default"
        onClick={() => setSearchOpen(false)}
      />
      <div className="absolute left-2 right-2 top-[calc(100%+8px)] z-50 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card p-2 shadow-2xl md:left-4 md:right-auto md:w-[420px]">
        <div className="flex items-center gap-2 rounded-xl bg-canvas-subtle px-3.5">
          <Search className="size-4 text-accent-fg" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="আর্টিকেল, পোস্ট বা গবেষক খুঁজুন…"
            className="h-10 flex-1 bg-transparent text-[14px] text-pine-900 outline-none placeholder:text-pine-900/40"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="flex size-6 items-center justify-center rounded-full bg-pine-900/10 text-pine-900 hover:bg-pine-900/20"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="px-2 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 font-semibold">
          {q ? 'Search Results' : 'Recent Articles'}
        </p>
        {results.a.length === 0 && results.c.length === 0 && (
          <p className="px-2 py-4 text-center font-bangla text-[13px] text-slate-500 dark:text-slate-400">
            {q ? `“${q}” — কোনো ফলাফল পাওয়া যায়নি` : 'কোনো ফলাফল নেই'}
          </p>
        )}
        {results.a.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              p.onOpenArticle(a.id);
              setSearchOpen(false);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <FileText className="mt-0.5 size-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="min-w-0">
              <span className="line-clamp-1 font-bangla text-[13.5px] font-semibold text-slate-900 dark:text-white">
                {a.title}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {a.categoryEn} · {a.readTimeMinutes} min
              </span>
            </span>
          </button>
        ))}
        {results.c.length > 0 && (
          <>
            <p className="px-2 pb-1 pt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 font-semibold">
              Community Posts
            </p>
            {results.c.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  p.onNavigateProfile(c.authorId);
                  setSearchOpen(false);
                }}
                className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/5"
              >
                <Avatar src={c.author.avatar} name={c.author.name} size="size-6" />
                <span className="line-clamp-2 text-[13px] text-slate-700 dark:text-slate-300">
                  <b className="font-semibold text-slate-900 dark:text-white">{c.author.name}</b> — {c.content}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );

  const bellPanel = bellOpen && (
    <>
      <button
        type="button"
        aria-label="Close notifications"
        className="fixed inset-0 z-40 cursor-default"
        onClick={() => setBellOpen(false)}
      />
      <div className="absolute right-2 top-[calc(100%+8px)] z-50 w-[calc(100vw-1rem)] max-w-[390px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-canvas-border px-4 py-3 bg-canvas-subtle/40">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-emerald-600" />
            <p className="font-display text-[16px] font-bold text-pine-900">বিজ্ঞপ্তি (Notifications)</p>
            {unread > 0 && (
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {unread} নতুন
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={p.onReadNotifications}
            className="font-mono text-[11px] uppercase tracking-wider text-accent-fg hover:text-pine-900 hover:underline"
          >
            সব পড়া হয়েছে
          </button>
        </div>
        {p.notifications.length === 0 ? (
          <p className="px-4 py-8 text-center font-bangla text-[13px] text-pine-900/55">
            কোনো নতুন নোটিফিকেশন নেই।
          </p>
        ) : (
          <ul className="p-1.5 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {p.notifications.map((n) => {
              const isUnread = n.isRead !== undefined ? !n.isRead : n.unread;
              return (
                <li
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-2.5 rounded-xl p-2.5 transition-colors',
                    isUnread ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : 'hover:bg-pine-50/60 dark:hover:bg-white/5',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (n.actorId) {
                        p.onNavigateProfile(n.actorId);
                        setBellOpen(false);
                      }
                    }}
                    className="shrink-0 mt-0.5"
                    title={n.actorName || n.source}
                  >
                    <Avatar
                      src={n.actorAvatar || ''}
                      name={n.actorName || n.source || 'PS'}
                      size="size-8"
                      hasStory={n.actorId ? storyAuthorIds.has(n.actorId) : false}
                    />
                  </button>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (p.onToggleNotificationRead && isUnread) {
                        p.onToggleNotificationRead(n.id, true);
                      }
                      const dest = n.targetUrl || n.targetRoute || '/';
                      setBellOpen(false);
                      if (dest.startsWith('/article/')) {
                        const artId = dest.replace('/article/', '');
                        p.onOpenArticle(artId);
                      } else {
                        p.onNavigate(dest);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const dest = n.targetUrl || n.targetRoute || '/';
                        setBellOpen(false);
                        p.onNavigate(dest);
                      }
                    }}
                    className="min-w-0 flex-1 cursor-pointer text-left"
                  >
                    <p className="font-bangla text-[12.5px] leading-snug text-pine-900 font-medium">
                      {n.message || n.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-accent-fg">
                      <span>{n.time}</span>
                      <span>·</span>
                      <span className="font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                        {n.actorName || n.source}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {p.onToggleNotificationRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onToggleNotificationRead?.(n.id, !isUnread);
                        }}
                        aria-label={isUnread ? 'Mark as read' : 'Mark as unread'}
                        title={isUnread ? 'পড়া হয়েছে হিসেবে চিহ্নিত করুন' : 'অপঠিত হিসেবে চিহ্নিত করুন'}
                        className="rounded-full p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        {isUnread ? (
                          <span className="size-2 rounded-full bg-[#03EF62] block" />
                        ) : (
                          <span className="size-2 rounded-full border border-slate-300 dark:border-white/30 block" />
                        )}
                      </button>
                    )}
                    {p.onDeleteNotification && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          p.onDeleteNotification?.(n.id);
                        }}
                        aria-label="Delete notification"
                        title="মুছে ফেলুন"
                        className="opacity-0 group-hover:opacity-100 rounded-full p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-canvas-border p-2 bg-canvas-subtle/30 text-center">
          <button
            type="button"
            onClick={() => {
              setBellOpen(false);
              p.onNavigate('/notifications');
            }}
            className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg font-bangla text-[12.5px] font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition"
          >
            সকল নোটিফিকেশন দেখুন (See All) <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  const iconBtn =
    'relative flex size-9 sm:size-10 items-center justify-center rounded-full bg-[#061621]/10 text-[#061621] transition hover:bg-[#061621]/20 active:scale-95';

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-[#061621]/15 bg-[#03EF62] text-[#061621] shadow-sm backdrop-blur-sm transition-transform duration-300 ease-in-out',
          !navVisible && '-translate-y-full md:translate-y-0',
        )}
      >
        <div className="relative mx-auto flex h-13 max-w-[1440px] items-center justify-between gap-3 px-3 md:h-16 md:px-6">
          {/* Left: Brand Logo (Desktop: Bangla logo NO background; Mobile: Green BD icon) */}
          <div className="flex items-center gap-3">
            <PlainsytLogo onNavigateHome={() => p.onNavigate('/')} className="plainsyt-nav-logo" />
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (⌘K)"
              className="hidden items-center gap-2 rounded-full bg-[#061621]/10 px-3.5 py-1.5 text-[13px] font-semibold text-[#061621] transition hover:bg-[#061621]/20 lg:inline-flex"
            >
              <Search className="size-4" />
              <span className="font-mono text-[11px] opacity-80">Search (⌘K)</span>
            </button>
          </div>

          {/* Center: Desktop Navigation Tabs (Permanently centered, unaffected by left/right elements) */}
          <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center pointer-events-auto z-10" aria-label="Primary Navigation">
            <ul className="flex h-full items-center gap-1.5 lg:gap-2">
              {DESKTOP_TABS.map((t) => {
                const active = p.activeView === t.key;
                const isHovered = hoveredTab === t.key;
                return (
                  <li key={t.key} className="relative h-full flex items-center">
                    <button
                      type="button"
                      onClick={() => p.onNavigate(t.path)}
                      onMouseEnter={() => setHoveredTab(t.key)}
                      onMouseLeave={() => setHoveredTab(null)}
                      aria-current={active ? 'page' : undefined}
                      aria-label={t.label}
                      className={cn(
                        'group relative flex size-10 lg:size-11 items-center justify-center rounded-full transition duration-150',
                        active
                          ? 'bg-[#061621] text-white shadow-md scale-105 nav-active'
                          : 'text-[#061621] hover:bg-[#061621]/15 hover:scale-105 active:scale-95',
                      )}
                    >
                      <t.icon className={cn('size-[19px] lg:size-5', active ? 'text-white' : 'text-[#061621]')} strokeWidth={active ? 2.5 : 2} />
                    </button>

                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#061621] px-3 py-1 font-bangla text-[12px] font-medium text-white shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
                        {t.label}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#061621]" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {/* Saved and Notification icons: shown when logged in */}
            {p.currentUser && (
              <>
                {/* Saved Posts Button: Visible in mobile view top nav and desktop */}
                <button
                  type="button"
                  onClick={p.onOpenSaved}
                  aria-label="Saved posts"
                  title="সংরক্ষিত পোস্ট"
                  className={iconBtn}
                >
                  <Bookmark className="size-[18px]" />
                  {p.savedCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#061621] px-1 font-bangla text-[11px] font-bold text-[#03EF62] ring-2 ring-[#03EF62]">
                      {p.savedCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setBellOpen((b) => !b)}
                  aria-label="Notifications"
                  className={cn(iconBtn, 'hidden sm:flex')}
                >
                  <Bell className="size-[18px]" />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full bg-[#e41e3f] font-bangla text-[11px] font-bold text-white shadow-xs">
                      {unread}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Dark mode / Light mode toggle button: always visible in mobile view at right */}
            <button
              type="button"
              onClick={p.onToggleDark}
              aria-label="Toggle theme"
              title={p.dark ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
              className={iconBtn}
            >
              {p.dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>

            {/* Search Button (Mobile): placed right next to theme button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex size-9 items-center justify-center rounded-full bg-[#061621]/10 text-[#061621] hover:bg-[#061621]/20 active:scale-90 lg:hidden"
            >
              <Search className="size-[18px]" />
            </button>

            {p.currentUser ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((s) => !s)}
                  aria-label="User Menu"
                  title={`${p.currentUser.name} · অ্যাকাউন্ট`}
                  className={cn(
                    'flex items-center rounded-full ring-2 p-0.5 transition active:scale-95 bg-white/10',
                    userMenuOpen ? 'ring-[#061621]' : 'ring-[#061621]/20 hover:ring-[#061621]',
                  )}
                >
                  <Avatar
                    src={p.currentUser?.avatar || 'PS'}
                    name={p.currentUser?.name || 'Profile'}
                    size="size-8 sm:size-9"
                    online
                    hasStory={p.currentUser ? storyAuthorIds.has(p.currentUser.id) : false}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (p.onOpenAuth ? p.onOpenAuth() : p.onNavigate('/profile'))}
                aria-label="Login"
                className="hidden sm:inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-full bg-[#061621] px-4 sm:px-5 text-[12px] sm:text-[13px] font-bold text-white shadow-sm hover:bg-[#061621]/80 transition active:scale-95"
              >
                <LogIn className="size-3.5 text-white" />
                <span>লগইন</span>
              </button>
            )}
          </div>

          {searchPanel}
          {bellPanel}
        </div>
      </header>

      {/* Ultra-Sleek Modern User Profile Dropdown (Shared for Mobile Bottom Nav & Desktop Top Nav) */}
      {userMenuOpen && p.currentUser && (
        <>
          <button
            type="button"
            aria-label="Close user menu"
            className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-xs md:bg-transparent md:backdrop-blur-none"
            onClick={() => setUserMenuOpen(false)}
          />
          <div
            className={cn(
              'user-pfp-dropdown z-50 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#071f2d]/95 backdrop-blur-xl p-3 shadow-2xl font-bangla transition-all duration-150',
              // Mobile: anchored right above bottom nav bar
              'fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+8px)] left-2.5 right-2.5 sm:left-auto sm:right-3 sm:w-82 max-h-[calc(100vh-5rem)] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-2',
              // Desktop: positioned right below top avatar
              'md:fixed md:top-16 md:bottom-auto md:right-6 md:left-auto md:w-82 md:animate-in md:fade-in md:zoom-in-95',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* User Profile Header Card */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 mb-2">
              <Avatar src={p.currentUser.avatar} name={p.currentUser.name} size="size-11" online hasStory={storyAuthorIds.has(p.currentUser.id)} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-sm font-bold text-slate-900 dark:text-white truncate">
                  {p.currentUser.name}
                </p>
                <p className="font-mono text-[11px] text-emerald-600 dark:text-[#03EF62] truncate">
                  @{p.currentUser.handle || 'user'}
                </p>
                <span className="inline-block mt-0.5 rounded-full bg-emerald-100 dark:bg-[#03EF62]/20 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-800 dark:text-[#03EF62]">
                  {p.currentUser.role || 'গবেষক'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {/* 1. View My Public Profile */}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  p.onNavigateProfile(p.currentUser!.id);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-[#03EF62]/15 text-emerald-600 dark:text-[#03EF62]">
                    <User className="size-4" />
                  </span>
                  <span className="truncate">আমার পাবলিক প্রোফাইল</span>
                </div>
                <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-slate-700 dark:text-[#03EF62]/80 dark:group-hover:text-[#03EF62] transition" />
              </button>

              {/* 2. Account Security & Devices */}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  p.onNavigate('/me/security');
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-[#03EF62]/15 text-emerald-600 dark:text-[#03EF62]">
                    <ShieldCheck className="size-4" />
                  </span>
                  <span className="truncate">সিকিউরিটি ও ডিভাইস</span>
                </div>
                <span className="rounded-md bg-emerald-100 dark:bg-[#03EF62]/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-[#03EF62]">
                  Verified
                </span>
              </button>

              {/* Editorial Dashboard (Available ONLY to authorized editorial emails) */}
              {isEditorialAuthorized(p.currentUser) && (
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    p.onNavigate('/editorial');
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-[#03EF62]/15 text-emerald-600 dark:text-[#03EF62]">
                      <BarChart3 className="size-4" />
                    </span>
                    <span className="truncate">সম্পাদকীয় ড্যাশবোর্ড</span>
                  </div>
                  <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-slate-700 dark:text-[#03EF62]/80 dark:group-hover:text-[#03EF62] transition" />
                </button>
              )}

              {/* Divider */}
              <div className="my-1 border-t border-slate-100 dark:border-white/10" />

              {/* 7. Profile Settings & Edit */}
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (p.onOpenProfileSettings) {
                    p.onOpenProfileSettings();
                  } else {
                    p.onNavigateProfile(p.currentUser!.id);
                  }
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-[#03EF62]/15 text-slate-700 dark:text-[#03EF62]">
                    <Settings className="size-4" />
                  </span>
                  <span className="truncate">প্রোফাইল সেটিংস ও এডিট</span>
                </div>
              </button>
            </div>

            {/* 7. Sign Out */}
            {p.onLogout && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    p.onLogout?.();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-[#03EF62]/15 text-rose-600 dark:text-[#03EF62]">
                    <LogOut className="size-4" />
                  </span>
                  <span>সাইন আউট (Log Out)</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile Fixed Bottom Ergonomic Navigation Bar (5 clean tabs, reels removed, notification icon, profile dropdown trigger) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-[#061621]/15 bg-[#03EF62]/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:hidden pb-[max(0.4rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile Bottom Navigation"
      >
        <ul className="grid grid-cols-5 h-13 items-center px-1">
          {(
            [
              { key: 'home', path: '/', label: 'হোম', icon: Home, badge: '' },
              { key: 'explore', path: '/explore', label: 'এক্সপ্লোর', icon: Compass, badge: '' },
              { key: 'events', path: '/events', label: 'ইভেন্ট', icon: CalendarDays, badge: '' },
              {
                key: 'notifications',
                path: '/notifications',
                label: 'বিজ্ঞপ্তি',
                icon: Bell,
                badge: unread ? String(unread) : '',
              },
            ] as const
          ).map((t) => {
            const active = p.activeView === t.key && !userMenuOpen;
            return (
              <li key={t.key} className="flex justify-center">
                <button
                  type="button"
                  aria-label={t.label}
                  onClick={() => {
                    setUserMenuOpen(false);
                    p.onNavigate(t.path);
                  }}
                  className={cn(
                    'relative flex size-10 items-center justify-center rounded-xl transition duration-150 active:scale-85',
                    active ? 'bg-[#061621] text-white shadow-md nav-active' : 'text-[#061621] hover:bg-[#061621]/10',
                  )}
                >
                  <span className="relative flex items-center justify-center">
                    <t.icon className={cn('size-5', active ? 'text-white' : 'text-[#061621]')} strokeWidth={active ? 2.5 : 2} />
                    {t.badge && (
                      <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e41e3f] px-1 font-bangla text-[11px] font-bold text-white shadow-xs">
                        {t.badge}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}

          {/* 5th Tab: Profile Avatar / Dropdown Trigger on Mobile */}
          <li className="flex justify-center">
            {p.currentUser ? (
              <button
                type="button"
                aria-label="Profile Menu"
                onClick={() => setUserMenuOpen((s) => !s)}
                className={cn(
                  'relative flex size-10 items-center justify-center rounded-xl transition duration-150 active:scale-85',
                  userMenuOpen || p.activeView === 'profile'
                    ? 'bg-[#061621] text-white shadow-md ring-2 ring-[#061621]'
                    : 'text-[#061621] hover:bg-[#061621]/10',
                )}
              >
                <Avatar
                  src={p.currentUser.avatar || 'PS'}
                  name={p.currentUser.name}
                  size="size-7"
                  online
                  ring={userMenuOpen || p.activeView === 'profile'}
                />
              </button>
            ) : (
              <button
                type="button"
                aria-label="লগইন"
                onClick={() => (p.onOpenAuth ? p.onOpenAuth() : p.onNavigate('/profile'))}
                className="relative flex size-10 items-center justify-center rounded-xl text-[#061621] hover:bg-[#061621]/10 transition active:scale-85"
              >
                <LogIn className="size-5" />
              </button>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}

export function SeeAllLink({ children, onClick }: { children: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-bangla text-[12px] font-bold tracking-tight text-[#00703a] dark:text-[#03EF62] hover:text-[#005a2f] dark:hover:text-[#29f57c] transition active:scale-95"
    >
      <span>{children}</span> <ArrowUpRight className="size-3.5" />
    </button>
  );
}
