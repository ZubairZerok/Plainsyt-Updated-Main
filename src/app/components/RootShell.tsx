import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Toaster, toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isFollowableAccount, canCreateStory, logoutUser } from '../lib/auth';
import {
  EMPTY_SNAPSHOT, fetchFromSupabase, fetchArticleByKey, fetchPostById, fetchReelById, fetchProfileByKey,
  fetchReactionsFor, dbUpdateProfile, dbInsertArticle, dbInsertPost, dbInsertComment, dbUpdateComment,
  dbDeleteComment, dbSetReaction, dbInsertReel, dbInsertStory, dbDeletePost, dbDeleteArticle, dbDeleteStory,
  dbUpdateNotificationRead, dbDeleteNotification, dbMarkAllNotificationsRead, dbToggleFollow, dbToggleBookmark,
  dbIncrementArticleView, dbRegisterForEvent,
  type DatabaseSnapshot, type DbResult, type EventRegistrationInput, type SupabaseConnectionStatus,
} from '../lib/db';
import { applyReactionToSnapshot } from '../lib/reactions';
import type {
  Article, Comment, CommunityPost, LightboxPayload, LinkedInReactionType,
  ReactionRecord, ReactionTargetType, StoryReel, TopicStory, UpcomingEvent, UserProfile,
} from '../types';
import { toggleBookmarkId, appendArticleComment, appendPostComment, makeComment, toBengaliNumerals } from '../utils/pureLogic';
import { Header, type View } from './Header';
import { RightSidebar } from './RightSidebar';
import { CentralFeed } from './CentralFeed';
import { ArticleReaderModal, ArticleReaderContent } from './ArticleReaderModal';
import type { PlayerItem } from './ReelPlayerModal';
import { SavedArticlesModal } from './SavedArticlesModal';
import { CommunityPostCard } from './CommunityPostCard';
import { ExploreView, EventsView, NotificationsView, ProfileView } from './Views';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { DeleteCommentAlertModal } from './DeleteCommentAlertModal';
import { ReactionBreakdownModal } from './LinkedInReactionBar';
import { EventRegistrationModal } from './EventRegistrationModal';
import { EventDetailPage } from './EventDetailPage';
import { AuthModal } from './AuthModal';
import {
  FeedPageSkeleton, ExplorePageSkeleton, EventsPageSkeleton, NotificationsPageSkeleton,
  ProfilePageSkeleton, ResearcherStudioSkeleton, ArticleReaderSkeleton,
} from './Skeletons';
import { shouldShowSplash } from '../lib/splash';
import { FEED_CARD, cn } from './Primitives';

const FacebookCreatePostModal = lazy(() => import('./FacebookCreatePostModal').then((m) => ({ default: m.FacebookCreatePostModal })));
const StoryViewerModal = lazy(() => import('./StoryViewerModal').then((m) => ({ default: m.StoryViewerModal })));
const ReelPlayerModal = lazy(() => import('./ReelPlayerModal').then((m) => ({ default: m.ReelPlayerModal })));
const CreatePostModal = lazy(() => import('./CreatePostModal').then((m) => ({ default: m.CreatePostModal })));
const EditorialDashboard = lazy(() => import('./EditorialDashboard').then((m) => ({ default: m.EditorialDashboard })));
const AccountSecurityView = lazy(() => import('./AccountSecurityView').then((m) => ({ default: m.AccountSecurityView })));
const ProfileSettingsModal = lazy(() => import('./ProfileSettingsModal').then((m) => ({ default: m.ProfileSettingsModal })));
const SiteLoader = lazy(() => import('./SiteLoader').then((m) => ({ default: m.SiteLoader })));

const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage unavailable (private mode / blocked) */
    }
  },
};

const REFRESH_DEBOUNCE_MS = 1200;

function NotFound({ title, text, onHome }: { title: string; text: string; onHome: () => void }) {
  return (
    <section className={cn(FEED_CARD, 'p-8 text-center')}>
      <h1 className="font-display text-[22px] font-bold text-pine-950 dark:text-white">{title}</h1>
      <p className="mt-1 font-bangla text-[14px] text-pine-900/65 dark:text-white/60">{text}</p>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onHome}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-pine-900 px-4 text-[13.5px] font-semibold text-canvas dark:bg-[#03EF62] dark:text-[#061621]"
        >
          <ArrowLeft className="size-4" /> হোম ফিডে ফিরুন
        </button>
      </div>
    </section>
  );
}

