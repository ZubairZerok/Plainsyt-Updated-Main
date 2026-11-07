import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoredAuthUser, logoutUser, setStoredAuth, resolveEmailAlias, isZubairIdentifier, ADMIN_PROFILE, ZUBAIR_PROFILE, ZUBAIR_PROD_PROFILE, canCreateStory } from '../lib/auth';
import {
  readSnapshot, writeSnapshot, fetchFromSupabase, syncLocalToSupabase, mutateSnapshotReaction,
  DEFAULT_SEED_SNAPSHOT,
  dbUpsertProfile, dbUpsertArticle, dbUpsertPost, dbInsertComment, dbUpdateComment, dbDeleteComment, dbSetReaction,
  dbUpsertReel, dbUpsertStory, dbUpsertProduct, dbInsertOrder, dbUpsertEvent,
  dbUpsertResearchPaper, dbUpsertIdea, dbDeletePost, dbDeleteArticle, dbDeleteStory,
  dbUpdateNotificationRead, dbDeleteNotification, dbMarkAllNotificationsRead, dbInsertNotification, dbToggleFollow,
  type DatabaseSnapshot, type SupabaseConnectionStatus,
} from '../lib/db';
import type {
  Article, BkashOrder, CommunityPost, LightboxPayload, LinkedInReactionType,
  NotificationItem, ReactionTargetType, ResearchPaper, StoryReel, StoreProduct, TopicStory, UpcomingEvent, UserProfile,
} from '../types';
import {
  toggleBookmarkId, appendArticleComment, appendPostComment, makeComment, toBengaliNumerals,
} from '../utils/pureLogic';
import { Header, LAYOUT_GRID, FEED_WIDTH, type View } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { CentralFeed } from './CentralFeed';
import { FacebookCreatePostModal } from './FacebookCreatePostModal';
import { ArticleReaderModal, ArticleReaderContent } from './ArticleReaderModal';
import { ReelPlayerModal, type PlayerItem } from './ReelPlayerModal';
import { StoryViewerModal } from './StoryViewerModal';
import { SavedArticlesModal } from './SavedArticlesModal';
import { CreatePostModal } from './CreatePostModal';
import { ExploreView, EventsView, NotificationsView, ProfileView } from './Views';
import { EditorialDashboard } from './EditorialDashboard';
import {
  PublicationsStudioView,
  AccountSecurityView,
} from './ResearcherViews';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { DeleteCommentAlertModal } from './DeleteCommentAlertModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { ReactionBreakdownModal } from './LinkedInReactionBar';
import { SiteLoader } from './SiteLoader';
import { EventRegistrationModal } from './EventRegistrationModal';
import { EventDetailPage } from './EventDetailPage';
import { AuthModal } from './AuthModal';
import {
  FeedPageSkeleton,
  ExplorePageSkeleton,
  EventsPageSkeleton,
  NotificationsPageSkeleton,
  ProfilePageSkeleton,
  ResearcherStudioSkeleton,
  ArticleReaderSkeleton,
} from './Skeletons';
import { FEED_CARD, cn } from './Primitives';

const MAIN_TABS = ['/', '/explore', '/events', '/notifications'];

