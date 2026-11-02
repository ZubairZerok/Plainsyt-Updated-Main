import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Toaster, toast } from 'sonner';
import { ArrowLeft, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStoredAuthUser, logoutUser } from '../lib/auth';
import {
  readSnapshot, writeSnapshot, fetchFromSupabase, syncLocalToSupabase, mutateSnapshotReaction,
  DEFAULT_SEED_SNAPSHOT,
  dbUpsertProfile, dbUpsertArticle, dbUpsertPost, dbInsertComment, dbSetReaction,
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
import { AskAIModal } from './AskAIModal';
import { ArticleReaderModal, ArticleReaderContent } from './ArticleReaderModal';
import { ReelPlayerModal, type PlayerItem } from './ReelPlayerModal';
import { SavedArticlesModal } from './SavedArticlesModal';
import { CreatePostModal } from './CreatePostModal';
import { ExploreView, EventsView, StoreView, IdeasView, NotificationsView, ProfileView } from './Views';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { BkashCheckoutModal, CreateProductModal } from './BkashCheckoutModal';
import { ReactionBreakdownModal } from './LinkedInReactionBar';
import { SiteLoader } from './SiteLoader';
import { EventRegistrationModal } from './EventRegistrationModal';
import { EventDetailPage } from './EventDetailPage';
import { AuthModal } from './AuthModal';
import { FEED_CARD, cn } from './Primitives';

export function RootShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ userId?: string; articleId?: string; eventId?: string }>();

  const [snap, setSnap] = useState<DatabaseSnapshot>(() => readSnapshot());
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
  const [aiOpen, setAiOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [registrationEvent, setRegistrationEvent] = useState<UpcomingEvent | null>(null);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ items: PlayerItem[]; start: number } | null>(null);
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

  useEffect(() => {
    refreshFromSupabase();
    const channel = supabase
      .channel('plainsyt-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refreshFromSupabase();
      })
      .subscribe();

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const profile: UserProfile = {
          id: u.id,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'PLAiNSYT Member',
          nameBn: u.user_metadata?.full_name || u.email?.split('@')[0] || 'সদস্য',
          handle: (u.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          role: 'সদস্য',
          organization: 'PLAiNSYT Platform',
          location: 'বাংলাদেশ',
          bio: 'PLAiNSYT কমিউনিটি সদস্য।',
          avatar: u.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
          coverGradient: 'linear-gradient(135deg, #061621 0%, #00ED64 100%)',
          isVerified: false,
          focusArea: 'কৃষি ও প্রযুক্তি',
          publicationsCount: 0,
          followersCount: 0,
          followingCount: 0,
        };
        commit((prev) => {
          const exists = prev.profiles.some((p) => p.id === profile.id);
          const profiles = exists
            ? prev.profiles.map((p) => (p.id === profile.id ? { ...p, ...profile } : p))
            : [profile, ...prev.profiles];
          return { ...prev, profiles, currentUserId: profile.id };
        });
        dbUpsertProfile(profile);
      }
    });

    return () => {
      supabase.removeChannel(channel);
      authSub?.subscription.unsubscribe();
    };
  }, [refreshFromSupabase, commit]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState<string | undefined>();
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const currentUser = useMemo(() => {
    const stored = getStoredAuthUser();
    const activeId = snap.currentUserId || stored?.id;
    if (!activeId) return null;
    return snap.profiles.find((p) => p.id === activeId) ?? null;
  }, [snap.profiles, snap.currentUserId]);

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
      toast.success(`স্বাগতম, ${profile.name}!`);
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
    toast.success('সফলভাবে সাইন আউট হয়েছে');
  }, [commit]);

  const activeView: View = useMemo(() => {
    const p = location.pathname;
    if (p.startsWith('/explore')) return 'explore';
    if (p.startsWith('/events')) return 'events';
    if (p.startsWith('/store')) return 'store';
    if (p.startsWith('/ideas')) return 'ideas';
    if (p.startsWith('/notifications')) return 'notifications';
    if (p.startsWith('/profile')) return 'profile';
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
        toast.success('লেখা কপি করা হয়েছে', {
          description: selection.length > 35 ? `${selection.slice(0, 32)}...` : selection,
          duration: 2200,
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
          }
          // Ultra guard: Never notify self for own actions
          if (authorId && authorId !== actor.id) {
            const notif: NotificationItem = {
              id: `notif-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
              recipientId: authorId,
              userId: authorId,
              actorId: actor.id,
              actorName: actor.name,
              actorAvatar: actor.avatar,
              type: 'reaction',
              entityType: targetType === 'comment' ? 'comment' : targetType,
              entityId: targetId,
              targetUrl: targetType === 'article' ? `/article/${targetId}` : `/#post-${targetId}`,
              message: `${actor.name} আপনার "${targetTitle}" বিষয়ে প্রতিক্রিয়া জানিয়েছেন।`,
              title: 'নতুন প্রতিক্রিয়া',
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
      const was = snap.bookmarkedArticleIds.includes(articleId);
      commit((prev) => ({
        ...prev,
        bookmarkedArticleIds: toggleBookmarkId(prev.bookmarkedArticleIds, articleId),
      }));
      toast(was ? 'সংরক্ষিত তালিকা থেকে সরানো হয়েছে' : 'সংরক্ষিত তালিকায় যোগ হয়েছে');
    },
    [currentUser, snap.bookmarkedArticleIds, commit, requestAuth],
  );

  const handleCommentArticle = useCallback(
    (articleId: string, text: string) => {
      if (!currentUser) {
        requestAuth('মন্তব্য করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentArticle(articleId, text);
        });
        return;
      }
      const actor = currentUser;
      const newComment = makeComment(text, actor, 'article', articleId);
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
    },
    [commit, currentUser, requestAuth, snap.articles],
  );

  const handleCommentPost = useCallback(
    (postId: string, text: string) => {
      if (!currentUser) {
        requestAuth('পোস্টে মন্তব্য করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentPost(postId, text);
        });
        return;
      }
      const actor = currentUser;
      const newComment = makeComment(text, actor, 'post', postId);
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
          targetUrl: `/#post-${postId}`,
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
    },
    [commit, currentUser, requestAuth, snap.posts],
  );

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
      toast('পোস্ট সংরক্ষণ আপডেট হয়েছে');
    },
    [currentUser, commit, requestAuth],
  );

  const handleCommentStoryOrReel = useCallback(
    (targetId: string, text: string) => {
      if (!currentUser) {
        requestAuth('মন্তব্য করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।', () => {
          handleCommentStoryOrReel(targetId, text);
        });
        return;
      }
      const newComment = makeComment(text, currentUser, 'reel', targetId);
      commit((prev) => ({
        ...prev,
        comments: [newComment, ...prev.comments],
      }));
      dbInsertComment(newComment);
      toast.success('মন্তব্য প্রকাশ করা হয়েছে');
    },
    [commit, currentUser, requestAuth],
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
      toast.success('স্টোরিটি সংরক্ষিত তালিকায় যুক্ত হয়েছে');
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
      toast.success('বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে');
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
    toast.success('সকল বিজ্ঞপ্তি পড়া হয়েছে চিহ্নিত করা হলো');
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
        toast.error('আপনি শুধুমাত্র নিজের পোস্ট মুছতে পারবেন');
        return;
      }
      commit((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== postId),
        comments: prev.comments.filter((c) => !(c.targetType === 'post' && c.targetId === postId)),
      }));
      dbDeletePost(postId);
      toast.success('পোস্টটি মুছে ফেলা হয়েছে');
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
        toast.error('আপনি শুধুমাত্র নিজের স্টোরি মুছতে পারবেন');
        return;
      }
      commit((prev) => ({
        ...prev,
        stories: prev.stories.filter((s) => s.id !== storyId),
      }));
      dbDeleteStory(storyId);
      toast.success('স্টোরিটি মুছে ফেলা হয়েছে');
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
        toast.error('আপনি শুধুমাত্র নিজের প্রতিবেদন মুছতে পারবেন');
        return;
      }
      commit((prev) => ({
        ...prev,
        articles: prev.articles.filter((a) => a.id !== articleId),
        comments: prev.comments.filter((c) => !(c.targetType === 'article' && c.targetId === articleId)),
      }));
      dbDeleteArticle(articleId);
      toast.success('প্রতিবেদনটি মুছে ফেলা হয়েছে');
    },
    [commit, currentUser, requestAuth, snap.articles],
  );

  const handleShare = useCallback((label: string) => {
    const shareUrl = window.location.href;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    toast.success('লিংক কপি হয়েছে', { description: label });
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
      commit((prev) => {
        const exists = prev.profiles.some((p) => p.id === profile.id);
        const profiles = exists
          ? prev.profiles.map((p) => (p.id === profile.id ? profile : p))
          : [profile, ...prev.profiles];
        // Also propagate updated author name/avatar to their authored articles & posts
        const articles = prev.articles.map((a) =>
          a.authorId === profile.id
            ? {
                ...a,
                author: {
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
      toast.success('প্রোফাইল Supabase-এ সংরক্ষিত হয়েছে', { description: profile.name });
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
      toast.success('প্রতিবেদন Supabase-এ প্রকাশিত হয়েছে', {
        description: `${toBengaliNumerals(enriched.readTimeMinutes)} মিনিট পড়া · ${enriched.category}`,
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
      toast.success('রিল ও স্টোরি Supabase-এ সংরক্ষিত হয়েছে');
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
        toast.error('আপনি নিজেকে অনুসরণ করতে পারবেন না');
        return;
      }
      const was = snap.followingIds.includes(targetUserId);
      const nextFollowingIds = toggleBookmarkId(snap.followingIds, targetUserId);
      commit((prev) => ({
        ...prev,
        followingIds: nextFollowingIds,
      }));
      dbToggleFollow(currentUser.id, targetUserId, !was);
      const targetProfile = snap.profiles.find((p) => p.id === targetUserId);
      toast(was ? 'আনফলো করা হয়েছে' : `${targetProfile?.name || 'গবেষক'}-কে ফলো করছেন`);

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

  // Store & Cart handlers
  const handleAddToCart = useCallback(
    (product: StoreProduct) => {
      commit((prev) => {
        const existing = prev.cart.find((c) => c.productId === product.id);
        const nextCart = existing
          ? prev.cart.map((c) => (c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c))
          : [...prev.cart, { productId: product.id, quantity: 1 }];
        return { ...prev, cart: nextCart };
      });
      toast.success('কার্টে যোগ হয়েছে', { description: product.name });
    },
    [commit],
  );

  const handleUpdateCartQty = useCallback(
    (productId: string, qty: number) => {
      commit((prev) => ({
        ...prev,
        cart:
          qty <= 0
            ? prev.cart.filter((c) => c.productId !== productId)
            : prev.cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
      }));
    },
    [commit],
  );

  const handleCompleteOrder = useCallback(
    (order: BkashOrder) => {
      commit((prev) => {
        const updatedProducts = prev.storeProducts.map((p) => {
          const ordered = order.items.find((i) => i.productId === p.id);
          if (!ordered) return p;
          const nextStock = Math.max(0, p.stock - ordered.quantity);
          dbUpsertProduct({ ...p, stock: nextStock });
          return { ...p, stock: nextStock };
        });
        return {
          ...prev,
          orders: [order, ...prev.orders],
          storeProducts: updatedProducts,
          cart: [],
        };
      });
      dbInsertOrder(order);
      toast.success(`বিকাশ পেমেন্ট (${order.receiverBkash}) ও অর্ডার সম্পন্ন!`, {
        description: `Order #${order.orderNumber} · TrxID: ${order.trxId}`,
      });
    },
    [commit],
  );

  const reelPlayerItems: PlayerItem[] = useMemo(
    () =>
      snap.reels.map((r) => ({
        id: r.id,
        title: r.title,
        creator: r.creator,
        avatar: r.creatorAvatar,
        image: r.mediaUrl,
        meta: r.duration,
        likes: r.likes,
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
      })),
    [snap.stories],
  );

  const savedArticles = useMemo(
    () => snap.articles.filter((a) => snap.bookmarkedArticleIds.includes(a.id)),
    [snap.articles, snap.bookmarkedArticleIds],
  );
  const savedPosts = useMemo(() => snap.posts.filter((p) => p.userSaved), [snap.posts]);
  const savedCount = savedArticles.length + savedPosts.length;
  const cartCount = useMemo(() => snap.cart.reduce((s, c) => s + c.quantity, 0), [snap.cart]);
  const readerArticle = useMemo(
    () =>
      snap.articles.find((a) => a.id === readerId || a.slug === readerId) ??
      DEFAULT_SEED_SNAPSHOT.articles.find((a) => a.id === readerId || a.slug === readerId) ??
      null,
    [snap.articles, readerId],
  );

  // Determine profile target for /profile or /profile/:userId
  const viewedProfile = useMemo(() => {
    const targetId = params.userId || currentUser?.id;
    if (!targetId) return null;
    const found = snap.profiles.find((p) => p.id === targetId);
    if (found) return found;
    // Synthesize profile from authored articles/posts if not yet in profiles array
    const fromArt = snap.articles.find((a) => a.authorId === targetId);
    if (fromArt) {
      return {
        id: targetId,
        name: fromArt.author.name,
        nameBn: fromArt.author.name,
        handle: targetId.toLowerCase(),
        role: fromArt.author.designation,
        organization: fromArt.author.organization,
        location: 'Bangladesh',
        bio: '',
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
    return null;
  }, [params.userId, currentUser, snap.profiles, snap.articles]);

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
    if (location.pathname.startsWith('/article/')) {
      if (!standaloneArticle) {
        return (
          <section className={cn(FEED_CARD, 'p-8 text-center')}>
            <h1 className="font-display text-[24px] font-bold text-pine-950">
              প্রতিবেদনটি পাওয়া যায়নি
            </h1>
            <p className="mt-1 font-bangla text-[14px] text-pine-900/65">
              এই প্রতিবেদনটি এখনো Supabase-এ যোগ করা হয়নি বা মুছে ফেলা হয়েছে।
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
          <div className="flex items-center justify-between px-2 sm:px-0">
            <button
              type="button"
              onClick={() => goNavigate('/')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-pine-900 bg-canvas-card px-3 py-1.5 text-[13px] font-semibold text-pine-900 shadow-tactile-xs"
            >
              <ArrowLeft className="size-4" /> Back to Home Feed
            </button>
            <span className="font-mono text-[11px] text-pine-600">
              Standalone Article Route · /article/{standaloneArticle.id}
            </span>
          </div>
          <ArticleReaderContent
            article={standaloneArticle}
            bookmarked={snap.bookmarkedArticleIds.includes(standaloneArticle.id)}
            currentUser={currentUser}
            isStandalonePage
            onClose={() => goNavigate('/')}
            onReact={(type) => handleReact('article', standaloneArticle.id, type)}
            onOpenReactionsBreakdown={() =>
              setRxBreakdown({ targetType: 'article', targetId: standaloneArticle.id })
            }
            onBookmark={() => handleBookmarkArticle(standaloneArticle.id)}
            onComment={(t) => handleCommentArticle(standaloneArticle.id, t)}
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
            onOpenRegister={(ev) => setRegistrationEvent(ev)}
          />
        );
      case 'store':
        return (
          <StoreView
            products={snap.storeProducts}
            cart={snap.cart}
            ordersCount={snap.orders.length}
            onAddToCart={handleAddToCart}
            onOpenCheckout={() => {
              if (!currentUser) {
                requestAuth('অর্ডার সম্পন্ন করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => setCheckoutOpen(true));
              } else {
                setCheckoutOpen(true);
              }
            }}
            onOpenCreateProduct={() => {
              if (!currentUser) {
                requestAuth('পণ্য যোগ করতে দয়া করে আপনার অ্যাকাউন্টে লগইন করুন।', () => setCreateProductOpen(true));
              } else {
                setCreateProductOpen(true);
              }
            }}
            onNavigateProfile={navigateToProfile}
            onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
              openPhotoPopup([src], 0, title, subtitle, authorName, authorId)
            }
          />
        );
      case 'ideas':
        return (
          <IdeasView
            ideas={snap.ideas}
            onSubmitIdea={(title, body, tag) => {
              if (!currentUser) {
                requestAuth('নতুন আইডিয়া জমা দিতে দয়া করে অ্যাকাউন্টে লগইন করুন।');
                return;
              }
              const actor = currentUser;
              const idea = {
                id: `idea-${Date.now().toString(36)}`,
                title,
                body,
                authorId: actor.id,
                author: actor.name,
                authorAvatar: actor.avatar,
                votes: 1,
                tag,
                voted: true,
                createdAt: new Date().toISOString(),
              };
              commit((prev) => ({
                ...prev,
                ideas: [idea, ...prev.ideas],
                votedIdeaIds: [...prev.votedIdeaIds, idea.id],
              }));
              dbUpsertIdea(idea);
              toast.success('আইডিয়া Supabase-এ জমা হয়েছে');
            }}
            onToggleVote={(id) => {
              if (!currentUser) {
                requestAuth('আইডিয়ায় ভোট দিতে দয়া করে অ্যাকাউন্টে লগইন করুন।');
                return;
              }
              commit((prev) => {
                const voted = prev.votedIdeaIds.includes(id);
                const nextVoted = toggleBookmarkId(prev.votedIdeaIds, id);
                const nextIdeas = prev.ideas.map((i) => {
                  if (i.id !== id) return i;
                  const updated = { ...i, voted: !voted, votes: Math.max(0, i.votes + (voted ? -1 : 1)) };
                  dbUpsertIdea(updated);
                  return updated;
                });
                return { ...prev, votedIdeaIds: nextVoted, ideas: nextIdeas };
              });
            }}
            onNavigateProfile={navigateToProfile}
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
            onOpenArticle={handleOpenArticlePopup}
            onNavigateProfile={navigateToProfile}
          />
        );
      case 'profile': {
        const isOwn = !params.userId || params.userId === currentUser?.id;
        const targetId = viewedProfile?.id || '';
        const authorArticles = snap.articles.filter((a) => a.authorId === targetId);
        const authorPosts = snap.posts.filter((p) => p.authorId === targetId);
        const authorStories = snap.stories.filter((s) => s.authorId === targetId);
        const userOrders = snap.orders.filter((o) => !currentUser || o.buyerId === currentUser.id);
        return (
          <ProfileView
            profile={viewedProfile}
            isOwnProfile={isOwn}
            isFollowing={snap.followingIds.includes(targetId)}
            currentUser={currentUser}
            authorArticles={authorArticles}
            authorPosts={authorPosts}
            authorStories={authorStories}
            savedArticles={savedArticles}
            savedPosts={savedPosts}
            orders={userOrders}
            bookmarkIds={snap.bookmarkedArticleIds}
            dark={dark}
            onToggleDark={toggleDark}
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
              if (!currentUser) {
                requestAuth('স্টোরি তৈরি করতে দয়া করে লগইন করুন।', () => setReelUploadOpen(true));
              } else {
                setReelUploadOpen(true);
              }
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
          />
        );
      }
      default:
        return (
          <CentralFeed
            currentUser={currentUser}
            articles={snap.articles}
            posts={snap.posts}
            stories={snap.stories}
            reels={snap.reels}
            savedReelIds={savedReelIds}
            followingIds={snap.followingIds}
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
            onOpenStory={(i) => {
              if (storyPlayerItems.length > 0) setPlayer({ items: storyPlayerItems, start: i });
            }}
            onCreateStory={() => {
              if (!currentUser) {
                requestAuth('স্টোরি তৈরি করতে দয়া করে অ্যাকাউন্টে লগইন করুন।', () => setReelUploadOpen(true));
              } else {
                setReelUploadOpen(true);
              }
            }}
            onOpenArticlePopup={handleOpenArticlePopup}
            onReact={handleReact}
            onOpenReactionsBreakdown={(targetType, tId) => setRxBreakdown({ targetType, targetId: tId })}
            onBookmarkArticle={handleBookmarkArticle}
            onCommentArticle={handleCommentArticle}
            onSavePost={handleSavePost}
            onCommentPost={handleCommentPost}
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
        cartCount={cartCount}
        reelsCount={snap.reels.length}
        onOpenCart={() => setCheckoutOpen(true)}
        onOpenSaved={() => setSavedOpen(true)}
        onOpenReels={() => {
          if (reelPlayerItems.length > 0) {
            setPlayer({ items: reelPlayerItems, start: 0 });
          } else {
            setReelUploadOpen(true);
          }
        }}
        onOpenAI={() => setAiOpen(true)}
        notifications={userNotifications}
        onReadNotifications={handleReadAllNotifications}
        onToggleNotificationRead={handleToggleNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onOpenAuth={() => requestAuth('লগইন বা সাইন আপ করুন')}
        onLogout={handleLogout}
        onOpenProfileSettings={() => setProfileSettingsOpen(true)}
        articles={snap.articles}
        posts={snap.posts}
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
            onOpenAI={() => setAiOpen(true)}
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
            onOpenAI={() => setAiOpen(true)}
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
        onClose={() => setWriteOpen(false)}
        currentUser={currentUser}
        onPublish={handlePublishArticle}
      />

      <FacebookCreatePostModal
        open={reelUploadOpen}
        onClose={() => setReelUploadOpen(false)}
        currentUser={currentUser}
        onSubmitReel={handlePublishReel}
      />

      <AskAIModal open={aiOpen} onClose={() => setAiOpen(false)} currentUser={currentUser} />

      <SavedArticlesModal
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
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
        onClose={() => setReaderId(null)}
        onReact={(type) => readerArticle && handleReact('article', readerArticle.id, type)}
        onOpenReactionsBreakdown={() =>
          readerArticle && setRxBreakdown({ targetType: 'article', targetId: readerArticle.id })
        }
        onBookmark={() => readerArticle && handleBookmarkArticle(readerArticle.id)}
        onComment={(t) => readerArticle && handleCommentArticle(readerArticle.id, t)}
        onReactComment={(cid, type) => handleReact('comment', cid, type)}
        onShare={() => readerArticle && handleShare(readerArticle.title)}
        onNavigateProfile={navigateToProfile}
        onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
          openPhotoPopup([src], 0, title, subtitle, authorName, authorId)
        }
      />

      <ReelPlayerModal
        items={player?.items ?? null}
        start={player?.start ?? 0}
        currentUser={currentUser}
        comments={snap.comments}
        onClose={() => setPlayer(null)}
        onShare={handleShare}
        onOpenAuth={() => requestAuth('মন্তব্য বা প্রতিক্রিয়া জানাতে অনুগ্রহ করে লগইন করুন')}
        onComment={handleCommentStoryOrReel}
        onReactStory={handleReactStoryOrReel}
        onBookmarkStory={handleBookmarkStoryOrReel}
      />

      <PhotoLightboxModal
        payload={lightbox}
        onClose={() => setLightbox(null)}
        onNavigateProfile={navigateToProfile}
      />

      <ReactionBreakdownModal
        open={!!rxBreakdown}
        onClose={() => setRxBreakdown(null)}
        records={breakdownRecords}
        counts={breakdownCounts}
        onNavigateProfile={navigateToProfile}
      />

      <ProfileSettingsModal
        open={profileSettingsOpen}
        onClose={() => setProfileSettingsOpen(false)}
        currentUser={currentUser}
        allProfiles={snap.profiles}
        onSaveProfile={handleSaveProfile}
        onSwitchUser={(userId) => {
          commit((prev) => ({ ...prev, currentUserId: userId }));
          toast.success('অ্যাক্টিভ প্রোফাইল পরিবর্তন হয়েছে');
        }}
      />

      <CreateProductModal
        open={createProductOpen}
        onClose={() => setCreateProductOpen(false)}
        currentUser={currentUser}
        onCreateProduct={(product) => {
          commit((prev) => ({
            ...prev,
            storeProducts: [product, ...prev.storeProducts],
          }));
          dbUpsertProduct(product);
          toast.success('পণ্যটি Supabase Store-এ যুক্ত হয়েছে', { description: product.name });
        }}
      />

      <BkashCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={snap.cart}
        products={snap.storeProducts}
        currentUser={currentUser}
        orders={snap.orders}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={() => commit((prev) => ({ ...prev, cart: [] }))}
        onCompleteOrder={handleCompleteOrder}
      />

      <EventRegistrationModal
        open={!!registrationEvent}
        event={registrationEvent}
        currentUser={currentUser}
        onClose={() => setRegistrationEvent(null)}
        onConfirmRegistration={(eventId) => {
          commit((prev) => ({
            ...prev,
            eventRegistrations: [...prev.eventRegistrations, eventId],
            events: prev.events.map((e) =>
              e.id === eventId ? { ...e, isRegistered: true } : e,
            ),
          }));
          toast.success('রেজিস্ট্রেশন সম্পন্ন হয়েছে! আপনার আসন নিশ্চিত।');
        }}
      />

      <AuthModal
        open={authModalOpen}
        promptReason={authPromptReason}
        reason={authPromptReason}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <Toaster
        position="bottom-center"
        toastOptions={{
          className:
            'font-bangla !rounded-xl !border !border-[#04301f] !shadow-[3px_3px_0_#04301f] !bg-[#fdfaf5] !text-[#04301f]',
        }}
      />
    </div>
  );
}