export function RootShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ userId?: string; articleId?: string; eventId?: string }>();

  /* ------------------------------ core state ------------------------------ */
  const [snap, setSnap] = useState<DatabaseSnapshot>(EMPTY_SNAPSHOT);
  const snapRef = useRef(snap);
  const [meId, setMeId] = useState('');
  const meRef = useRef('');
  const [supaStatus, setSupaStatus] = useState<SupabaseConnectionStatus>('checking');

  const [dark, setDark] = useState<boolean>(() => {
    const saved = safeStorage.get('plainsyt_dark_theme');
    if (saved !== null) return saved === 'true';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    safeStorage.set('plainsyt_dark_theme', String(dark));
  }, [dark]);

  // Synchronous, pure state transitions: no side effects ever run inside a React updater.
  const commit = useCallback((fn: (prev: DatabaseSnapshot) => DatabaseSnapshot) => {
    const next = fn(snapRef.current);
    snapRef.current = next;
    setSnap(next);
  }, []);

  /* --------------------------- server synchronisation --------------------------- */
  const pendingWrites = useRef(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshSeq = useRef(0);

  const refreshRef = useRef<() => Promise<void>>(async () => undefined);
  const scheduleRefresh = useCallback((delay = REFRESH_DEBOUNCE_MS) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => void refreshRef.current(), delay);
  }, []);

  const refresh = useCallback(async () => {
    const seq = ++refreshSeq.current;
    const res = await fetchFromSupabase(meRef.current);
    if (seq !== refreshSeq.current) return; // a newer refresh is in flight
    setSupaStatus(res.status);
    if (!res.snapshot) return;
    if (pendingWrites.current > 0) {
      // Do not overwrite optimistic changes whose writes have not landed yet.
      scheduleRefresh();
      return;
    }
    snapRef.current = res.snapshot;
    setSnap(res.snapshot);
  }, [scheduleRefresh]);
  refreshRef.current = refresh;

  /** Optimistic write: apply locally, persist, and on failure tell the user and re-sync from the server. */
  const mutate = useCallback(
    async <T,>(optimistic: ((s: DatabaseSnapshot) => DatabaseSnapshot) | null, op: () => Promise<DbResult<T>>, okMessage?: string) => {
      if (optimistic) commit(optimistic);
      pendingWrites.current += 1;
      let res: DbResult<T>;
      try {
        res = await op();
      } catch (err) {
        res = { ok: false, error: err instanceof Error ? err.message : 'নেটওয়ার্ক সমস্যা' };
      } finally {
        pendingWrites.current -= 1;
      }
      if (!res.ok) {
        toast.error(res.error);
        scheduleRefresh(0);
      } else if (okMessage) {
        toast.success(okMessage, { duration: 1600 });
      }
      return res;
    },
    [commit, scheduleRefresh],
  );

  useEffect(() => {
    // The auth listener is the single source of truth for "who is logged in" (it also completes OAuth/PKCE redirects).
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const id = session?.user?.id ?? '';
      if (event === 'PASSWORD_RECOVERY') navigate('/me/security');
      if (event === 'TOKEN_REFRESHED') return;
      const changed = id !== meRef.current;
      if (!changed && event !== 'INITIAL_SESSION' && event !== 'USER_UPDATED') return;
      meRef.current = id;
      setMeId(id);
      // Never call Supabase from inside this callback synchronously.
      setTimeout(() => void refresh(), 0);
      if (window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [refresh, navigate]);

  // Targeted realtime: new content from others + this user's notifications (debounced re-sync).
  useEffect(() => {
    let channel = supabase
      .channel(`plainsyt-live-${meId || 'guest'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => scheduleRefresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, () => scheduleRefresh());
    if (meId) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${meId}` },
        () => scheduleRefresh(300),
      );
    }
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [meId, scheduleRefresh]);

  const currentUser = useMemo<UserProfile | null>(
    () => (meId ? (snap.profiles.find((p) => p.id === meId) ?? null) : null),
    [snap.profiles, meId],
  );

  /* -------------------------------- modals -------------------------------- */
  const [writeOpen, setWriteOpen] = useState(false);
  const [reelUploadOpen, setReelUploadOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [registrationEvent, setRegistrationEvent] = useState<UpcomingEvent | null>(null);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ items: PlayerItem[]; start: number } | null>(null);
  const [storyViewerId, setStoryViewerId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxPayload | null>(null);
  const [rxBreakdown, setRxBreakdown] = useState<{ targetType: ReactionTargetType; targetId: string } | null>(null);
  const [rxRecords, setRxRecords] = useState<ReactionRecord[]>([]);
  const [pillar, setPillar] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | undefined>();
  const pendingActionRef = useRef<(() => void) | null>(null);
  const runPendingAfterLogin = useRef(false);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);

  // Mobile back button: each open modal owns one history entry so Back closes the modal instead of leaving the page.
  const modalHistoryDepthRef = useRef(0);
  const isClosingViaUiRef = useRef(false);
  const activeModals = useMemo(() => {
    const list: string[] = [];
    if (readerId) list.push('reader');
    if (storyViewerId) list.push('storyViewer');
    if (player) list.push('player');
    if (writeOpen) list.push('write');
    if (reelUploadOpen) list.push('reelUpload');
    if (savedOpen) list.push('saved');
    if (profileSettingsOpen) list.push('profileSettings');
    if (registrationEvent) list.push('registration');
    if (rxBreakdown) list.push('rxBreakdown');
    if (authModalOpen) list.push('auth');
    if (lightbox) list.push('lightbox');
    return list;
  }, [readerId, storyViewerId, player, writeOpen, reelUploadOpen, savedOpen, profileSettingsOpen, registrationEvent, rxBreakdown, authModalOpen, lightbox]);

  const prevModalCountRef = useRef(0);
  useEffect(() => {
    const diff = activeModals.length - prevModalCountRef.current;
    for (let i = 0; i < diff; i++) {
      modalHistoryDepthRef.current += 1;
      window.history.pushState({ ...(window.history.state ?? {}), plainsytModal: true }, '', window.location.href);
    }
    prevModalCountRef.current = activeModals.length;
  }, [activeModals.length]);

  const closeTopModal = useCallback(() => {
    if (lightbox) {
      setLightbox(null);
    } else if (authModalOpen) {
      setAuthModalOpen(false);
      pendingActionRef.current = null;
    } else if (rxBreakdown) {
      setRxBreakdown(null);
    } else if (registrationEvent) {
      setRegistrationEvent(null);
    } else if (profileSettingsOpen) {
      setProfileSettingsOpen(false);
    } else if (savedOpen) {
      setSavedOpen(false);
    } else if (reelUploadOpen) {
      setReelUploadOpen(false);
    } else if (writeOpen) {
      setWriteOpen(false);
    } else if (storyViewerId) {
      setStoryViewerId(null);
    } else if (player) {
      setPlayer(null);
    } else if (readerId) {
      setReaderId(null);
    } else {
      return false;
    }
    return true;
  }, [lightbox, authModalOpen, rxBreakdown, registrationEvent, profileSettingsOpen, savedOpen, reelUploadOpen, writeOpen, storyViewerId, player, readerId]);

  const handleUiCloseModal = useCallback((closeAction: () => void) => {
    closeAction();
    if (modalHistoryDepthRef.current > 0) {
      modalHistoryDepthRef.current -= 1;
      isClosingViaUiRef.current = true;
      window.history.back();
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (isClosingViaUiRef.current) {
        isClosingViaUiRef.current = false;
        return;
      }
      if (modalHistoryDepthRef.current > 0) {
        modalHistoryDepthRef.current -= 1;
        closeTopModal();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [closeTopModal]);

  /* -------------------------------- auth UX -------------------------------- */
  const requestAuth = useCallback((reason: string, onAuthed?: () => void) => {
    setAuthPromptReason(reason);
    pendingActionRef.current = onAuthed ?? null;
    setAuthModalOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setAuthModalOpen(false);
    runPendingAfterLogin.current = pendingActionRef.current !== null;
  }, []);

  useEffect(() => {
    // Run the action the user wanted (e.g. "react", "comment") once their profile is actually available.
    if (currentUser && runPendingAfterLogin.current && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      runPendingAfterLogin.current = false;
      action();
    }
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    meRef.current = '';
    setMeId('');
    void refresh();
  }, [refresh]);

  /* ------------------------------- navigation ------------------------------- */
  const activeView: View = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/explore')) return 'explore';
    if (p.startsWith('/events')) return 'events';
    if (p.startsWith('/editorial')) return 'editorial';
    if (p.startsWith('/notifications')) return 'notifications';
    if (p.startsWith('/profile')) return 'profile';
    if (p.startsWith('/me/security')) return 'security';
    return 'home';
  }, [location.pathname]);

  const goNavigate = useCallback(
    (path: string) => {
      setReaderId(null);
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate],
  );
  const navigateToProfile = useCallback(
    (userId: string) => {
      if (userId) goNavigate(`/profile/${encodeURIComponent(userId)}`);
    },
    [goNavigate],
  );

  /* ------------------------ deep links (article/post/reel/profile) ------------------------ */
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const requested = useRef<Set<string>>(new Set());
  const markMissing = (key: string) => setMissing((m) => new Set(m).add(key));

  useEffect(() => {
    if (supaStatus === 'checking') return;
    const m = location.pathname.match(/^\/(article|post|reel|reels|profile)\/([^/]+)$/);
    if (!m) return;
    const kind = m[1] === 'reels' ? 'reel' : m[1];
    const key = decodeURIComponent(m[2]);
    const reqKey = `${kind}:${key}:${meId}`;
    if (requested.current.has(reqKey)) return;
    const s = snapRef.current;
    if (kind === 'article' && s.articles.some((a) => a.id === key || a.slug === key)) return;
    if (kind === 'post' && s.posts.some((p) => p.id === key)) return;
    if (kind === 'reel' && s.reels.some((r) => r.id === key)) return;
    if (kind === 'profile' && (key === 'me' || s.profiles.some((p) => p.id === key || p.handle.toLowerCase() === key.toLowerCase().replace(/^@/, '')))) return;
    requested.current.add(reqKey);
    void (async () => {
      if (kind === 'article') {
        const r = await fetchArticleByKey(key, meId);
        if (!r) return markMissing(reqKey);
        commit((p) => ({ ...p, articles: [r.article, ...p.articles], comments: [...p.comments.filter((c) => !r.comments.some((x) => x.id === c.id)), ...r.comments] }));
      } else if (kind === 'post') {
        const r = await fetchPostById(key, meId);
        if (!r) return markMissing(reqKey);
        commit((p) => ({ ...p, posts: [r.post, ...p.posts], comments: [...p.comments.filter((c) => !r.comments.some((x) => x.id === c.id)), ...r.comments] }));
      } else if (kind === 'reel') {
        const r = await fetchReelById(key, meId);
        if (!r) return markMissing(reqKey);
        commit((p) => ({ ...p, reels: [r, ...p.reels] }));
      } else {
        const r = await fetchProfileByKey(key);
        if (!r) return markMissing(reqKey);
        commit((p) => ({ ...p, profiles: [...p.profiles, r] }));
      }
    })();
  }, [location.pathname, supaStatus, meId, commit]);

  const isMissing = (kind: string, key: string) => missing.has(`${kind}:${key}:${meId}`);

  /* ----------------------------- reels & stories ----------------------------- */
  const reelPlayerItems: PlayerItem[] = useMemo(
    () =>
      snap.reels.map((r) => ({
        id: r.id,
        title: r.title,
        creator: r.creator,
        avatar: r.creatorAvatar,
        image: r.mediaUrl,
        meta: r.location ? `${r.duration} · ${r.location}` : r.duration,
        duration: r.duration,
        likes: r.likes,
        videoUrl: r.videoUrl,
      })),
    [snap.reels],
  );

  const openedReelFromUrl = useRef('');
  useEffect(() => {
    const m = location.pathname.match(/^\/reels?\/([^/]+)$/);
    if (!m) {
      openedReelFromUrl.current = '';
      return;
    }
    const rid = decodeURIComponent(m[1]);
    if (openedReelFromUrl.current === rid) return;
    const idx = reelPlayerItems.findIndex((r) => r.id === rid);
    if (idx >= 0) {
      openedReelFromUrl.current = rid;
      setPlayer({ items: reelPlayerItems, start: idx });
    }
  }, [location.pathname, reelPlayerItems]);

  const toggleDark = () => setDark((prev) => !prev);

  /* ------------------------------- reactions ------------------------------- */
  const reactionQueue = useRef<Map<string, Promise<unknown>>>(new Map());

  const handleReact = useCallback(
    (targetType: ReactionTargetType, targetId: string, chosen: LinkedInReactionType) => {
      if (!currentUser) {
        requestAuth('প্রতিক্রিয়া (Reaction) প্রকাশ করতে দয়া করে লগইন বা সাইন আপ করুন।', () => handleReact(targetType, targetId, chosen));
        return;
      }
      const actor = currentUser;
      const { next, final } = applyReactionToSnapshot(snapRef.current, targetType, targetId, chosen);
      commit(() => next);
      // Serialise writes per target so rapid toggles can never arrive out of order.
      const key = `${targetType}:${targetId}`;
      const prev = reactionQueue.current.get(key) ?? Promise.resolve();
      const job = prev.then(() => mutate(null, () => dbSetReaction(targetType, targetId, actor, final)));
      reactionQueue.current.set(key, job);
      void job.finally(() => {
        if (reactionQueue.current.get(key) === job) reactionQueue.current.delete(key);
      });
    },
    [commit, currentUser, mutate, requestAuth],
  );

  useEffect(() => {
    if (!rxBreakdown) {
      setRxRecords([]);
      return;
    }
    let live = true;
    void fetchReactionsFor(rxBreakdown.targetType, rxBreakdown.targetId).then((r) => live && setRxRecords(r));
    return () => {
      live = false;
    };
  }, [rxBreakdown]);

  /* ------------------------------- bookmarks ------------------------------- */
  const handleBookmarkArticle = useCallback(
    (articleId: string) => {
      if (!currentUser) {
        requestAuth('প্রবন্ধ সংরক্ষণ (Bookmark) করতে দয়া করে লগইন বা সাইন আপ করুন।', () => handleBookmarkArticle(articleId));
        return;
      }
      const was = snapRef.current.bookmarkedArticleIds.includes(articleId);
      void mutate(
        (s) => ({ ...s, bookmarkedArticleIds: toggleBookmarkId(s.bookmarkedArticleIds, articleId) }),
        () => dbToggleBookmark(currentUser.id, 'article', articleId, !was),
      );
      toast(was ? 'প্রবন্ধটি বুকমার্ক থেকে সরানো হয়েছে' : 'প্রবন্ধটি সফলভাবে বুকমার্ক করা হয়েছে', { duration: 1600 });
    },
    [currentUser, mutate, requestAuth],
  );

  const handleSavePost = useCallback(
    (postId: string) => {
      if (!currentUser) {
        requestAuth('পোস্ট সংরক্ষণ করতে দয়া করে লগইন করুন।', () => handleSavePost(postId));
        return;
      }
      const was = snapRef.current.savedPostIds.includes(postId);
      void mutate(
        (s) => ({
          ...s,
          savedPostIds: toggleBookmarkId(s.savedPostIds, postId),
          posts: s.posts.map((p) => (p.id === postId ? { ...p, userSaved: !was } : p)),
        }),
        () => dbToggleBookmark(currentUser.id, 'post', postId, !was),
      );
      toast(was ? 'পোস্টটি সংরক্ষিত তালিকা থেকে সরানো হয়েছে' : 'পোস্টটি সফলভাবে সংরক্ষণ করা হয়েছে', { duration: 1600 });
    },
    [currentUser, mutate, requestAuth],
  );

  const handleSaveReel = useCallback(
    (reelId: string) => {
      if (!currentUser) {
        requestAuth('রিল সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।', () => handleSaveReel(reelId));
        return;
      }
      const was = snapRef.current.savedReelIds.includes(reelId);
      void mutate(
        (s) => ({ ...s, savedReelIds: toggleBookmarkId(s.savedReelIds, reelId) }),
        () => dbToggleBookmark(currentUser.id, 'reel', reelId, !was),
      );
    },
    [currentUser, mutate, requestAuth],
  );

  /* -------------------------------- comments -------------------------------- */
  const addComment = useCallback(
    (targetType: 'article' | 'post' | 'reel', targetId: string, text: string, parentId?: string, replyToAuthor?: string) => {
      if (!currentUser) {
        requestAuth('মন্তব্য করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => addComment(targetType, targetId, text, parentId, replyToAuthor));
        return;
      }
      const clean = text.trim();
      if (!clean) return;
      const comment = makeComment(clean.slice(0, 5000), currentUser, targetType, targetId, parentId, replyToAuthor);
      void mutate(
        (s) => ({
          ...s,
          comments: [...s.comments, comment],
          articles: targetType === 'article' ? s.articles.map((a) => (a.id === targetId ? appendArticleComment(a, comment) : a)) : s.articles,
          posts: targetType === 'post' ? s.posts.map((p) => (p.id === targetId ? appendPostComment(p, comment) : p)) : s.posts,
        }),
        () => dbInsertComment(comment),
      );
    },
    [currentUser, mutate, requestAuth],
  );

  const handleCommentArticle = useCallback(
    (articleId: string, text: string, parentId?: string, replyToAuthor?: string) => addComment('article', articleId, text, parentId, replyToAuthor),
    [addComment],
  );
  const handleCommentPost = useCallback(
    (postId: string, text: string, parentId?: string, replyToAuthor?: string) => addComment('post', postId, text, parentId, replyToAuthor),
    [addComment],
  );
  const handleCommentStoryOrReel = useCallback(
    (targetId: string, text: string, parentId?: string, replyToAuthor?: string) => {
      const s = snapRef.current;
      const story = s.stories.find((st) => st.id === targetId || st.articleId === targetId);
      const articleId = story?.articleId || (s.articles.some((a) => a.id === targetId) ? targetId : null);
      if (articleId) return addComment('article', articleId, text, parentId, replyToAuthor);
      if (s.posts.some((p) => p.id === targetId)) return addComment('post', targetId, text, parentId, replyToAuthor);
      return addComment('reel', targetId, text, parentId, replyToAuthor);
    },
    [addComment],
  );

  const findComment = (id: string): Comment | undefined => snapRef.current.comments.find((c) => c.id === id);

  const handleEditComment = useCallback(
    (commentId: string, newText: string) => {
      if (!currentUser) return;
      const clean = newText.trim().slice(0, 5000);
      if (!clean) return;
      const existing = findComment(commentId);
      if (existing && existing.authorId !== currentUser.id) {
        toast.error('আপনি শুধুমাত্র নিজের মন্তব্য সম্পাদনা করতে পারেন');
        return;
      }
      const upd = (list: Comment[]) => list.map((c) => (c.id === commentId ? { ...c, text: clean, isEdited: true } : c));
      void mutate(
        (s) => ({ ...s, comments: upd(s.comments), articles: s.articles.map((a) => ({ ...a, comments: upd(a.comments) })), posts: s.posts.map((p) => ({ ...p, comments: upd(p.comments) })) }),
        () => dbUpdateComment(commentId, clean),
        'মন্তব্য সফলভাবে আপডেট করা হয়েছে',
      );
    },
    [currentUser, mutate],
  );

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!currentUser) return;
      const existing = findComment(commentId);
      if (existing && existing.authorId !== currentUser.id) {
        toast.error('আপনি শুধুমাত্র নিজের মন্তব্য মুছে ফেলতে পারেন');
        return;
      }
      setPendingDeleteCommentId(commentId);
    },
    [currentUser],
  );

  const handleConfirmDeleteComment = useCallback(() => {
    if (!pendingDeleteCommentId) return;
    const rootId = pendingDeleteCommentId;
    setPendingDeleteCommentId(null);
    // The database cascades to replies; mirror that locally.
    const doomed = new Set<string>([rootId]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of snapRef.current.comments) {
        if (c.parentId && doomed.has(c.parentId) && !doomed.has(c.id)) {
          doomed.add(c.id);
          grew = true;
        }
      }
    }
    const keep = (list: Comment[]) => list.filter((c) => !doomed.has(c.id));
    void mutate(
      (s) => ({
        ...s,
        comments: keep(s.comments),
        articles: s.articles.map((a) => {
          const comments = keep(a.comments);
          return { ...a, comments, stats: { ...a.stats, commentsCount: comments.length } };
        }),
        posts: s.posts.map((p) => {
          const comments = keep(p.comments);
          return { ...p, comments, stats: { ...p.stats, commentsCount: comments.length } };
        }),
      }),
      () => dbDeleteComment(rootId),
      'মন্তব্য মুছে ফেলা হয়েছে',
    );
  }, [mutate, pendingDeleteCommentId]);

  const isPendingCommentReply = useMemo(
    () => Boolean(pendingDeleteCommentId && snap.comments.find((c) => c.id === pendingDeleteCommentId)?.parentId),
    [pendingDeleteCommentId, snap.comments],
  );

  /* ------------------------------ notifications ------------------------------ */
  const handleToggleNotificationRead = useCallback(
    (id: string, isRead: boolean) => {
      void mutate(
        (s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead, unread: !isRead } : n)) }),
        () => dbUpdateNotificationRead(id, isRead),
      );
    },
    [mutate],
  );
  const handleDeleteNotification = useCallback(
    (id: string) => {
      void mutate((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }), () => dbDeleteNotification(id));
    },
    [mutate],
  );
  const handleReadAllNotifications = useCallback(() => {
    if (!currentUser) return;
    void mutate(
      (s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, isRead: true, unread: false })) }),
      () => dbMarkAllNotificationsRead(currentUser.id),
    );
  }, [currentUser, mutate]);

  /* ----------------------------- content deletion ----------------------------- */
  const handleDeletePost = useCallback(
    (postId: string) => {
      if (!currentUser) return requestAuth('পোস্ট মুছতে লগইন করুন');
      void mutate(
        (s) => ({ ...s, posts: s.posts.filter((p) => p.id !== postId), comments: s.comments.filter((c) => !(c.targetType === 'post' && c.targetId === postId)) }),
        () => dbDeletePost(postId),
      );
    },
    [currentUser, mutate, requestAuth],
  );
  const handleDeleteStory = useCallback(
    (storyId: string) => {
      if (!currentUser) return requestAuth('স্টোরি মুছতে লগইন করুন');
      void mutate((s) => ({ ...s, stories: s.stories.filter((st) => st.id !== storyId) }), () => dbDeleteStory(storyId));
    },
    [currentUser, mutate, requestAuth],
  );
  const handleDeleteArticle = useCallback(
    (articleId: string) => {
      if (!currentUser) return requestAuth('প্রতিবেদন মুছতে লগইন করুন');
      void mutate(
        (s) => ({ ...s, articles: s.articles.filter((a) => a.id !== articleId), comments: s.comments.filter((c) => !(c.targetType === 'article' && c.targetId === articleId)) }),
        () => dbDeleteArticle(articleId),
      );
    },
    [currentUser, mutate, requestAuth],
  );

  /* ------------------------------ share / open ------------------------------ */
  const handleShare = useCallback((_label: string, customUrl?: string) => {
    const raw = customUrl || window.location.href;
    const full = raw.startsWith('http') ? raw : `${window.location.origin}${raw}`;
    navigator.clipboard
      ?.writeText(full)
      .then(() => toast.success('Copied', { duration: 1500 }))
      .catch(() => toast.error('লিংক কপি করা যায়নি'));
  }, []);

  const countedViews = useRef<Set<string>>(new Set());
  const countView = useCallback(
    (articleId: string) => {
      if (countedViews.current.has(articleId)) return;
      countedViews.current.add(articleId);
      commit((s) => ({ ...s, articles: s.articles.map((a) => (a.id === articleId ? { ...a, stats: { ...a.stats, views: a.stats.views + 1 } } : a)) }));
      void dbIncrementArticleView(articleId);
    },
    [commit],
  );
  const handleOpenArticlePopup = useCallback(
    (articleId: string) => {
      countView(articleId);
      setReaderId(articleId);
    },
    [countView],
  );

  /* ----------------------------- profile & publishing ----------------------------- */
  const handleSaveProfile = useCallback(
    (profile: UserProfile) => {
      void (async () => {
        const res = await mutate(null, () => dbUpdateProfile(profile));
        if (res.ok) {
          commit((s) => ({ ...s, profiles: s.profiles.map((p) => (p.id === profile.id ? { ...p, ...profile, isVerified: p.isVerified, isEditor: p.isEditor } : p)) }));
          toast.success('প্রোফাইল সংরক্ষিত হয়েছে');
          scheduleRefresh(0);
        }
      })();
    },
    [mutate, commit, scheduleRefresh],
  );

  const handlePublishArticle = useCallback(
    (article: Article) => {
      if (!currentUser) return requestAuth('প্রতিবেদন প্রকাশ করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।');
      const enriched: Article = {
        ...article,
        authorId: currentUser.id,
        author: {
          id: currentUser.id,
          name: currentUser.nameBn || currentUser.name,
          designation: currentUser.role,
          organization: currentUser.organization,
          avatar: currentUser.avatar,
        },
      };
      void (async () => {
        const res = await mutate((s) => ({ ...s, articles: [enriched, ...s.articles] }), () => dbInsertArticle(enriched));
        if (res.ok) {
          goNavigate('/');
          toast.success('প্রতিবেদন সফলভাবে প্রকাশিত হয়েছে', {
            description: `${toBengaliNumerals(enriched.readTimeMinutes)} মিনিট পড়া · ${enriched.category}`,
            duration: 1800,
          });
          scheduleRefresh(0);
        }
      })();
    },
    [currentUser, requestAuth, mutate, goNavigate, scheduleRefresh],
  );

  const handlePublishReel = useCallback(
    (reel: StoryReel, story?: TopicStory, feedPost?: CommunityPost) => {
      if (!currentUser) return requestAuth('পোস্ট ও স্টোরি প্রকাশ করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।');
      const actor = currentUser;
      const r: StoryReel = { ...reel, creatorId: actor.id, creator: actor.name, creatorAvatar: actor.avatar };
      const st = story && canCreateStory(actor) ? { ...story, authorId: actor.id, authorName: actor.name, authorAvatar: actor.avatar } : undefined;
      const po = feedPost ? { ...feedPost, authorId: actor.id, author: { ...feedPost.author, id: actor.id, name: actor.name, avatar: actor.avatar } } : undefined;
      void (async () => {
        const first = await mutate(
          (s) => ({ ...s, reels: [r, ...s.reels], stories: st ? [st, ...s.stories] : s.stories, posts: po ? [po, ...s.posts] : s.posts }),
          () => dbInsertReel(r),
        );
        if (!first.ok) return;
        if (st) await mutate(null, () => dbInsertStory(st));
        if (po) await mutate(null, () => dbInsertPost(po));
        toast.success('রিল ও স্টোরি সফলভাবে প্রকাশিত হয়েছে', { duration: 1800 });
        scheduleRefresh(0);
      })();
    },
    [currentUser, requestAuth, mutate, scheduleRefresh],
  );

  /* --------------------------------- follow --------------------------------- */
  const handleToggleFollow = useCallback(
    (targetUserId: string) => {
      if (!currentUser) {
        requestAuth('গবেষকদের অনুসরণ (Follow) করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => handleToggleFollow(targetUserId));
        return;
      }
      if (!targetUserId || currentUser.id === targetUserId) return;
      const target = snapRef.current.profiles.find((p) => p.id === targetUserId);
      if (target && !isFollowableAccount(target)) {
        toast.error('শুধুমাত্র ভেরিফাইড অ্যাকাউন্ট অনুসরণ করা সম্ভব');
        return;
      }
      const was = snapRef.current.followingIds.includes(targetUserId);
      void mutate(
        (s) => ({
          ...s,
          followingIds: toggleBookmarkId(s.followingIds, targetUserId),
          follows: was
            ? s.follows.filter((f) => !(f.followerId === currentUser.id && f.followingId === targetUserId))
            : [...s.follows, { followerId: currentUser.id, followingId: targetUserId }],
          profiles: s.profiles.map((p) =>
            p.id === targetUserId
              ? { ...p, followersCount: Math.max(0, p.followersCount + (was ? -1 : 1)) }
              : p.id === currentUser.id
                ? { ...p, followingCount: Math.max(0, p.followingCount + (was ? -1 : 1)) }
                : p,
          ),
        }),
        () => dbToggleFollow(currentUser.id, targetUserId, !was),
      );
      toast(was ? 'আনফলো করা হয়েছে' : `${target?.name || 'গবেষক'}-কে ফলো করছেন`, { duration: 1600 });
    },
    [currentUser, mutate, requestAuth],
  );

  /* ------------------------------ event registration ------------------------------ */
  const handleConfirmRegistration = useCallback(
    async (eventId: string, data: EventRegistrationInput & { passType?: string; note?: string }): Promise<boolean> => {
      if (!currentUser) {
        requestAuth('ইভেন্টে নিবন্ধন করতে অনুগ্রহ করে লগইন করুন।');
        return false;
      }
      const res = await mutate(null, () => dbRegisterForEvent(eventId, currentUser.id, data));
      if (!res.ok) return false;
      commit((s) => ({
        ...s,
        eventRegistrations: Array.from(new Set([...s.eventRegistrations, eventId])),
        events: s.events.map((e) => (e.id === eventId ? { ...e, isRegistered: true } : e)),
      }));
      return true;
    },
    [currentUser, mutate, commit, requestAuth],
  );

  /* ------------------------------ derived data ------------------------------ */
  const savedArticles = useMemo(() => snap.articles.filter((a) => snap.bookmarkedArticleIds.includes(a.id)), [snap.articles, snap.bookmarkedArticleIds]);
  const savedPosts = useMemo(() => snap.posts.filter((p) => p.userSaved || snap.savedPostIds.includes(p.id)), [snap.posts, snap.savedPostIds]);
  const savedCount = savedArticles.length + savedPosts.length;
  const readerArticle = useMemo(() => snap.articles.find((a) => a.id === readerId || a.slug === readerId) ?? null, [snap.articles, readerId]);

  const viewedProfile = useMemo<UserProfile | null>(() => {
    const raw = params.userId ? decodeURIComponent(params.userId) : '';
    if (!raw || raw === 'me') return currentUser;
    const clean = raw.toLowerCase().replace(/^@/, '');
    return snap.profiles.find((p) => p.id === raw || p.handle.toLowerCase() === clean) ?? null;
  }, [params.userId, currentUser, snap.profiles]);

  const openPhotoPopup = useCallback((images: string[], index = 0, title?: string, subtitle?: string, authorName?: string, authorId?: string) => {
    const valid = images.filter(Boolean);
    if (valid.length) setLightbox({ images: valid, index, title, subtitle, authorName, authorId });
  }, []);

  const loading = supaStatus === 'checking';
  const [splashEligible] = useState(() => shouldShowSplash());

  const routeKey = (prefix: string) => {
    const m = location.pathname.match(new RegExp(`^/${prefix}/([^/]+)`));
    return m ? decodeURIComponent(m[1]) : '';
  };
  const standaloneArticleKey = routeKey('article');
  const standaloneArticle = standaloneArticleKey
    ? (snap.articles.find((a) => a.id === standaloneArticleKey || a.slug === standaloneArticleKey) ?? null)
    : null;

  const writeArticleAction = () =>
    currentUser ? setWriteOpen(true) : requestAuth('প্রতিবেদন লিখতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setWriteOpen(true));
  const uploadAction = () =>
    currentUser ? setReelUploadOpen(true) : requestAuth('ভিডিও বা রিল আপলোড করতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setReelUploadOpen(true));

  const backButton = (label: string, title?: string) => (
    <div className="mb-3 flex items-center justify-between px-2 sm:px-0">
      <button
        type="button"
        onClick={() => goNavigate('/')}
        title={title ?? label}
        aria-label={title ?? label}
        className="inline-flex size-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200/90 bg-white text-xs font-bold text-slate-800 shadow-xs transition hover:border-[#03EF62] hover:text-emerald-700 active:scale-95 dark:border-white/10 dark:bg-canvas-card dark:text-slate-100 dark:hover:text-[#03EF62] sm:size-auto sm:rounded-xl sm:px-3.5 sm:py-2"
      >
        <ArrowLeft className="size-4 shrink-0" />
        <span className="hidden font-bangla text-[13px] sm:inline">{label}</span>
      </button>
    </div>
  );

  const mainContent = (() => {
    const path = location.pathname;

    if (path.startsWith('/article/')) {
      if (!standaloneArticle) {
        if (!isMissing('article', standaloneArticleKey)) return <ArticleReaderSkeleton />;
        return <NotFound title="প্রতিবেদনটি পাওয়া যায়নি" text="এই প্রতিবেদনটি বর্তমানে পাওয়া যাচ্ছে না বা মুছে ফেলা হয়েছে।" onHome={() => goNavigate('/')} />;
      }
      return (
        <div className="space-y-4">
          {backButton('ফিডে ফিরে যান', 'হোম ফিডে ফিরে যান')}
          <ArticleReaderContent
            article={standaloneArticle}
            bookmarked={snap.bookmarkedArticleIds.includes(standaloneArticle.id)}
            currentUser={currentUser}
            isStandalonePage
            onClose={() => goNavigate('/')}
            onReact={(type) => handleReact('article', standaloneArticle.id, type)}
            onOpenReactionsBreakdown={() => setRxBreakdown({ targetType: 'article', targetId: standaloneArticle.id })}
            onBookmark={() => handleBookmarkArticle(standaloneArticle.id)}
            onComment={(t, pid, rta) => handleCommentArticle(standaloneArticle.id, t, pid, rta)}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onReactComment={(cid, type) => handleReact('comment', cid, type)}
            onShare={() => handleShare(standaloneArticle.title)}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={(src, title, subtitle, authorName, authorId) => openPhotoPopup([src], 0, title, subtitle, authorName, authorId)}
          />
        </div>
      );
    }

    if (path.startsWith('/events/')) {
      const eventId = routeKey('events');
      if (loading && snap.events.length === 0) return <EventsPageSkeleton />;
      const foundEvent = snap.events.find((e) => e.id === eventId);
      return (
        <EventDetailPage
          eventId={eventId}
          event={foundEvent}
          events={snap.events}
          isRegistered={foundEvent ? snap.eventRegistrations.includes(foundEvent.id) : false}
          onBack={() => goNavigate('/events')}
          onNavigate={goNavigate}
          onOpenRegister={(ev) => (currentUser ? setRegistrationEvent(ev) : requestAuth('ইভেন্টে নিবন্ধন করতে অনুগ্রহ করে লগইন করুন।', () => setRegistrationEvent(ev)))}
          onShare={(title) => handleShare(title)}
        />
      );
    }

    if (path.startsWith('/post/')) {
      const postId = routeKey('post');
      const foundPost = snap.posts.find((p) => p.id === postId);
      if (!foundPost) {
        if (!isMissing('post', postId)) return <FeedPageSkeleton />;
        return <NotFound title="পোস্টটি পাওয়া যায়নি" text="এই পোস্টটি বর্তমানে পাওয়া যাচ্ছে না বা মুছে ফেলা হয়েছে।" onHome={() => goNavigate('/')} />;
      }
      return (
        <div className="space-y-4">
          {backButton('হোম ফিডে ফিরুন')}
          <CommunityPostCard
            key={foundPost.id}
            post={foundPost}
            currentUser={currentUser}
            onReact={(type) => handleReact('post', foundPost.id, type)}
            onOpenReactionsBreakdown={() => setRxBreakdown({ targetType: 'post', targetId: foundPost.id })}
            onSave={() => handleSavePost(foundPost.id)}
            onComment={(t, pid, rta) => handleCommentPost(foundPost.id, t, pid, rta)}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onReactComment={(cid, type) => handleReact('comment', cid, type)}
            onShare={() => handleShare(foundPost.content, `/post/${foundPost.id}`)}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={(imgs, idx, t, an, ai) => openPhotoPopup(imgs, idx, t, undefined, an, ai)}
          />
        </div>
      );
    }

    switch (activeView) {
      case 'explore':
        if (loading && snap.articles.length === 0) return <ExplorePageSkeleton />;
        return (
          <ExploreView
            articles={snap.articles}
            currentUser={currentUser}
            pillar={pillar}
            onPillar={setPillar}
            onOpenArticlePopup={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
            isLoading={loading}
            onOpenPhoto={(src, title, authorName, authorId) => openPhotoPopup([src], 0, title, undefined, authorName, authorId)}
          />
        );
      case 'events':
        if (loading && snap.events.length === 0) return <EventsPageSkeleton />;
        return (
          <EventsView
            events={snap.events}
            onNavigate={goNavigate}
            isLoading={loading}
            onOpenRegister={(ev) => (currentUser ? setRegistrationEvent(ev) : requestAuth('ইভেন্টে নিবন্ধন করতে অনুগ্রহ করে লগইন করুন।', () => setRegistrationEvent(ev)))}
          />
        );
      case 'editorial':
        return (
          <Suspense fallback={<ResearcherStudioSkeleton />}>
            <EditorialDashboard articles={snap.articles} currentUser={currentUser} onNavigate={goNavigate} />
          </Suspense>
        );
      case 'notifications':
        if (loading) return <NotificationsPageSkeleton />;
        return (
          <NotificationsView
            items={snap.notifications}
            onRead={handleReadAllNotifications}
            onToggleRead={handleToggleNotificationRead}
            onDelete={handleDeleteNotification}
            onNavigate={goNavigate}
            isLoading={loading}
            onOpenArticle={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
          />
        );
      case 'profile': {
        const rawKey = params.userId ? decodeURIComponent(params.userId) : '';
        if (!viewedProfile && rawKey && rawKey !== 'me') {
          if (!isMissing('profile', rawKey)) return <ProfilePageSkeleton />;
          return <NotFound title="প্রোফাইলটি পাওয়া যায়নি" text="এই ব্যবহারকারীকে খুঁজে পাওয়া যায়নি।" onHome={() => goNavigate('/')} />;
        }
        if (loading) return <ProfilePageSkeleton />;
        const isOwn = Boolean(currentUser && viewedProfile && viewedProfile.id === currentUser.id);
        const targetId = viewedProfile?.id || '';
        return (
          <ProfileView
            profile={viewedProfile}
            isOwnProfile={isOwn}
            isFollowing={snap.followingIds.includes(targetId)}
            currentUser={currentUser}
            authorArticles={snap.articles.filter((a) => a.authorId === targetId)}
            authorPosts={snap.posts.filter((p) => p.authorId === targetId)}
            authorStories={snap.stories.filter((s) => s.authorId === targetId)}
            savedArticles={savedArticles}
            savedPosts={savedPosts}
            bookmarkIds={snap.bookmarkedArticleIds}
            dark={dark}
            onToggleDark={toggleDark}
            isLoading={loading}
            onToggleFollow={() => handleToggleFollow(targetId)}
            onOpenProfileSettings={() => setProfileSettingsOpen(true)}
            onOpenAuth={() => requestAuth('লগইন বা সাইন আপ করুন')}
            onLogout={handleLogout}
            onOpenArticlePopup={handleOpenArticlePopup}
            onReact={handleReact}
            onOpenReactionsBreakdown={(targetType, tId) => setRxBreakdown({ targetType, targetId: tId })}
            onBookmarkArticle={handleBookmarkArticle}
            onCommentArticle={handleCommentArticle}
            onSavePost={handleSavePost}
            onCommentPost={handleCommentPost}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onShare={handleShare}
            onRemoveSavedArticle={handleBookmarkArticle}
            onRemoveSavedPost={handleSavePost}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={openPhotoPopup}
            onOpenCreatePost={uploadAction}
            onOpenCreateStory={() => {
              if (!canCreateStory(currentUser)) {
                toast.error('স্টোরি তৈরির অনুমতি কেবল সম্পাদকীয় অ্যাকাউন্টের রয়েছে।');
                return;
              }
              setReelUploadOpen(true);
            }}
            onOpenWriteArticle={writeArticleAction}
            onDeletePost={handleDeletePost}
            onDeleteStory={handleDeleteStory}
            onDeleteArticle={handleDeleteArticle}
            onOpenStory={(id: string) => setStoryViewerId(id)}
          />
        );
      }
      case 'security':
        if (loading) return <ResearcherStudioSkeleton />;
        return (
          <Suspense fallback={<ResearcherStudioSkeleton />}>
            <AccountSecurityView currentUser={currentUser} onLogout={handleLogout} onOpenProfileSettings={() => setProfileSettingsOpen(true)} />
          </Suspense>
        );
      default:
        if (loading && snap.articles.length === 0 && snap.posts.length === 0) return <FeedPageSkeleton />;
        return (
          <CentralFeed
            currentUser={currentUser}
            articles={snap.articles}
            posts={snap.posts}
            stories={snap.stories}
            reels={snap.reels}
            savedReelIds={snap.savedReelIds}
            followingIds={snap.followingIds}
            bookmarkIds={snap.bookmarkedArticleIds}
            isLoading={loading}
            onWriteArticle={writeArticleAction}
            onUploadVideo={uploadAction}
            onOpenProfileSettings={() =>
              currentUser ? setProfileSettingsOpen(true) : requestAuth('প্রোফাইল সেটিংস পরিবর্তন করতে দয়া করে লগইন করুন।', () => setProfileSettingsOpen(true))
            }
            onOpenStory={(target) => {
              if (typeof target === 'string') setStoryViewerId(target);
              else if (typeof target === 'number' && snap.stories[target]) setStoryViewerId(snap.stories[target].id);
            }}
            onCreateStory={() => {
              if (!canCreateStory(currentUser)) {
                toast.error('স্টোরি তৈরির অনুমতি কেবল সম্পাদকীয় অ্যাকাউন্টের রয়েছে।');
                return;
              }
              setReelUploadOpen(true);
            }}
            onOpenArticlePopup={handleOpenArticlePopup}
            onReact={handleReact}
            onOpenReactionsBreakdown={(targetType, tId) => setRxBreakdown({ targetType, targetId: tId })}
            onBookmarkArticle={handleBookmarkArticle}
            onCommentArticle={handleCommentArticle}
            onSavePost={handleSavePost}
            onCommentPost={handleCommentPost}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onShare={handleShare}
            onPlayReel={(i) => {
              if (reelPlayerItems.length > 0) setPlayer({ items: reelPlayerItems, start: i });
            }}
            onSaveReel={handleSaveReel}
            onToggleFollow={handleToggleFollow}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={openPhotoPopup}
          />
        );
    }
  })();

  const breakdownCounts = useMemo(() => {
    if (!rxBreakdown) return undefined;
    if (rxBreakdown.targetType === 'article') return snap.articles.find((a) => a.id === rxBreakdown.targetId)?.reactionCounts;
    if (rxBreakdown.targetType === 'post') return snap.posts.find((p) => p.id === rxBreakdown.targetId)?.reactionCounts;
    return undefined;
  }, [rxBreakdown, snap.articles, snap.posts]);

  const isHomePage = activeView === 'home' && location.pathname === '/';

  return (
    <div className={cn('flex min-h-screen flex-col justify-between bg-canvas text-slate-900 dark:text-white', dark && 'dark')}>
      {splashEligible && (
        <Suspense fallback={null}>
          <SiteLoader />
        </Suspense>
      )}
      <Header
        activeView={activeView}
        onNavigate={goNavigate}
        currentUser={currentUser}
        dark={dark}
        onToggleDark={toggleDark}
        savedCount={savedCount}
        reelsCount={snap.reels.length}
        onOpenSaved={() => setSavedOpen(true)}
        onOpenReels={() => {
          if (reelPlayerItems.length > 0) setPlayer({ items: reelPlayerItems, start: 0 });
          else uploadAction();
        }}
        notifications={snap.notifications}
        onReadNotifications={handleReadAllNotifications}
        onToggleNotificationRead={handleToggleNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onOpenAuth={() => requestAuth('লগইন বা সাইন আপ করুন')}
        onLogout={handleLogout}
        onOpenProfileSettings={() => setProfileSettingsOpen(true)}
        articles={snap.articles}
        posts={snap.posts}
        stories={snap.stories}
        onOpenArticle={handleOpenArticlePopup}
        onNavigateProfile={navigateToProfile}
      />

      {isHomePage ? (
        <div className="relative min-h-[calc(100vh-65px)] w-full">
          <div className="mx-auto flex max-w-[1240px] items-start justify-center gap-6 px-3 sm:px-4 md:px-6 xl:max-w-[1300px] xl:gap-8 2xl:max-w-[1380px]">
            <RightSidebar
              articles={snap.articles}
              events={snap.events}
              profiles={snap.profiles}
              currentUserId={currentUser?.id || ''}
              followingIds={snap.followingIds}
              onOpenRegister={(ev) => (currentUser ? setRegistrationEvent(ev) : requestAuth('ইভেন্টে নিবন্ধন করতে অনুগ্রহ করে লগইন করুন।', () => setRegistrationEvent(ev)))}
              onToggleFollow={handleToggleFollow}
              onOpenArticlePopup={handleOpenArticlePopup}
              onNavigateProfile={navigateToProfile}
              onNavigate={goNavigate}
              onOpenPhoto={(src, title, authorName, authorId) => openPhotoPopup([src], 0, title, undefined, authorName, authorId)}
            />
            <main className="min-w-0 max-w-[760px] flex-1 pb-12 pt-3 xl:max-w-[800px]">
              <h1 className="sr-only">PLAiNSYT · কৃষি ও কৃষি-প্রযুক্তি প্ল্যাটফর্ম</h1>
              {mainContent}
            </main>
          </div>
        </div>
      ) : (
        <div className="relative min-h-[calc(100vh-65px)] w-full">
          <main className="mx-auto min-w-0 max-w-4xl px-4 pb-12 pt-4 xl:max-w-5xl">{mainContent}</main>
        </div>
      )}

      <Suspense fallback={null}>
        {writeOpen && <CreatePostModal open={writeOpen} onClose={() => handleUiCloseModal(() => setWriteOpen(false))} currentUser={currentUser} onPublish={handlePublishArticle} />}
        {reelUploadOpen && <FacebookCreatePostModal open={reelUploadOpen} onClose={() => handleUiCloseModal(() => setReelUploadOpen(false))} currentUser={currentUser} onSubmitReel={handlePublishReel} />}
      </Suspense>
      <SavedArticlesModal
        open={savedOpen}
        onClose={() => handleUiCloseModal(() => setSavedOpen(false))}
        articles={savedArticles}
        posts={savedPosts}
        onOpenArticle={handleOpenArticlePopup}
        onRemoveArticle={handleBookmarkArticle}
        onRemovePost={handleSavePost}
      />
      <ArticleReaderModal
        article={readerArticle}
        bookmarked={!!readerArticle && snap.bookmarkedArticleIds.includes(readerArticle.id)}
        currentUser={currentUser}
        onClose={() => handleUiCloseModal(() => setReaderId(null))}
        onReact={(type) => readerArticle && handleReact('article', readerArticle.id, type)}
        onOpenReactionsBreakdown={() => readerArticle && setRxBreakdown({ targetType: 'article', targetId: readerArticle.id })}
        onBookmark={() => readerArticle && handleBookmarkArticle(readerArticle.id)}
        onComment={(t, pid, rta) => readerArticle && handleCommentArticle(readerArticle.id, t, pid, rta)}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReactComment={(cid, type) => handleReact('comment', cid, type)}
        onShare={() => readerArticle && handleShare(readerArticle.title, `/article/${readerArticle.slug || readerArticle.id}`)}
        onNavigateProfile={navigateToProfile}
        onOpenPhoto={(src, title, subtitle, authorName, authorId) => openPhotoPopup([src], 0, title, subtitle, authorName, authorId)}
      />
      <Suspense fallback={null}>
        {storyViewerId && (
          <StoryViewerModal
            open={!!storyViewerId}
            initialStoryId={storyViewerId}
            stories={snap.stories}
            currentUser={currentUser}
            followingIds={snap.followingIds}
            onClose={() => handleUiCloseModal(() => setStoryViewerId(null))}
            onToggleFollow={handleToggleFollow}
            onOpenAuth={() => requestAuth('অনুগ্রহ করে লগইন করুন')}
            onNavigateProfile={navigateToProfile}
      />
        )}
        {player && (
          <ReelPlayerModal
        items={player?.items ?? null}
        start={player?.start ?? 0}
        currentUser={currentUser}
        comments={snap.comments}
        onClose={() => handleUiCloseModal(() => setPlayer(null))}
        onShare={handleShare}
        onOpenAuth={() => requestAuth('মন্তব্য বা প্রতিক্রিয়া জানাতে অনুগ্রহ করে লগইন করুন')}
        onComment={handleCommentStoryOrReel}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReactStory={(id) => handleReact('reel', id, 'like')}
        onBookmarkStory={handleSaveReel}
      />
        )}
      </Suspense>
      <PhotoLightboxModal payload={lightbox} onClose={() => handleUiCloseModal(() => setLightbox(null))} onNavigateProfile={navigateToProfile} />
      <ReactionBreakdownModal
        open={!!rxBreakdown}
        onClose={() => handleUiCloseModal(() => setRxBreakdown(null))}
        records={rxRecords}
        counts={breakdownCounts}
        onNavigateProfile={navigateToProfile}
      />
      <Suspense fallback={null}>
        {profileSettingsOpen && <ProfileSettingsModal open={profileSettingsOpen} onClose={() => handleUiCloseModal(() => setProfileSettingsOpen(false))} currentUser={currentUser} onSaveProfile={handleSaveProfile} />}
      </Suspense>
      <EventRegistrationModal
        open={!!registrationEvent}
        event={registrationEvent}
        currentUser={currentUser}
        onClose={() => handleUiCloseModal(() => setRegistrationEvent(null))}
        onConfirmRegistration={(eventId, data) => handleConfirmRegistration(eventId, data)}
      />
      <AuthModal
        open={authModalOpen}
        promptReason={authPromptReason}
        reason={authPromptReason}
        onClose={() =>
          handleUiCloseModal(() => {
            setAuthModalOpen(false);
            pendingActionRef.current = null;
          })
        }
        onSuccess={handleAuthSuccess}
      />
      <DeleteCommentAlertModal
        isOpen={Boolean(pendingDeleteCommentId)}
        isReply={isPendingCommentReply}
        onClose={() => setPendingDeleteCommentId(null)}
        onConfirm={handleConfirmDeleteComment}
      />
      <Toaster
        position="bottom-center"
        duration={1600}
        toastOptions={{
          duration: 1600,
          className: 'font-bangla !rounded-xl !border !border-[#04301f] !shadow-[3px_3px_0_#04301f] !bg-[#fdfaf5] !text-[#04301f]',
        }}
      />
    </div>
  );
}