export function RootShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ userId?: string; articleId?: string; eventId?: string }>();

  const [snap, setSnap] = useState<DatabaseSnapshot>(() => readSnapshot());
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const [supaStatus, setSupaStatus] = useState<SupabaseConnectionStatus>('checking');
  const [supaError, setSupaError] = useState<string | undefined>();
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('plainsyt_dark_theme');
      if (saved !== null) return saved === 'true';
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('plainsyt_dark_theme', String(dark));
  }, [dark]);

  // Active modals/popups
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
  const [pillar, setPillar] = useState<string | null>(null);
  const [savedReelIds, setSavedReelIds] = useState<string[]>([]);

  const commit = useCallback((updater: (prev: DatabaseSnapshot) => DatabaseSnapshot) => {
    setSnap((prev) => {
      const next = updater(prev);
      writeSnapshot(next);
      return next;
    });
  }, []);

  const refreshFromSupabase = useCallback(async () => {
    const res = await fetchFromSupabase(60);
    setSupaStatus(res.status);
    setSupaError(res.errorMessage);
    if (res.snapshot) {
      setSnap(res.snapshot);
    }
  }, []);

    const syncUserSession = useCallback(
    async (u: { id: string; email?: string | null; user_metadata?: Record<string, any> }) => {
      if (!u || !u.id) return;
      const userEmail = u.email || '';
      const alias = resolveEmailAlias(userEmail);
      let profile: UserProfile;

      let dbProfile: any = null;
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
        dbProfile = data;
      } catch {
        // Non-blocking fetch
      }

      const currentProfiles = snapRef.current.profiles;

      if (alias.isAdmin) {
        const existingAdmin = currentProfiles.find((pr) => pr.id === 'usr-plainsyt-admin') || getStoredAuthUser();
        profile = {
          ...ADMIN_PROFILE,
          ...existingAdmin,
          ...(dbProfile
            ? {
                name: dbProfile.name || ADMIN_PROFILE.name,
                nameBn: dbProfile.name_bn || ADMIN_PROFILE.nameBn,
                avatar: dbProfile.avatar || ADMIN_PROFILE.avatar,
                bio: dbProfile.bio || ADMIN_PROFILE.bio,
              }
            : {}),
          avatar: existingAdmin?.avatar || ADMIN_PROFILE.avatar,
          email: userEmail || ADMIN_PROFILE.email,
        };
      } else if (alias.canonicalUserId === 'usr-zubair' || isZubairIdentifier(u.id) || isZubairIdentifier(userEmail)) {
        const storedAuth = getStoredAuthUser();
        const existingZubair =
          currentProfiles.find((pr) => isZubairIdentifier(pr.id) || isZubairIdentifier(pr.email)) ||
          (storedAuth && isZubairIdentifier(storedAuth.id) ? storedAuth : null);
        const resolvedAvatar =
          dbProfile?.avatar && !dbProfile.avatar.includes('unsplash.com') && !dbProfile.avatar.includes('hasan_zubair.png')
            ? dbProfile.avatar
            : existingZubair?.avatar && !existingZubair.avatar.includes('unsplash.com') && !existingZubair.avatar.includes('hasan_zubair.png')
              ? existingZubair.avatar
              : ZUBAIR_PROFILE.avatar;
        profile = {
          ...ZUBAIR_PROFILE,
          ...existingZubair,
          ...(dbProfile
            ? {
                name: dbProfile.name || 'Hasan Zubair',
                nameBn: dbProfile.name_bn || 'হাসান জুবায়ের',
                avatar: resolvedAvatar,
                bio: dbProfile.bio || ZUBAIR_PROFILE.bio,
              }
            : {}),
          id: u.id, // Strictly retain user's live auth UUID (e.g. 55dba730-185d-4c61-bee8-6b9ab22e3703)!
          name: dbProfile?.name || existingZubair?.name || 'Hasan Zubair',
          nameBn: dbProfile?.name_bn || existingZubair?.nameBn || 'হাসান জুবায়ের',
          handle: 'hasanzubair',
          role: dbProfile?.role || existingZubair?.role || ZUBAIR_PROFILE.role,
          organization: dbProfile?.organization || existingZubair?.organization || ZUBAIR_PROFILE.organization,
          avatar: resolvedAvatar,
          bio: dbProfile?.bio || existingZubair?.bio || ZUBAIR_PROFILE.bio,
          email: userEmail || existingZubair?.email || ZUBAIR_PROFILE.email,
        };
      } else {
        const existing =
          currentProfiles.find((pr) => pr.id === u.id || (userEmail && pr.email === userEmail)) || getStoredAuthUser();
        const metaName = u.user_metadata?.full_name || u.user_metadata?.name || u.user_metadata?.user_name;
        const avatarFromMeta = u.user_metadata?.avatar_url || u.user_metadata?.picture;
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'PLAiNSYT Member';
        const rawHandle = (userEmail ? userEmail.split('@')[0] : 'user')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_');
        const cleanHandle = `${rawHandle}_${u.id.replace(/-/g, '').slice(0, 4)}`;

        profile = {
          id: u.id,
          name: dbProfile?.name || existing?.name || metaName || fallbackName,
          nameBn: dbProfile?.name_bn || existing?.nameBn || metaName || fallbackName,
          handle: dbProfile?.handle || existing?.handle || cleanHandle,
          role: dbProfile?.role || existing?.role || 'সদস্য',
          organization: dbProfile?.organization || existing?.organization || 'PLAiNSYT Platform',
          location: dbProfile?.location || existing?.location || 'বাংলাদেশ',
          bio: dbProfile?.bio || existing?.bio || 'PLAiNSYT কমিউনিটি সদস্য।',
          avatar:
            dbProfile?.avatar ||
            avatarFromMeta ||
            existing?.avatar ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          coverGradient:
            dbProfile?.cover_gradient ||
            existing?.coverGradient ||
            'linear-gradient(135deg, #061621 0%, #03EF62 100%)',
          isVerified: Boolean(dbProfile?.is_verified ?? existing?.isVerified),
          focusArea: dbProfile?.focus_area || existing?.focusArea || 'কৃষি ও প্রযুক্তি',
          email: userEmail,
          publicationsCount: dbProfile?.publications_count || existing?.publicationsCount || 0,
          followersCount: dbProfile?.followers_count || existing?.followersCount || 0,
          followingCount: dbProfile?.following_count || existing?.followingCount || 0,
          createdAt: dbProfile?.created_at || existing?.createdAt || new Date().toISOString(),
        };

        // Only insert if it is a brand-new user without an existing row in Supabase profiles
        if (!dbProfile && !alias.isAdmin && alias.canonicalUserId !== 'usr-zubair') {
          dbUpsertProfile(profile);
        }
      }

      setStoredAuth(profile, userEmail || null);
      commit((prev) => {
        const exists = prev.profiles.some((p) => p.id === profile.id);
        const profiles = exists
          ? prev.profiles.map((p) => (p.id === profile.id ? { ...p, ...profile } : p))
          : [profile, ...prev.profiles];
        return { ...prev, profiles, currentUserId: profile.id };
      });
    },
    [commit],
  );

  useEffect(() => {
    refreshFromSupabase();
    const channel = supabase
      .channel('plainsyt-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshFromSupabase();
      })
      .subscribe();

    // 1. Handle Google OAuth tokens, PKCE codes, and errors
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashClean = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashClean);

      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const authCode = searchParams.get('code');

      if (accessToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken || accessToken,
          })
          .then(async ({ data, error }) => {
            if (data?.session?.user && !error) {
              await syncUserSession(data.session.user);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      } else if (authCode) {
        supabase.auth
          .exchangeCodeForSession(authCode)
          .then(async ({ data, error }) => {
            if (data?.session?.user && !error) {
              await syncUserSession(data.session.user);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(() => {});
      } else if (hashClean.includes('access_token=')) {
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 1000);
      }
    }

    // 2. Fetch existing session immediately on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (session?.user && !error) {
        syncUserSession(session.user);
        if (
          window.location.hash.includes('access_token') ||
          window.location.search.includes('code=')
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    // 3. Listen to auth state transitions
    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setStoredAuth(null, null);
        commit((prev) => ({ ...prev, currentUserId: '' }));
      } else if (session?.user) {
        await syncUserSession(session.user);
        if (
          window.location.hash.includes('access_token') ||
          window.location.search.includes('code=')
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    });

    return () => {
      supabase.removeChannel(channel);
      authSub?.subscription.unsubscribe();
    };
  }, [refreshFromSupabase, commit, syncUserSession]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | undefined>();
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const currentUser = useMemo(() => {
    const stored = getStoredAuthUser();
    const activeId = snap.currentUserId || stored?.id;
    if (!activeId) return null;
    const found = snap.profiles.find((p) => p.id === activeId);
    if (found) return found;
    if (stored && stored.id === activeId) return stored;
    return null;
  }, [snap.profiles, snap.currentUserId]);

  // --- Mobile Back Button & Modal History Manager ---
  const modalHistoryDepthRef = useRef<number>(0);
  const isClosingViaUiRef = useRef<boolean>(false);
  const lastBackPressRef = useRef<number>(0);

  // Active modals in reverse stack order
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
  }, [
    readerId,
    storyViewerId,
    player,
    writeOpen,
    reelUploadOpen,
    savedOpen,
    profileSettingsOpen,
    registrationEvent,
    rxBreakdown,
    authModalOpen,
    lightbox,
  ]);

  const prevModalCountRef = useRef<number>(0);

  // When a modal opens, push history entry so hardware back can close it
  useEffect(() => {
    const currentCount = activeModals.length;
    const prevCount = prevModalCountRef.current;

    if (currentCount > prevCount) {
      const diff = currentCount - prevCount;
      for (let i = 0; i < diff; i++) {
        modalHistoryDepthRef.current += 1;
        window.history.pushState(
          { plainsytModal: true, depth: modalHistoryDepthRef.current },
          '',
          window.location.href,
        );
      }
    }
    prevModalCountRef.current = currentCount;
  }, [activeModals.length]);

  // Unified function to close the foreground modal
  const closeTopModal = useCallback(() => {
    if (storyViewerId) {
      setStoryViewerId(null);
      return true;
    }
    if (lightbox) {
      setLightbox(null);
      return true;
    }
    if (authModalOpen) {
      setAuthModalOpen(false);
      setPendingAction(null);
      return true;
    }
    if (rxBreakdown) {
      setRxBreakdown(null);
      return true;
    }
    if (registrationEvent) {
      setRegistrationEvent(null);
      return true;
    }
    if (profileSettingsOpen) {
      setProfileSettingsOpen(false);
      return true;
    }
    if (savedOpen) {
      setSavedOpen(false);
      return true;
    }
    if (reelUploadOpen) {
      setReelUploadOpen(false);
      return true;
    }
    if (writeOpen) {
      setWriteOpen(false);
      return true;
    }
    if (player) {
      setPlayer(null);
      return true;
    }
    if (readerId) {
      setReaderId(null);
      return true;
    }
    if (storyViewerId) {
      setStoryViewerId(null);
      return true;
    }
    return false;
  }, [
    lightbox,
    authModalOpen,
    rxBreakdown,
    registrationEvent,
    profileSettingsOpen,
    savedOpen,
    reelUploadOpen,
    writeOpen,
    player,
    readerId,
    storyViewerId,
  ]);

  // When user clicks UI "X" or backdrop to close modal:
  const handleUiCloseModal = useCallback((closeAction: () => void) => {
    closeAction();
    if (modalHistoryDepthRef.current > 0) {
      modalHistoryDepthRef.current -= 1;
      isClosingViaUiRef.current = true;
      window.history.back();
    }
  }, []);

  // Mobile history sentinel to prevent mobile browser back button from abruptly closing the website
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!window.history.state?.plainsytApp) {
        window.history.replaceState({ plainsytApp: true, root: true }, '', window.location.href);
        window.history.pushState({ plainsytApp: true, active: true }, '', window.location.href);
      }
    } catch {
      // Safe fallback
    }
  }, []);

  // Global popstate navigation & back button guard
  useEffect(() => {
    const handlePopState = () => {
      // If close was triggered by UI button, history is already popped
      if (isClosingViaUiRef.current) {
        isClosingViaUiRef.current = false;
        return;
      }

      // If a modal is open, intercept back button to close modal and STAY on site!
      if (activeModals.length > 0) {
        if (modalHistoryDepthRef.current > 0) {
          modalHistoryDepthRef.current -= 1;
        }
        closeTopModal();
        try {
          window.history.pushState({ plainsytApp: true, active: true }, '', window.location.href);
        } catch {
          // ignore
        }
        return;
      }

      // If on subroute: navigate back towards home '/' and stay inside website
      if (window.location.pathname !== '/' || location.pathname !== '/') {
        navigate('/', { replace: false });
        try {
          window.history.pushState({ plainsytApp: true, active: true }, '', '/');
        } catch {
          // ignore
        }
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeModals.length, closeTopModal, location.pathname, navigate]);

  // Mobile horizontal swipe between top-level tabs (Facebook/Twitter style)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (activeModals.length > 0) return;
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return;

      const scrollable = target.closest(
        '[data-swipe-ignore], [role="tablist"], .overflow-x-auto, .overflow-x-scroll, .embla, pre'
      );
      if (scrollable) return;

      let el: HTMLElement | null = target;
      while (el && el !== document.body) {
        if (
          el.scrollWidth > el.clientWidth &&
          (window.getComputedStyle(el).overflowX === 'auto' || window.getComputedStyle(el).overflowX === 'scroll')
        ) {
          return;
        }
        el = el.parentElement;
      }

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isTracking = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking) return;
      isTracking = false;
      if (e.changedTouches.length !== 1) return;

      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      if (deltaTime > 600) return;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < 65 || absX < absY * 1.8 || absY > 80) return;

      const currentPath = location.pathname;
      const currentIndex = MAIN_TABS.indexOf(currentPath);
      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Swiped Left -> Advance to next tab
        if (currentIndex < MAIN_TABS.length - 1) {
          navigate(MAIN_TABS[currentIndex + 1]);
        }
      } else {
        // Swiped Right -> Go back to previous tab
        if (currentIndex > 0) {
          navigate(MAIN_TABS[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeModals.length, location.pathname, navigate]);

  const requestAuth = useCallback((reason: string, onAuthed?: () => void) => {
    setAuthPromptReason(reason);
    if (onAuthed) {
      setPendingAction(() => onAuthed);
    } else {
      setPendingAction(null);
    }
    setAuthModalOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(
    (profile: UserProfile) => {
      commit((prev) => ({
        ...prev,
        profiles: prev.profiles.some((p) => p.id === profile.id)
          ? prev.profiles.map((p) => (p.id === profile.id ? profile : p))
          : [profile, ...prev.profiles],
        currentUserId: profile.id,
      }));
      setAuthModalOpen(false);
      if (pendingAction) {
        setTimeout(() => {
          pendingAction();
          setPendingAction(null);
        }, 100);
      }
    },
    [commit, pendingAction],
  );

  const handleLogout = useCallback(async () => {
    await logoutUser();
    commit((prev) => ({ ...prev, currentUserId: '' }));
  }, [commit]);

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

  const [isPageLoading, setIsPageLoading] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setIsPageLoading(true);
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 260);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  // Deep-link direct URL access for reels (/reel/:id or /reels/:id)
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/reel/') || p.startsWith('/reels/')) {
      const rid = decodeURIComponent(p.replace(/^\/reels?\//, ''));
      const rIdx = snap.reels.findIndex((r) => r.id === rid);
      if (rIdx >= 0) {
        setPlayerStart(rIdx);
        setPlayerOpen(true);
      }
    }
  }, [location.pathname, snap.reels]);

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
      if (!userId) return;
      setReaderId(null);
      navigate(`/profile/${userId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate],
  );

  const toggleDark = () => setDark((prev) => !prev);

  // Global clipboard copy notification toast in Bengali
  useEffect(() => {
    const handleCopy = () => {
      const selection = window.getSelection()?.toString().trim();
      if (selection) {
        toast.success('Copied', {
          duration: 1500,
        });
      }
    };
    window.addEventListener('copy', handleCopy);
    return () => window.removeEventListener('copy', handleCopy);
  }, []);

  // LinkedIn Reaction Handler (Context-preserving auth + notification trigger)
  const handleReact = useCallback(
    (targetType: ReactionTargetType, targetId: string, chosen: LinkedInReactionType) => {
      if (!currentUser) {
        requestAuth('প্রতিক্রিয়া (Reaction) প্রকাশ করতে দয়া করে লগইন বা সাইন আপ করুন।', () => {
          handleReact(targetType, targetId, chosen);
        });
        return;
      }
      const actor = currentUser;
      let result: ReturnType<typeof mutateSnapshotReaction> | null = null;
      commit((prev) => {
        result = mutateSnapshotReaction(prev, targetType, targetId, actor, chosen);
        return result.next;
      });
      if (result) {
        const { finalReaction, counts, total } = result;
        dbSetReaction(targetType, targetId, actor, finalReaction, counts, total);

        // Send notification to author if reacting positively and author is another user
        if (finalReaction) {
          let authorId = '';
          let targetTitle = '';
          if (targetType === 'article') {
            const art = snap.articles.find((a) => a.id === targetId);
            authorId = art?.authorId || art?.author?.id || '';
            targetTitle = art?.title ?? 'প্রবন্ধ';
          } else if (targetType === 'post') {
            const post = snap.posts.find((p) => p.id === targetId);
            authorId = post?.authorId || post?.author?.id || '';
            targetTitle = post?.content.slice(0, 30) ?? 'পোস্ট';
          } else if (targetType === 'comment') {
            let foundComment: Comment | undefined = snap.comments.find((c) => c.id === targetId);
            if (!foundComment) {
              for (const a of snap.articles) {
                foundComment = a.comments?.find((c) => c.id === targetId);
                if (foundComment) break;
              }
            }
            if (!foundComment) {
              for (const p of snap.posts) {
                foundComment = p.comments?.find((c) => c.id === targetId);
                if (foundComment) break;
              }
            }
            if (foundComment) {
              authorId = foundComment.authorId;
              targetTitle = foundComment.text.slice(0, 30);
            }
          }
          // Ultra guard: Never notify self for own actions
          if (authorId && authorId !== actor.id) {
            const isComment = targetType === 'comment';
            const notif: NotificationItem = {
              id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              recipientId: authorId,
              userId: authorId,
              actorId: actor.id,
              actorName: actor.name,
              actorAvatar: actor.avatar,
              type: 'reaction',
              entityType: isComment ? 'comment' : targetType,
              entityId: targetId,
              targetUrl: isComment ? `/#comment-${targetId}` : targetType === 'article' ? `/article/${targetId}` : `/#post-${targetId}`,
              message: isComment
                ? `${actor.name} আপনার মন্তব্যে প্রতিক্রিয়া জানিয়েছেন: "${targetTitle}..."`
                : `${actor.name} আপনার "${targetTitle}" বিষয়ে প্রতিক্রিয়া জানিয়েছেন।`,
              title: isComment ? 'মন্তব্যে নতুন প্রতিক্রিয়া' : 'নতুন প্রতিক্রিয়া',
              source: actor.name,
              time: 'মাত্র এখন',
              isRead: false,
              unread: true,
              createdAt: new Date().toISOString(),
            };
            dbInsertNotification(notif);
          }
        }
      }
    },
    [commit, currentUser, requestAuth, snap.articles, snap.posts],
  );

  const handleBookmarkArticle = useCallback(
    (articleId: string) => {
      if (!currentUser) {
        requestAuth('প্রবন্ধ সংরক্ষণ (Bookmark) করতে দয়া করে লগইন বা সাইন আপ করুন।', () => {
          handleBookmarkArticle(articleId);
        });
        return;
      }
      const was = (snap.bookmarkedArticleIds ?? []).includes(articleId);
      commit((prev) => ({
        ...prev,
        bookmarkedArticleIds: toggleBookmarkId(prev.bookmarkedArticleIds, articleId),
      }));
    },
    [currentUser, snap.bookmarkedArticleIds, commit, requestAuth],
  );

  const handleCommentArticle = useCallback(
    (articleId: string, text: string, parentId?: string, replyToAuthor?: string) => {
      if (!currentUser) {
        requestAuth('মন্তব্য করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentArticle(articleId, text, parentId, replyToAuthor);
        });
        return;
      }
      const actor = currentUser;
      const newComment = makeComment(text, actor, 'article', articleId, parentId, replyToAuthor);
      let updatedArticle: Article | undefined;
      commit((prev) => {
        const articles = prev.articles.map((a) => {
          if (a.id !== articleId) return a;
          updatedArticle = appendArticleComment(a, newComment);
          return updatedArticle;
        });
        return {
          ...prev,
          comments: [newComment, ...prev.comments],
          articles,
        };
      });
      dbInsertComment(newComment);
      if (updatedArticle) dbUpsertArticle(updatedArticle);

      // Trigger notification to author (only if recipient is another user)
      const art = snap.articles.find((a) => a.id === articleId);
      const authorId = art?.authorId || art?.author?.id || '';
      if (authorId && authorId !== actor.id) {
        const notif: NotificationItem = {
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          recipientId: authorId,
          userId: authorId,
          actorId: actor.id,
          actorName: actor.name,
          actorAvatar: actor.avatar,
          type: 'comment',
          entityType: 'article',
          entityId: articleId,
          targetUrl: `/article/${articleId}`,
          message: `${actor.name} আপনার "${art?.title ?? 'প্রতিবেদন'}" প্রতিবেদনে মন্তব্য করেছেন: "${text.slice(0, 35)}..."`,
          title: 'নতুন মন্তব্য',
          source: actor.name,
          time: 'মাত্র এখন',
          isRead: false,
          unread: true,
          createdAt: new Date().toISOString(),
        };
        dbInsertNotification(notif);
      }

      // If replying to a comment, notify parent comment author
      if (parentId) {
        const parentComment = snap.comments.find((c) => c.id === parentId) ||
          snap.articles.flatMap((a) => a.comments || []).find((c) => c.id === parentId);
        if (parentComment && parentComment.authorId && parentComment.authorId !== actor.id && parentComment.authorId !== authorId) {
          const replyNotif: NotificationItem = {
            id: `notif-reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            recipientId: parentComment.authorId,
            userId: parentComment.authorId,
            actorId: actor.id,
            actorName: actor.name,
            actorAvatar: actor.avatar,
            type: 'comment',
            entityType: 'comment',
            entityId: parentId,
            targetUrl: `/article/${articleId}`,
            message: `${actor.name} আপনার মন্তব্যের উত্তর দিয়েছেন: "${text.slice(0, 35)}..."`,
            title: 'মন্তব্যের উত্তর',
            source: actor.name,
            time: 'মাত্র এখন',
            isRead: false,
            unread: true,
            createdAt: new Date().toISOString(),
          };
          dbInsertNotification(replyNotif);
        }
      }
    },
    [commit, currentUser, requestAuth, snap.articles],
  );

  const handleCommentPost = useCallback(
    (postId: string, text: string, parentId?: string, replyToAuthor?: string) => {
      if (!currentUser) {
        requestAuth('পোস্টে মন্তব্য করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentPost(postId, text, parentId, replyToAuthor);
        });
        return;
      }
      const actor = currentUser;
      const newComment = makeComment(text, actor, 'post', postId, parentId, replyToAuthor);
      let updatedPost: CommunityPost | undefined;
      commit((prev) => {
        const posts = prev.posts.map((p) => {
          if (p.id !== postId) return p;
          updatedPost = appendPostComment(p, newComment);
          return updatedPost;
        });
        return {
          ...prev,
          comments: [newComment, ...prev.comments],
          posts,
        };
      });
      dbInsertComment(newComment);
      if (updatedPost) dbUpsertPost(updatedPost);

      // Trigger notification to post author (only if recipient is another user)
      const post = snap.posts.find((p) => p.id === postId);
      const authorId = post?.authorId || post?.author?.id || '';
      if (authorId && authorId !== actor.id) {
        const notif: NotificationItem = {
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          recipientId: authorId,
          userId: authorId,
          actorId: actor.id,
          actorName: actor.name,
          actorAvatar: actor.avatar,
          type: 'comment',
          entityType: 'post',
          entityId: postId,
          targetUrl: `/post/${postId}`,
          message: `${actor.name} আপনার পোস্টে মন্তব্য করেছেন: "${text.slice(0, 35)}..."`,
          title: 'নতুন মন্তব্য',
          source: actor.name,
          time: 'মাত্র এখন',
          isRead: false,
          unread: true,
          createdAt: new Date().toISOString(),
        };
        dbInsertNotification(notif);
      }

      // If replying to a comment, notify parent comment author
      if (parentId) {
        const parentComment = snap.comments.find((c) => c.id === parentId) ||
          snap.posts.flatMap((p) => p.comments || []).find((c) => c.id === parentId);
        if (parentComment && parentComment.authorId && parentComment.authorId !== actor.id && parentComment.authorId !== authorId) {
          const replyNotif: NotificationItem = {
            id: `notif-reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            recipientId: parentComment.authorId,
            userId: parentComment.authorId,
            actorId: actor.id,
            actorName: actor.name,
            actorAvatar: actor.avatar,
            type: 'comment',
            entityType: 'comment',
            entityId: parentId,
            targetUrl: `/post/${postId}`,
            message: `${actor.name} আপনার মন্তব্যের উত্তর দিয়েছেন: "${text.slice(0, 35)}..."`,
            title: 'মন্তব্যের উত্তর',
            source: actor.name,
            time: 'মাত্র এখন',
            isRead: false,
            unread: true,
            createdAt: new Date().toISOString(),
          };
          dbInsertNotification(replyNotif);
        }
      }
    },
    [commit, currentUser, requestAuth, snap.posts],
  );

  const handleEditComment = useCallback(
    (commentId: string, newText: string) => {
      if (!currentUser) return;
      const clean = newText.trim();
      if (!clean) return;

      // Ownership verification
      let existingComment: Comment | undefined = snap.comments.find((c) => c.id === commentId);
      if (!existingComment) {
        for (const a of snap.articles) {
          existingComment = a.comments?.find((c) => c.id === commentId);
          if (existingComment) break;
        }
      }
      if (!existingComment) {
        for (const p of snap.posts) {
          existingComment = p.comments?.find((c) => c.id === commentId);
          if (existingComment) break;
        }
      }

      if (existingComment) {
        const isOwner =
          existingComment.authorId === currentUser.id ||
          (isZubairIdentifier(existingComment.authorId) && isZubairIdentifier(currentUser.id));
        if (!isOwner) {
          toast.error('আপনি শুধুমাত্র নিজের মন্তব্য সম্পাদনা করতে পারেন');
          return;
        }
      }

      commit((prev) => {
        const updateList = (list: Comment[]) =>
          list.map((c) => (c.id === commentId ? { ...c, text: clean, isEdited: true } : c));

        const articles = prev.articles.map((a) => ({
          ...a,
          comments: updateList(a.comments),
        }));

        const posts = prev.posts.map((p) => ({
          ...p,
          comments: updateList(p.comments),
        }));

        const comments = updateList(prev.comments);

        return {
          ...prev,
          comments,
          articles,
          posts,
        };
      });

      dbUpdateComment(commentId, clean);
      toast.success('মন্তব্য সফলভাবে আপডেট করা হয়েছে');
    },
    [commit, currentUser, snap.comments, snap.articles, snap.posts],
  );

  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);

  const handleDeleteComment = useCallback(
    (commentId: string) => {
      if (!currentUser) return;

      // Ownership verification
      let existingComment: Comment | undefined = snap.comments.find((c) => c.id === commentId);
      if (!existingComment) {
        for (const a of snap.articles) {
          existingComment = a.comments?.find((c) => c.id === commentId);
          if (existingComment) break;
        }
      }
      if (!existingComment) {
        for (const p of snap.posts) {
          existingComment = p.comments?.find((c) => c.id === commentId);
          if (existingComment) break;
        }
      }

      if (existingComment) {
        const isOwner =
          existingComment.authorId === currentUser.id ||
          (isZubairIdentifier(existingComment.authorId) && isZubairIdentifier(currentUser.id));
        if (!isOwner) {
          toast.error('আপনি শুধুমাত্র নিজের মন্তব্য মুছে ফেলতে পারেন');
          return;
        }
      }

      // Trigger custom delete comment alert modal
      setPendingDeleteCommentId(commentId);
    },
    [currentUser, snap.comments, snap.articles, snap.posts],
  );

  const handleConfirmDeleteComment = useCallback(() => {
    if (!pendingDeleteCommentId || !currentUser) return;
    const commentId = pendingDeleteCommentId;
    setPendingDeleteCommentId(null);

    commit((prev) => {
      const removeMatching = (list: Comment[]) =>
        list.filter((c) => c.id !== commentId && c.parentId !== commentId);

      const articles = prev.articles.map((a) => {
        const filtered = removeMatching(a.comments);
        return {
          ...a,
          comments: filtered,
          stats: { ...a.stats, commentsCount: filtered.length },
        };
      });

      const posts = prev.posts.map((p) => {
        const filtered = removeMatching(p.comments);
        return {
          ...p,
          comments: filtered,
        };
      });

      const comments = removeMatching(prev.comments);

      return {
        ...prev,
        comments,
        articles,
        posts,
      };
    });

    dbDeleteComment(commentId);
    toast.success('মন্তব্য মুছে ফেলা হয়েছে');
  }, [commit, currentUser, pendingDeleteCommentId]);

  const isPendingCommentReply = useMemo(() => {
    if (!pendingDeleteCommentId) return false;
    const found = snap.comments.find((c) => c.id === pendingDeleteCommentId);
    if (found?.parent_id || found?.parentId) return true;
    for (const a of snap.articles) {
      const fc = a.comments?.find((c) => c.id === pendingDeleteCommentId);
      if (fc?.parent_id || fc?.parentId) return true;
    }
    for (const p of snap.posts) {
      const fc = p.comments?.find((c) => c.id === pendingDeleteCommentId);
      if (fc?.parent_id || fc?.parentId) return true;
    }
    return false;
  }, [pendingDeleteCommentId, snap.comments, snap.articles, snap.posts]);

  const handleSavePost = useCallback(
    (postId: string) => {
      if (!currentUser) {
        requestAuth('পোস্ট সংরক্ষণ করতে দয়া করে লগইন করুন।', () => {
          handleSavePost(postId);
        });
        return;
      }
      commit((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? { ...p, userSaved: !p.userSaved } : p)),
      }));
    },
    [currentUser, commit, requestAuth],
  );

  const handleCommentStoryOrReel = useCallback(
    (targetId: string, text: string, parentId?: string, replyToAuthor?: string) => {
      if (!currentUser) {
        requestAuth('মন্তব্য করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentStoryOrReel(targetId, text, parentId, replyToAuthor);
        });
        return;
      }
      // Interconnect story comments directly with post / article comments
      const matchedStory = snap.stories.find((s) => s.id === targetId || s.articleId === targetId);
      const articleId = matchedStory?.articleId || (snap.articles.some((a) => a.id === targetId) ? targetId : null);
      if (articleId) {
        handleCommentArticle(articleId, text, parentId, replyToAuthor);
        return;
      }
      const isPost = snap.posts.some((p) => p.id === targetId);
      if (isPost) {
        handleCommentPost(targetId, text, parentId, replyToAuthor);
        return;
      }

      const newComment = makeComment(text, currentUser, 'reel', targetId, parentId, replyToAuthor);
      commit((prev) => ({
        ...prev,
        comments: [newComment, ...prev.comments],
      }));
      dbInsertComment(newComment);

      if (parentId) {
        const parentComment = snap.comments.find((c) => c.id === parentId);
        if (parentComment && parentComment.authorId && parentComment.authorId !== currentUser.id) {
          const replyNotif: NotificationItem = {
            id: `notif-reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            recipientId: parentComment.authorId,
            userId: parentComment.authorId,
            actorId: currentUser.id,
            actorName: currentUser.name,
            actorAvatar: currentUser.avatar,
            type: 'comment',
            entityType: 'comment',
            entityId: parentId,
            targetUrl: `/reel/${targetId}`,
            message: `${currentUser.name} আপনার মন্তব্যের উত্তর দিয়েছেন: "${text.slice(0, 35)}..."`,
            title: 'মন্তব্যের উত্তর',
            source: currentUser.name,
            time: 'মাত্র এখন',
            isRead: false,
            unread: true,
            createdAt: new Date().toISOString(),
          };
          dbInsertNotification(replyNotif);
        }
      }
    },
    [commit, currentUser, requestAuth, snap.stories, snap.articles, snap.posts, snap.comments, handleCommentArticle, handleCommentPost],
  );

  const handleReactStoryOrReel = useCallback(
    (targetId: string) => {
      if (!currentUser) {
        requestAuth('প্রতিক্রিয়া প্রকাশ করতে অনুগ্রহ করে লগইন করুন।');
        return;
      }
      handleReact('reel', targetId, 'like');
    },
    [currentUser, requestAuth, handleReact],
  );

  const handleBookmarkStoryOrReel = useCallback(
    (targetId: string) => {
      if (!currentUser) {
        requestAuth('স্টোরি সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।');
        return;
      }
    },
    [currentUser, requestAuth],
  );

  // Notification management operations
  const handleToggleNotificationRead = useCallback(
    (id: string, isRead: boolean) => {
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, isRead, unread: !isRead } : n,
        ),
      }));
      dbUpdateNotificationRead(id, isRead);
    },
    [commit],
  );

  const handleDeleteNotification = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id),
      }));
      dbDeleteNotification(id);
    },
    [commit],
  );

  const handleReadAllNotifications = useCallback(() => {
    commit((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true, unread: false })),
    }));
    if (currentUser) {
      dbMarkAllNotificationsRead(currentUser.id);
    }
  }, [commit, currentUser]);

  // Content deletion operations
  const handleDeletePost = useCallback(
    (postId: string) => {
      if (!currentUser) {
        requestAuth('পোস্ট মুছতে লগইন করুন');
        return;
      }
      const post = snap.posts.find((p) => p.id === postId);
      if (post && post.authorId !== currentUser.id && currentUser.id !== 'usr-plainsyt-admin') {
        return;
      }
      commit((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
        comments: prev.comments.filter((c) => !(c.targetType === 'post' && c.targetId === postId)),
      }));
      dbDeletePost(postId);
    },
    [commit, currentUser, requestAuth, snap.posts],
  );

  const handleDeleteStory = useCallback(
    (storyId: string) => {
      if (!currentUser) {
        requestAuth('স্টোরি মুছতে লগইন করুন');
        return;
      }
      const story = snap.stories.find((s) => s.id === storyId);
      if (story && story.authorId !== currentUser.id && currentUser.id !== 'usr-plainsyt-admin') {
        return;
      }
      commit((prev) => ({
        ...prev,
        stories: prev.stories.filter((s) => s.id !== storyId),
      }));
      dbDeleteStory(storyId);
    },
    [commit, currentUser, requestAuth, snap.stories],
  );

  const handleDeleteArticle = useCallback(
    (articleId: string) => {
      if (!currentUser) {
        requestAuth('প্রতিবেদন মুছতে লগইন করুন');
        return;
      }
      const art = snap.articles.find((a) => a.id === articleId);
      if (art && art.authorId !== currentUser.id && currentUser.id !== 'usr-plainsyt-admin') {
        return;
      }
      commit((prev) => ({
        ...prev,
        articles: prev.articles.filter((a) => a.id !== articleId),
        comments: prev.comments.filter((c) => !(c.targetType === 'article' && c.targetId === articleId)),
      }));
      dbDeleteArticle(articleId);
    },
    [commit, currentUser, requestAuth, snap.articles],
  );

  const handleShare = useCallback((label: string, customUrl?: string) => {
    const rawUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : 'https://pla.insyt.bd');
    const fullUrl = rawUrl.startsWith('http')
      ? rawUrl
      : typeof window !== 'undefined'
        ? `${window.location.origin}${rawUrl}`
        : `https://pla.insyt.bd${rawUrl}`;
    navigator.clipboard?.writeText(fullUrl).then(() => {
      toast.success('Copied', { duration: 1500 });
    }).catch(() => {});
  }, []);

  const handleOpenArticlePopup = useCallback(
    (articleId: string) => {
      // Increment article view count in Supabase
      let target: Article | undefined;
      commit((prev) => ({
        ...prev,
        articles: prev.articles.map((a) => {
          if (a.id !== articleId) return a;
          target = { ...a, stats: { ...a.stats, views: a.stats.views + 1 } };
          return target;
        }),
      }));
      if (target) dbUpsertArticle(target);
      setReaderId(articleId);
    },
    [commit],
  );

  const handleSaveProfile = useCallback(
    (profile: UserProfile) => {
      // ULTRA HARD FIX: Persist immediately to both auth storage and database snapshot
      setStoredAuth(profile, profile.email || null);
      commit((prev) => {
        const exists = prev.profiles.some((p) => p.id === profile.id);
        const profiles = exists
          ? prev.profiles.map((p) => (p.id === profile.id ? { ...p, ...profile } : p))
          : [profile, ...prev.profiles];
        // Also propagate updated author name/avatar to their authored articles & posts
        const articles = prev.articles.map((a) =>
          a.authorId === profile.id
            ? {
                ...a,
                author: {
                  ...a.author,
                  id: profile.id,
                  name: profile.nameBn || profile.name,
                  designation: profile.role,
                  organization: profile.organization,
                  avatar: profile.avatar,
                },
              }
            : a,
        );
        const posts = prev.posts.map((po) =>
          po.authorId === profile.id
            ? {
                ...po,
                author: {
                  ...po.author,
                  id: profile.id,
                  name: profile.name,
                  avatar: profile.avatar,
                  role: `${profile.role}${profile.organization ? ` · ${profile.organization}` : ''}`,
                  isVerified: profile.isVerified,
                },
              }
            : po,
        );
        return {
          ...prev,
          profiles,
          currentUserId: profile.id,
          articles,
          posts,
        };
      });
      dbUpsertProfile(profile);
    },
    [commit],
  );

  const handlePublishArticle = useCallback(
    (article: Article) => {
      if (!currentUser) {
        requestAuth('প্রতিবেদন প্রকাশ করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।');
        return;
      }
      const actor = currentUser;
      const enriched: Article = {
        ...article,
        authorId: actor.id,
        author: {
          id: actor.id,
          name: actor.nameBn || actor.name,
          designation: actor.role,
          organization: actor.organization,
          avatar: actor.avatar,
        },
      };
      commit((prev) => ({
        ...prev,
        articles: [enriched, ...prev.articles],
      }));
      dbUpsertArticle(enriched);
      goNavigate('/');
      toast.success('প্রতিবেদন সফলভাবে প্রকাশিত হয়েছে', {
        description: `${toBengaliNumerals(enriched.readTimeMinutes)} মিনিট পড়া · ${enriched.category}`,
        duration: 1800,
      });
    },
    [currentUser, requestAuth, commit, goNavigate],
  );

  const handlePublishReel = useCallback(
    (reel: StoryReel, story?: TopicStory, feedPost?: CommunityPost) => {
      if (!currentUser) {
        requestAuth('পোস্ট ও স্টোরি প্রকাশ করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।');
        return;
      }
      const actor = currentUser;
      const enrichedReel: StoryReel = {
        ...reel,
        creatorId: actor.id,
        creator: actor.name,
        creatorAvatar: actor.avatar,
      };
      commit((prev) => ({
        ...prev,
        reels: [enrichedReel, ...prev.reels],
        stories: story ? [{ ...story, authorId: actor.id, authorName: actor.name, authorAvatar: actor.avatar }, ...prev.stories] : prev.stories,
        posts: feedPost ? [{ ...feedPost, authorId: actor.id, author: { ...feedPost.author, id: actor.id, name: actor.name, avatar: actor.avatar } }, ...prev.posts] : prev.posts,
      }));
      dbUpsertReel(enrichedReel);
      if (story) dbUpsertStory({ ...story, authorId: actor.id, authorName: actor.name, authorAvatar: actor.avatar });
      if (feedPost) dbUpsertPost({ ...feedPost, authorId: actor.id });
      toast.success('রিল ও স্টোরি সফলভাবে প্রকাশিত হয়েছে', { duration: 1800 });
    },
    [currentUser, requestAuth, commit],
  );

  const handleToggleFollow = useCallback(
    (targetUserId: string) => {
      if (!currentUser) {
        requestAuth('গবেষকদের অনুসরণ (Follow) করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleToggleFollow(targetUserId);
        });
        return;
      }
      if (!targetUserId) return;
      if (currentUser.id === targetUserId) {
        return;
      }
      const was = (snap.followingIds ?? []).includes(targetUserId);
      const nextFollowingIds = toggleBookmarkId(snap.followingIds, targetUserId);
      commit((prev) => {
        const currentFollows = prev.follows || [];
        const nextFollows = was
          ? currentFollows.filter((f) => !(f.followerId === currentUser.id && f.followingId === targetUserId))
          : [...currentFollows, { followerId: currentUser.id, followingId: targetUserId }];

        const nextProfiles = (prev.profiles || []).map((p) => {
          if (p.id === targetUserId) {
            const cur = p.followersCount || 0;
            return { ...p, followersCount: was ? Math.max(0, cur - 1) : cur + 1 };
          }
          if (currentUser && p.id === currentUser.id) {
            const cur = p.followingCount || 0;
            return { ...p, followingCount: was ? Math.max(0, cur - 1) : cur + 1 };
          }
          return p;
        });
        return {
          ...prev,
          followingIds: nextFollowingIds,
          follows: nextFollows,
          profiles: nextProfiles,
        };
      });
      dbToggleFollow(currentUser.id, targetUserId, !was);
      const targetProfile = snap.profiles.find((p) => p.id === targetUserId);
      toast(was ? 'আনফলো করা হয়েছে' : `${targetProfile?.name || 'গবেষক'}-কে ফলো করছেন`, { duration: 1600 });

      if (!was) {
        const notif: NotificationItem = {
          id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          recipientId: targetUserId,
          userId: targetUserId,
          actorId: currentUser.id,
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar,
          type: 'follow',
          entityType: 'user',
          entityId: currentUser.id,
          targetUrl: `/profile/${currentUser.id}`,
          message: `${currentUser.name} আপনাকে ফলো করতে শুরু করেছেন।`,
          title: 'নতুন ফলোয়ার',
          source: currentUser.name,
          time: 'মাত্র এখন',
          isRead: false,
          unread: true,
          createdAt: new Date().toISOString(),
        };
        dbInsertNotification(notif);
      }
    },
    [currentUser, requestAuth, snap.followingIds, snap.profiles, commit],
  );

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

  const storyPlayerItems: PlayerItem[] = useMemo(
    () =>
      snap.stories.map((s) => ({
        id: s.id,
        title: s.title,
        creator: s.authorName ?? 'Plainsyt',
        avatar: s.authorAvatar ?? 'PS',
        image: s.imageUrl,
        meta: s.category,
        likes: 0,
        videoUrl: s.videoUrl,
      })),
    [snap.stories],
  );

  const savedArticles = useMemo(
    () => (snap.articles ?? []).filter((a) => (snap.bookmarkedArticleIds ?? []).includes(a.id)),
    [snap.articles, snap.bookmarkedArticleIds],
  );
  const savedPosts = useMemo(() => snap.posts.filter((p) => p.userSaved), [snap.posts]);
  const savedCount = savedArticles.length + savedPosts.length;
  const readerArticle = useMemo(
    () =>
      snap.articles.find((a) => a.id === readerId || a.slug === readerId) ??
      DEFAULT_SEED_SNAPSHOT.articles.find((a) => a.id === readerId || a.slug === readerId) ??
      null,
    [snap.articles, readerId],
  );

  // Comprehensive directory of all platform profiles (seed + author articles + posts + currentUser)
  const allKnownProfiles = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const p of snap.profiles) {
      if (p && p.id) map.set(p.id, p);
    }
    if (currentUser && currentUser.id) {
      map.set(currentUser.id, currentUser);
    }
    if (!map.has('usr-zubair')) map.set('usr-zubair', ZUBAIR_PROFILE);
    if (!map.has('55dba730-185d-4c61-bee8-6b9ab22e3703')) {
      map.set(
        '55dba730-185d-4c61-bee8-6b9ab22e3703',
        currentUser && isZubairIdentifier(currentUser.id) ? currentUser : ZUBAIR_PROD_PROFILE,
      );
    }
    for (const a of snap.articles) {
      const aid = a.authorId || a.author.id;
      if (aid && !map.has(aid)) {
        map.set(aid, {
          id: aid,
          name: a.author.name,
          nameBn: a.author.name,
          handle: aid.replace('usr-', ''),
          role: a.author.designation || 'গবেষক',
          organization: a.author.organization || 'PLAiNSYT Platform',
          location: 'বাংলাদেশ',
          bio: `${a.author.name} — এগ্রি-টেক ও বিজ্ঞান গবেষক।`,
          avatar: a.author.avatar,
          isVerified: true,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }
    for (const p of snap.posts) {
      if (p.authorId && !map.has(p.authorId)) {
        map.set(p.authorId, {
          id: p.authorId,
          name: p.author.name,
          nameBn: p.author.name,
          handle: p.authorId.replace('usr-', ''),
          role: p.author.role || 'সদস্য',
          organization: 'PLAiNSYT Community',
          location: 'বাংলাদেশ',
          bio: 'কৃষি ও প্রযুক্তি চিন্তক',
          avatar: p.author.avatar,
          isVerified: p.author.isVerified,
          followersCount: 0,
          followingCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
    }
    return Array.from(map.values());
  }, [snap.profiles, snap.articles, snap.posts, currentUser]);

  // Determine profile target for /profile or /profile/:userId (supports userId, handle, or slug)
  const viewedProfile = useMemo(() => {
    const rawTarget = params.userId || currentUser?.id;
    if (!rawTarget) return null;
    const cleanSlug = rawTarget.toLowerCase().replace(/^@/, '');

    // 0. If current user is logged in and target matches currentUser (by id, handle, me, or blank):
    if (
      currentUser &&
      (params.userId === 'me' ||
        !params.userId ||
        rawTarget === currentUser.id ||
        rawTarget.toLowerCase() === currentUser.id.toLowerCase() ||
        (currentUser.handle && cleanSlug === currentUser.handle.toLowerCase()) ||
        (isZubairIdentifier(rawTarget) && isZubairIdentifier(currentUser.id)))
    ) {
      return currentUser;
    }

    // 1. Direct Zubair identity guarantee (NEVER fall through to raw UUID fallback!)
    if (isZubairIdentifier(rawTarget) || isZubairIdentifier(cleanSlug)) {
      const snapZubair = snap.profiles.find((p) => isZubairIdentifier(p.id) || isZubairIdentifier(p.handle));
      if (snapZubair) return { ...snapZubair, id: rawTarget };
      if (currentUser && isZubairIdentifier(currentUser.id)) return { ...currentUser, id: rawTarget };
      return { ...ZUBAIR_PROD_PROFILE, id: rawTarget };
    }

    // 2. Exact ID or handle match in snap.profiles
    const foundInProfiles = snap.profiles.find(
      (p) => p.id === rawTarget || p.id.toLowerCase() === rawTarget.toLowerCase() || p.handle?.toLowerCase() === cleanSlug
    );
    if (foundInProfiles) return foundInProfiles;

    // 3. Match in allKnownProfiles
    const foundInKnown = allKnownProfiles.find(
      (p) => p.id === rawTarget || p.id.toLowerCase() === rawTarget.toLowerCase() || p.handle?.toLowerCase() === cleanSlug
    );
    if (foundInKnown) return foundInKnown;

    // 4. Synthesize profile from authored articles
    const fromArt = snap.articles.find(
      (a) => a.authorId === rawTarget || a.author.id === rawTarget || a.author.name?.toLowerCase() === cleanSlug
    );
    if (fromArt) {
      return {
        id: fromArt.authorId || rawTarget,
        name: fromArt.author.name,
        nameBn: fromArt.author.name,
        handle: cleanSlug,
        role: fromArt.author.designation,
        organization: fromArt.author.organization,
        location: 'বাংলাদেশ',
        bio: `${fromArt.author.name} — এগ্রি-টেক ও বিজ্ঞান গবেষক।`,
        avatar: fromArt.author.avatar,
        coverGradient: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
        isVerified: true,
        focusArea: fromArt.category,
        publicationsCount: 1,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    // 5. Synthesize profile from authored posts
    const fromPost = snap.posts.find(
      (p) => p.authorId === rawTarget || p.author.name?.toLowerCase() === cleanSlug || p.author.handle?.toLowerCase() === cleanSlug
    );
    if (fromPost) {
      return {
        id: fromPost.authorId || rawTarget,
        name: fromPost.author.name,
        nameBn: fromPost.author.name,
        handle: fromPost.author.handle || cleanSlug,
        role: fromPost.author.role || 'সদস্য',
        organization: fromPost.author.organization || 'PLAiNSYT Community',
        location: 'বাংলাদেশ',
        bio: 'সদস্য, PLAiNSYT কম্যুনিটি',
        avatar: fromPost.author.avatar,
        coverGradient: 'linear-gradient(135deg, #061621 0%, #0d2b3e 55%, #03EF62 100%)',
        isVerified: fromPost.author.isVerified || false,
        followersCount: 0,
        followingCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    // 6. Fallback user profile so route /profile/:slug never crashes
    return {
      id: rawTarget,
      name: cleanSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      nameBn: cleanSlug,
      handle: cleanSlug,
      role: 'সদস্য',
      organization: 'PLAiNSYT Platform',
      location: 'বাংলাদেশ',
      bio: 'PLAiNSYT কমিউনিটি সদস্য।',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      coverGradient: 'linear-gradient(135deg, #061621 0%, #0d2b3e 55%, #03EF62 100%)',
      isVerified: false,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString(),
    };
  }, [params.userId, currentUser, snap.profiles, snap.articles, snap.posts, allKnownProfiles]);

  // User's strictly received notifications (prevents self-notifications completely)
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return snap.notifications.filter((n) => {
      const recipient = n.recipientId || n.userId;
      const isRecipient = recipient === currentUser.id;
      const isSelfAction = Boolean(n.actorId && n.actorId === currentUser.id);
      return isRecipient && !isSelfAction;
    });
  }, [currentUser, snap.notifications]);

  // Standalone /article/:articleId route (for opening in a separate browser tab!)
  const standaloneArticle = useMemo(() => {
    if (!params.articleId) return null;
    const fromSnap =
      snap.articles.find((a) => a.id === params.articleId || a.slug === params.articleId) ?? null;
    if (fromSnap) return fromSnap;
    return (
      DEFAULT_SEED_SNAPSHOT.articles.find(
        (a) => a.id === params.articleId || a.slug === params.articleId,
      ) ?? null
    );
  }, [params.articleId, snap.articles]);

  const openPhotoPopup = useCallback(
    (
      images: string[],
      index = 0,
      title?: string,
      subtitle?: string,
      authorName?: string,
      authorId?: string,
    ) => {
      const valid = images.filter(Boolean);
      if (valid.length === 0) return;
      setLightbox({ images: valid, index, title, subtitle, authorName, authorId });
    },
    [],
  );

  const mainContent = (() => {
    if (isPageLoading || (supaStatus === 'checking' && snap.articles.length === 0)) {
      if (location.pathname.startsWith('/article/')) {
        return <ArticleReaderSkeleton />;
      }
      switch (activeView) {
        case 'explore':
          return <ExplorePageSkeleton />;
        case 'events':
          return <EventsPageSkeleton />;
        case 'store':
          return <StorePageSkeleton />;
        case 'ideas':
          return <IdeasPageSkeleton />;
        case 'notifications':
          return <NotificationsPageSkeleton />;
        case 'profile':
          return <ProfilePageSkeleton />;
        case 'publications':
        case 'security':
          return <ResearcherStudioSkeleton />;
        default:
          return <FeedPageSkeleton />;
      }
    }

    if (location.pathname.startsWith('/article/')) {
      if (!standaloneArticle) {
        if (snap.articles.length === 0) {
          return <ArticleReaderSkeleton />;
        }
        return (
          <section className={cn(FEED_CARD, 'p-8 text-center')}>
            <h1 className="font-display text-[24px] font-bold text-pine-950">
              প্রতিবেদনটি পাওয়া যায়নি
            </h1>
            <p className="mt-1 font-bangla text-[14px] text-pine-900/65">
              এই প্রতিবেদনটি বর্তমানে পাওয়া যাচ্ছে না বা মুছে ফেলা হয়েছে।
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => goNavigate('/')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-pine-900 bg-pine-900 px-4 text-[13.5px] font-semibold text-canvas"
              >
                <ArrowLeft className="size-4" /> হোম পেজে ফিরুন
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) {
                    requestAuth('প্রতিবেদন লিখতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setWriteOpen(true));
                  } else {
                    setWriteOpen(true);
                  }
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-pine-900 bg-canvas-card px-4 text-[13.5px] font-semibold text-pine-900"
              >
                <PenLine className="size-4" /> নতুন প্রতিবেদন লিখুন
              </button>
            </div>
          </section>
        );
      }
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 sm:px-0 mb-3">
            <button
              type="button"
              onClick={() => goNavigate('/')}
              title="হোম ফিডে ফিরে যান"
              aria-label="হোম ফিডে ফিরে যান"
              className="inline-flex items-center justify-center gap-2 rounded-full sm:rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-canvas-card size-9 sm:size-auto sm:px-3.5 sm:py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-[#03EF62] hover:text-emerald-700 dark:hover:text-[#03EF62] transition shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="hidden sm:inline font-bangla text-[13px]">ফিডে ফিরে যান</span>
            </button>
          </div>
          <ArticleReaderContent
            article={standaloneArticle}
            bookmarked={(snap.bookmarkedArticleIds ?? []).includes(standaloneArticle.id)}
            currentUser={currentUser}
            isStandalonePage
            onClose={() => goNavigate('/')}
            onReact={(type) => handleReact('article', standaloneArticle.id, type)}
            onOpenReactionsBreakdown={() =>
              setRxBreakdown({ targetType: 'article', targetId: standaloneArticle.id })
            }
            onBookmark={() => handleBookmarkArticle(standaloneArticle.id)}
            onComment={(t) => handleCommentArticle(standaloneArticle.id, t)}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            onReactComment={(cid, type) => handleReact('comment', cid, type)}
            onShare={() => handleShare(standaloneArticle.title)}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
              openPhotoPopup([src], 0, title, subtitle, authorName, authorId)
            }
          />
        </div>
      );
    }

    if (location.pathname.startsWith('/events/') && location.pathname !== '/events') {
      const eventId = decodeURIComponent(location.pathname.replace('/events/', ''));
      const foundEvent = snap.events.find((e) => e.id === eventId);
      const isReg = snap.eventRegistrations.some(
        (id) => id === eventId,
      ) || (foundEvent ? foundEvent.isRegistered : false);
      return (
        <EventDetailPage
          eventId={eventId}
          event={foundEvent}
          events={snap.events}
          isRegistered={isReg}
          onBack={() => goNavigate('/events')}
          onNavigate={goNavigate}
          onOpenRegister={(ev) => setRegistrationEvent(ev)}
        />
      );
    }

    if (location.pathname.startsWith('/post/')) {
      const postId = decodeURIComponent(location.pathname.replace('/post/', ''));
      const foundPost = snap.posts.find((p) => p.id === postId);
      if (!foundPost) {
        return (
          <section className={cn(FEED_CARD, 'p-8 text-center')}>
            <h1 className="font-display text-[22px] font-bold text-pine-950 dark:text-white">
              পোস্টটি পাওয়া যায়নি
            </h1>
            <p className="mt-1 font-bangla text-[14px] text-pine-900/65 dark:text-white/60">
              এই পোস্টটি বর্তমানে পাওয়া যাচ্ছে না বা মুছে ফেলা হয়েছে।
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => goNavigate('/')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-pine-900 dark:bg-[#03EF62] text-canvas dark:text-[#061621] px-4 text-[13.5px] font-semibold"
              >
                <ArrowLeft className="size-4" /> হোম ফিডে ফিরুন
              </button>
            </div>
          </section>
        );
      }
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 sm:px-0 mb-3">
            <button
              type="button"
              onClick={() => goNavigate('/')}
              className="inline-flex items-center justify-center gap-2 rounded-full sm:rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-canvas-card size-9 sm:size-auto sm:px-3.5 sm:py-2 text-xs font-bold text-slate-800 dark:text-slate-100 hover:border-[#03EF62] hover:text-emerald-700 dark:hover:text-[#03EF62] transition shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-4 shrink-0" />
              <span className="hidden sm:inline font-bangla text-[13px]">হোম ফিডে ফিরুন</span>
            </button>
          </div>
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
            onShare={() => handleShare(foundPost.content)}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={(imgs, idx, t, an, ai) => openPhotoPopup(imgs, idx, t, undefined, an, ai)}
          />
        </div>
      );
    }

    switch (activeView) {
      case 'explore':
        return (
          <ExploreView
            articles={snap.articles}
            currentUser={currentUser}
            pillar={pillar}
            onPillar={setPillar}
            onOpenArticlePopup={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
            isLoading={isPageLoading}
            onOpenPhoto={(src, title, authorName, authorId) =>
              openPhotoPopup([src], 0, title, undefined, authorName, authorId)
            }
          />
        );
      case 'events':
        return (
          <EventsView
            events={snap.events}
            onNavigate={goNavigate}
            isLoading={isPageLoading}
            onOpenRegister={(ev) => setRegistrationEvent(ev)}
          />
        );
      case 'editorial':
        return (
          <EditorialDashboard
            articles={snap.articles}
            currentUser={currentUser}
            onOpenArticle={handleOpenArticlePopup}
          />
        );
      case 'notifications':
        return (
          <NotificationsView
            items={userNotifications}
            onRead={handleReadAllNotifications}
            onToggleRead={handleToggleNotificationRead}
            onDelete={handleDeleteNotification}
            onNavigate={goNavigate}
            isLoading={isPageLoading}
            onOpenArticle={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
          />
        );
      case 'profile': {
        const isOwn = !params.userId || params.userId === currentUser?.id;
        const targetId = viewedProfile?.id || '';
        const authorArticles = (snap.articles ?? []).filter((a) => a.authorId === targetId);
        const authorPosts = (snap.posts ?? []).filter((p) => p.authorId === targetId);
        const authorStories = (snap.stories ?? []).filter((s) => s.authorId === targetId);
        const userOrders = (snap.orders ?? []).filter((o) => !currentUser || o.buyerId === currentUser.id);
        return (
          <ProfileView
            profile={viewedProfile}
            isOwnProfile={isOwn}
            isFollowing={(snap.followingIds ?? []).includes(targetId)}
            currentUser={currentUser}
            authorArticles={authorArticles}
            authorPosts={authorPosts}
            authorStories={authorStories}
            savedArticles={savedArticles}
            savedPosts={savedPosts}
            orders={userOrders}
            bookmarkIds={snap.bookmarkedArticleIds}
            followingIdsCount={(snap.followingIds ?? []).length}
            allProfiles={allKnownProfiles}
            followingIds={snap.followingIds ?? []}
            allFollows={snap.follows ?? []}
            onToggleFollowUser={(uId) => handleToggleFollow(uId)}
            dark={dark}
            onToggleDark={toggleDark}
            isLoading={isPageLoading}
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
            onOpenCreatePost={() => {
              if (!currentUser) {
                requestAuth('পোস্ট তৈরি করতে দয়া করে লগইন করুন।', () => setReelUploadOpen(true));
              } else {
                setReelUploadOpen(true);
              }
            }}
            onOpenCreateStory={() => {
              if (!canCreateStory(currentUser)) {
                toast.error('স্টোরি তৈরির অনুমতি কেবল নির্দিষ্ট সম্পাদকীয় অ্যাকাউন্টের রয়েছে।');
                return;
              }
              setReelUploadOpen(true);
            }}
            onOpenWriteArticle={() => {
              if (!currentUser) {
                requestAuth('প্রতিবেদন লিখতে দয়া করে লগইন করুন।', () => setWriteOpen(true));
              } else {
                setWriteOpen(true);
              }
            }}
            onDeletePost={handleDeletePost}
            onDeleteStory={handleDeleteStory}
            onDeleteArticle={handleDeleteArticle}
            onOpenStory={(id) => setStoryViewerId(id)}
          />
        );
      }
      case 'publications':
        return <PublicationsStudioView onNavigate={goNavigate} />;
      case 'security':
        return (
          <AccountSecurityView
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenProfileSettings={() => setProfileSettingsOpen(true)}
          />
        );
      default:
        return (
          <CentralFeed
            currentUser={currentUser}
            articles={snap.articles ?? []}
            posts={snap.posts ?? []}
            stories={snap.stories ?? []}
            reels={snap.reels ?? []}
            savedReelIds={savedReelIds ?? []}
            followingIds={snap.followingIds ?? []}
            bookmarkIds={snap.bookmarkedArticleIds ?? []}
            isLoading={isPageLoading}
            onWriteArticle={() => {
              if (!currentUser) {
                requestAuth('প্রতিবেদন লিখতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setWriteOpen(true));
              } else {
                setWriteOpen(true);
              }
            }}
            onUploadVideo={() => {
              if (!currentUser) {
                requestAuth('ভিডিও বা রিল আপলোড করতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setReelUploadOpen(true));
              } else {
                setReelUploadOpen(true);
              }
            }}
            onAskAI={() => setAiOpen(true)}
            onOpenProfileSettings={() => {
              if (!currentUser) {
                requestAuth('প্রোফাইল সেটিংস পরিবর্তন করতে দয়া করে লগইন করুন।', () => setProfileSettingsOpen(true));
              } else {
                setProfileSettingsOpen(true);
              }
            }}
            onOpenSupabaseConsole={() => setSupaConsoleOpen(true)}
            onOpenStory={(target) => {
              if (typeof target === 'string') {
                setStoryViewerId(target);
              } else if (typeof target === 'number' && snap.stories[target]) {
                setStoryViewerId(snap.stories[target].id);
              }
            }}
            onCreateStory={() => {
              if (!canCreateStory(currentUser)) {
                toast.error('স্টোরি তৈরির অনুমতি কেবল নির্দিষ্ট সম্পাদকীয় অ্যাকাউন্টের রয়েছে।');
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
            onSaveReel={(id) => setSavedReelIds((s) => toggleBookmarkId(s, id))}
            onToggleFollow={handleToggleFollow}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={openPhotoPopup}
          />
        );
    }
  })();

  const breakdownRecords = useMemo(() => {
    if (!rxBreakdown) return [];
    return snap.reactions.filter(
      (r) => r.targetType === rxBreakdown.targetType && r.targetId === rxBreakdown.targetId,
    );
  }, [rxBreakdown, snap.reactions]);

  const breakdownCounts = useMemo(() => {
    if (!rxBreakdown) return undefined;
    if (rxBreakdown.targetType === 'article') {
      return snap.articles.find((a) => a.id === rxBreakdown.targetId)?.reactionCounts;
    }
    if (rxBreakdown.targetType === 'post') {
      return snap.posts.find((p) => p.id === rxBreakdown.targetId)?.reactionCounts;
    }
    return undefined;
  }, [rxBreakdown, snap.articles, snap.posts]);

  const isHomePage = activeView === 'home' && location.pathname === '/';

  return (
    <div className={cn('min-h-screen bg-canvas text-slate-900 dark:text-white flex flex-col justify-between', dark && 'dark')}>
      <SiteLoader />
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
          if (reelPlayerItems.length > 0) {
            setPlayer({ items: reelPlayerItems, start: 0 });
          } else {
            setReelUploadOpen(true);
          }
        }}
        notifications={userNotifications}
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
        <div className="relative w-full min-h-[calc(100vh-65px)]">
          <LeftSidebar
            currentUser={currentUser}
            articles={snap.articles}
            reels={snap.reels}
            savedCount={savedCount}
            onOpenSaved={() => setSavedOpen(true)}
            onOpenReels={() => {
              if (reelPlayerItems.length > 0) setPlayer({ items: reelPlayerItems, start: 0 });
              else setReelUploadOpen(true);
            }}
            onOpenProfileSettings={() => setProfileSettingsOpen(true)}
            onOpenAuth={() => requestAuth('লগইন বা সাইন আপ করুন')}
            onNavigate={goNavigate}
            activePillar={pillar}
            onPillar={setPillar}
          />

          <main className="min-w-0 pb-12 pt-3 px-3 sm:px-4 lg:ml-56 xl:ml-64 lg:mr-68 xl:mr-76 max-w-2xl xl:max-w-3xl mx-auto">
            {mainContent}
          </main>

          <RightSidebar
            articles={snap.articles}
            events={snap.events}
            profiles={snap.profiles}
            currentUserId={currentUser?.id || ''}
            followingIds={snap.followingIds}
            onToggleEvent={(id) => {
              commit((prev) => {
                const nextReg = toggleBookmarkId(prev.eventRegistrations, id);
                return {
                  ...prev,
                  eventRegistrations: nextReg,
                  events: prev.events.map((e) =>
                    e.id === id ? { ...e, isRegistered: nextReg.includes(id) } : e,
                  ),
                };
              });
            }}
            onOpenRegister={(ev) => setRegistrationEvent(ev)}
            onToggleFollow={handleToggleFollow}
            onOpenArticlePopup={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
            onNavigate={goNavigate}
            onOpenPhoto={(src, title, authorName, authorId) =>
              openPhotoPopup([src], 0, title, undefined, authorName, authorId)
            }
          />
        </div>
      ) : (
        <div className="relative w-full min-h-[calc(100vh-65px)]">
          <LeftSidebar
            currentUser={currentUser}
            articles={snap.articles}
            reels={snap.reels}
            savedCount={savedCount}
            onOpenSaved={() => setSavedOpen(true)}
            onOpenReels={() => {
              if (reelPlayerItems.length > 0) setPlayer({ items: reelPlayerItems, start: 0 });
              else setReelUploadOpen(true);
            }}
            onOpenProfileSettings={() => setProfileSettingsOpen(true)}
            onNavigate={goNavigate}
            activePillar={pillar}
            onPillar={setPillar}
          />
          <main className="min-w-0 pb-12 pt-4 px-4 lg:ml-56 xl:ml-64 max-w-4xl mx-auto">
            {mainContent}
          </main>
        </div>
      )}

      {/* Modals & Popups */}
      <CreatePostModal
        open={writeOpen}
        onClose={() => handleUiCloseModal(() => setWriteOpen(false))}
        currentUser={currentUser}
        onPublish={handlePublishArticle}
      />

      <FacebookCreatePostModal
        open={reelUploadOpen}
        onClose={() => handleUiCloseModal(() => setReelUploadOpen(false))}
        currentUser={currentUser}
        onSubmitReel={handlePublishReel}
      />

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
        bookmarked={!!readerArticle && (snap.bookmarkedArticleIds ?? []).includes(readerArticle.id)}
        currentUser={currentUser}
        onClose={() => handleUiCloseModal(() => setReaderId(null))}
        onReact={(type) => readerArticle && handleReact('article', readerArticle.id, type)}
        onOpenReactionsBreakdown={() =>
          readerArticle && setRxBreakdown({ targetType: 'article', targetId: readerArticle.id })
        }
        onBookmark={() => readerArticle && handleBookmarkArticle(readerArticle.id)}
        onComment={(t) => readerArticle && handleCommentArticle(readerArticle.id, t)}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReactComment={(cid, type) => handleReact('comment', cid, type)}
        onShare={() => readerArticle && handleShare(readerArticle.title)}
        onNavigateProfile={navigateToProfile}
        onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
          openPhotoPopup([src], 0, title, subtitle, authorName, authorId)
        }
      />

      <StoryViewerModal
        open={!!storyViewerId}
        initialStoryId={storyViewerId}
        stories={snap.stories ?? []}
        currentUser={currentUser}
        followingIds={snap.followingIds ?? []}
        comments={snap.comments ?? []}
        savedStoryIds={snap.savedPostIds ?? []}
        onClose={() => handleUiCloseModal(() => setStoryViewerId(null))}
        onToggleFollow={handleToggleFollow}
        onSave={(id) => setSavedReelIds((s) => toggleBookmarkId(s, id))}
        onOpenAuth={() => requestAuth('অনুগ্রহ করে লগইন করুন')}
        onNavigateProfile={navigateToProfile}
      />

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
        onReactStory={handleReactStoryOrReel}
        onBookmarkStory={handleBookmarkStoryOrReel}
      />

      <PhotoLightboxModal
        payload={lightbox}
        onClose={() => handleUiCloseModal(() => setLightbox(null))}
        onNavigateProfile={navigateToProfile}
      />

      <ReactionBreakdownModal
        open={!!rxBreakdown}
        onClose={() => handleUiCloseModal(() => setRxBreakdown(null))}
        records={breakdownRecords}
        counts={breakdownCounts}
        onNavigateProfile={navigateToProfile}
      />

      <ProfileSettingsModal
        open={profileSettingsOpen}
        onClose={() => handleUiCloseModal(() => setProfileSettingsOpen(false))}
        currentUser={currentUser}
        allProfiles={snap.profiles}
        onSaveProfile={handleSaveProfile}
        onSwitchUser={(userId) => {
          commit((prev) => ({ ...prev, currentUserId: userId }));
        }}
      />

      <EventRegistrationModal
        open={!!registrationEvent}
        event={registrationEvent}
        currentUser={currentUser}
        onClose={() => handleUiCloseModal(() => setRegistrationEvent(null))}
        onConfirmRegistration={(eventId) => {
          commit((prev) => ({
            ...prev,
            eventRegistrations: [...prev.eventRegistrations, eventId],
            events: prev.events.map((e) =>
              e.id === eventId ? { ...e, isRegistered: true } : e,
            ),
          }));
        }}
      />

      <AuthModal
        open={authModalOpen}
        promptReason={authPromptReason}
        reason={authPromptReason}
        onClose={() =>
          handleUiCloseModal(() => {
            setAuthModalOpen(false);
            setPendingAction(null);
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
          className:
            'font-bangla !rounded-xl !border !border-[#04301f] !shadow-[3px_3px_0_#04301f] !bg-[#fdfaf5] !text-[#04301f]',
        }}
      />
    </div>
  );
}
