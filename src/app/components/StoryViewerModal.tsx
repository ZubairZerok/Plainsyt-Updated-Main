import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Pause,
  Play,
  Send,
  UserPlus,
  Check,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Smile,
  ThumbsUp,
} from 'lucide-react';
import { Avatar, FollowIconButton, Num, cn } from './Primitives';
import type { CommentItem, LinkedInReactionType, ReactionTargetType, TopicStory, UserProfile } from '../types';
import { toBengaliNumerals, LINKEDIN_REACTIONS, getReactionMeta } from '../utils/pureLogic';
import { YouTubeMark, buildYouTubeEmbedSrc, ytPostCommand, parseDurationLabel } from './YouTubeMark';
import { LinkedInReactionBadge } from './LinkedInReactionBar';

export interface AccountStoryGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorHandle?: string;
  stories: TopicStory[];
}

export function getYouTubeEmbedInfo(url?: string): { embedUrl: string; directUrl: string; videoId: string } | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    const videoId = match[1];
    return {
      videoId,
      embedUrl: buildYouTubeEmbedSrc(videoId, { autoplay: true, muted: false, loop: true }),
      directUrl: `https://www.youtube.com/shorts/${videoId}`,
    };
  }
  return null;
}

const QUICK_EMOJIS = ['❤️', '🔥', '👏', '💡', '😮', '😂'];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percentage 10% - 90%
}

interface Props {
  open: boolean;
  stories: TopicStory[];
  initialStoryId?: string | null;
  currentUser: UserProfile | null;
  followingIds: string[];
  comments?: CommentItem[];
  savedStoryIds?: string[];
  onClose: () => void;
  onToggleFollow: (authorId: string) => void;
  onReact: (targetType: ReactionTargetType, targetId: string, type: LinkedInReactionType) => void;
  onComment: (targetId: string, text: string) => void;
  onShare: (title: string) => void;
  onSave: (storyId: string) => void;
  onOpenAuth: () => void;
  onNavigateProfile?: (userId: string) => void;
}

export function StoryViewerModal({
  open,
  stories,
  initialStoryId,
  currentUser,
  followingIds,
  comments = [],
  savedStoryIds = [],
  onClose,
  onToggleFollow,
  onReact,
  onComment,
  onShare,
  onSave,
  onOpenAuth,
  onNavigateProfile,
}: Props) {
  // 1. Group stories by author account
  const accountGroups: AccountStoryGroup[] = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    const groups: AccountStoryGroup[] = [];
    for (const story of stories) {
      const authorId = story.authorId || 'usr-plainsyt-admin';
      let g = groups.find((grp) => grp.authorId === authorId);
      if (!g) {
        g = {
          authorId,
          authorName: story.authorName || 'PLAiNSYT',
          authorAvatar: story.authorAvatar || '/logos/icon.png',
          stories: [],
        };
        groups.push(g);
      }
      g.stories.push(story);
    }
    return groups;
  }, [stories]);

  const [accountIdx, setAccountIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cubeAngle, setCubeAngle] = useState(0); // 3D rotation angle: 0, -90, 90
  const [isRotating, setIsRotating] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, LinkedInReactionType>>({});
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragging = useRef(false);

  // Position at initialStoryId on open
  useEffect(() => {
    if (!open || accountGroups.length === 0) return;
    if (initialStoryId) {
      for (let a = 0; a < accountGroups.length; a++) {
        const sIndex = accountGroups[a].stories.findIndex((s) => s.id === initialStoryId);
        if (sIndex !== -1) {
          setAccountIdx(a);
          setStoryIdx(sIndex);
          setProgress(0);
          setCubeAngle(0);
          setIsCaptionExpanded(false);
          return;
        }
      }
    }
    setAccountIdx(0);
    setStoryIdx(0);
    setProgress(0);
    setCubeAngle(0);
    setIsCaptionExpanded(false);
  }, [open, initialStoryId, accountGroups]);

  // Collapse expanded caption on story transition
  useEffect(() => {
    setIsCaptionExpanded(false);
  }, [accountIdx, storyIdx]);

  const currentGroup = accountGroups[accountIdx] ?? accountGroups[0];
  const currentStory = currentGroup?.stories[storyIdx] ?? currentGroup?.stories[0];
  const totalAccountStories = currentGroup?.stories.length ?? 1;

  const ytInfo = currentStory ? getYouTubeEmbedInfo(currentStory.videoUrl) : null;
  const storyDurationSec = ytInfo ? 10 : 5; // 5s for image stories, 10s for video clips

  // --- Story Progression Engine ---
  // isSwipe = true -> 3D cube rotate transition between accounts
  // isSwipe = false (tap / timer) -> normal instant transition without 3D rotation (Facebook style)
  const advanceToNext = useCallback((isSwipe = false) => {
    if (!currentGroup) return;
    if (storyIdx < currentGroup.stories.length - 1) {
      // Advance to next story within the same account
      setStoryIdx((s) => s + 1);
      setProgress(0);
    } else {
      // Reached the end of this account's stories
      if (accountIdx < accountGroups.length - 1) {
        if (isSwipe) {
          setIsRotating(true);
          setCubeAngle(-90);
          setTimeout(() => {
            setAccountIdx((a) => a + 1);
            setStoryIdx(0);
            setProgress(0);
            setCubeAngle(0);
            setIsRotating(false);
          }, 380);
        } else {
          // Instant normal transition on tap / timer (no 3D animation, just like Facebook)
          setAccountIdx((a) => a + 1);
          setStoryIdx(0);
          setProgress(0);
          setCubeAngle(0);
        }
      } else {
        // Last story of last account -> Close viewer
        onClose();
      }
    }
  }, [accountIdx, accountGroups.length, currentGroup, storyIdx, onClose]);

  const advanceToPrev = useCallback((isSwipe = false) => {
    if (storyIdx > 0) {
      // Previous story within the same account
      setStoryIdx((s) => s - 1);
      setProgress(0);
    } else {
      // Reached the beginning of this account's stories
      if (accountIdx > 0) {
        if (isSwipe) {
          setIsRotating(true);
          setCubeAngle(90);
          setTimeout(() => {
            const prevAccIdx = accountIdx - 1;
            const prevAccLastStoryIdx = (accountGroups[prevAccIdx]?.stories.length ?? 1) - 1;
            setAccountIdx(prevAccIdx);
            setStoryIdx(Math.max(0, prevAccLastStoryIdx));
            setProgress(0);
            setCubeAngle(0);
            setIsRotating(false);
          }, 380);
        } else {
          // Instant normal transition on tap (no 3D animation)
          const prevAccIdx = accountIdx - 1;
          const prevAccLastStoryIdx = (accountGroups[prevAccIdx]?.stories.length ?? 1) - 1;
          setAccountIdx(prevAccIdx);
          setStoryIdx(Math.max(0, prevAccLastStoryIdx));
          setProgress(0);
          setCubeAngle(0);
        }
      } else {
        setProgress(0);
      }
    }
  }, [accountIdx, accountGroups, storyIdx]);

  // Timer loop for story progression
  useEffect(() => {
    if (!open || paused || isHolding || showComments || isCaptionExpanded || isRotating || !currentStory) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      return;
    }

    const intervalMs = 50;
    const step = intervalMs / (storyDurationSec * 1000);

    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          advanceToNext(false);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [open, paused, isHolding, showComments, isCaptionExpanded, isRotating, currentStory, storyDurationSec, advanceToNext]);

  // YouTube / Video Playback Sync
  useEffect(() => {
    if (!open) return;
    if (paused || isHolding || showComments) {
      ytPostCommand(iframeRef.current, 'pauseVideo');
      videoRef.current?.pause();
    } else {
      ytPostCommand(iframeRef.current, 'playVideo');
      void videoRef.current?.play().catch(() => undefined);
    }
  }, [open, paused, isHolding, showComments, storyIdx, accountIdx]);

  useEffect(() => {
    ytPostCommand(iframeRef.current, isMuted ? 'mute' : 'unMute');
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, storyIdx, accountIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (showComments) setShowComments(false);
        else onClose();
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        advanceToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        advanceToPrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showComments, onClose, advanceToNext, advanceToPrev]);

  // --- Touch & Pointer Gestures for 3D Cube Rotation and Tap Zones ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (showComments) return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, input, textarea, a, form, [role="button"]')) {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    pointerStart.current = { x, y, time: Date.now() };
    isDragging.current = false;

    // Start long-press detection
    holdTimer.current = setTimeout(() => {
      setIsHolding(true);
      setPaused(true);
    }, 160);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current || showComments || isRotating) return;
    const deltaX = e.clientX - pointerStart.current.x;
    const deltaY = e.clientY - pointerStart.current.y;

    if (Math.abs(deltaX) > 12) {
      // Detected horizontal drag
      isDragging.current = true;
      if (holdTimer.current) clearTimeout(holdTimer.current);
      setIsHolding(false);
      setPaused(true);

      const cardWidth = cardRef.current?.clientWidth || 400;
      let angle = (deltaX / cardWidth) * 90;

      // Rubber-band resistance at list boundaries
      if (accountIdx === 0 && angle > 0) angle *= 0.3;
      if (accountIdx === accountGroups.length - 1 && angle < 0) angle *= 0.3;

      setCubeAngle(angle);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);

    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, input, textarea, a, form, [role="button"]')) {
      setIsHolding(false);
      setPaused(false);
      pointerStart.current = null;
      return;
    }

    if (isHolding) {
      setIsHolding(false);
      setPaused(false);
      pointerStart.current = null;
      return;
    }

    if (!pointerStart.current) return;
    const start = pointerStart.current;
    pointerStart.current = null;

    const deltaX = e.clientX - start.x;
    const elapsed = Date.now() - start.time;

    // If dragged horizontally: complete the 3D cube rotation
    if (isDragging.current) {
      isDragging.current = false;
      const cardWidth = cardRef.current?.clientWidth || 400;
      const threshold = cardWidth * 0.18;

      if (deltaX < -threshold && accountIdx < accountGroups.length - 1) {
        // Swiped Left -> Rotate to Next Account
        setIsRotating(true);
        setCubeAngle(-90);
        setTimeout(() => {
          setAccountIdx((a) => a + 1);
          setStoryIdx(0);
          setProgress(0);
          setCubeAngle(0);
          setIsRotating(false);
          setPaused(false);
        }, 380);
      } else if (deltaX > threshold && accountIdx > 0) {
        // Swiped Right -> Rotate to Previous Account
        setIsRotating(true);
        setCubeAngle(90);
        setTimeout(() => {
          setAccountIdx((a) => a - 1);
          setStoryIdx(0);
          setProgress(0);
          setCubeAngle(0);
          setIsRotating(false);
          setPaused(false);
        }, 380);
      } else {
        // Snap back to current face
        setIsRotating(true);
        setCubeAngle(0);
        setTimeout(() => {
          setIsRotating(false);
          setPaused(false);
        }, 250);
      }
      return;
    }

    // Tap to the end sides (quick tap without drag)
    if (elapsed < 300) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const relX = (e.clientX - rect.left) / rect.width;

      if (relX < 0.32) {
        // Tapped left side: go to previous story or previous account (instant without 3D rotation)
        advanceToPrev(false);
      } else if (relX > 0.68) {
        // Tapped right side: go to next story or next account (instant without 3D rotation)
        advanceToNext(false);
      } else {
        // Center tap: toggle play / pause
        setPaused((p) => {
          const next = !p;
          setShowCenterIcon(true);
          setTimeout(() => setShowCenterIcon(false), 700);
          return next;
        });
      }
    }
  };

  // --- Interactive Reactions with Floating Bursts ---
  const triggerReaction = (type: LinkedInReactionType, emoji: string) => {
    if (!currentStory) return;
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setUserReactions((prev) => ({ ...prev, [currentStory.id]: type }));
    onReact('story', currentStory.id, type);
    setShowReactionPicker(false);

    // Spawn 5 burst particles
    const burstCount = 6;
    const newItems: FloatingReaction[] = [];
    for (let i = 0; i < burstCount; i++) {
      newItems.push({
        id: `react-${Date.now()}-${i}-${Math.random()}`,
        emoji,
        x: Math.floor(25 + Math.random() * 50),
      });
    }
    setFloatingReactions((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => !newItems.some((n) => n.id === item.id)));
    }, 1800);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const val = commentText.trim();
    if (!val || !currentStory) return;
    const targetId = currentStory.articleId || currentStory.id;
    onComment(targetId, val);
    setCommentText('');
  };

  if (!open || !currentGroup || !currentStory) return null;

  const isFollowing = followingIds.includes(currentGroup.authorId);
  const isSaved = savedStoryIds.includes(currentStory.id);
  const activeReaction = userReactions[currentStory.id];
  const itemComments = comments.filter(
    (c) =>
      c.targetId === currentStory.id ||
      c.targetId === `story-${currentStory.id}` ||
      (currentStory.articleId && (c.targetId === currentStory.articleId || c.targetId === `art-${currentStory.articleId}`)),
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Story Viewer"
    >
      {/* Background ambient blur */}
      <img
        src={currentStory.imageUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-20 blur-3xl pointer-events-none scale-110"
      />

      {/* Floating Reaction Bursts Layer */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((f) => (
          <span
            key={f.id}
            style={{ left: `${f.x}%` }}
            className="absolute bottom-24 text-3xl select-none animate-in fade-in slide-out-to-top duration-1000 [animation:storyBurst_1.6s_ease-out_forwards]"
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* 3D Perspective Scene Container */}
      <div
        className="relative flex h-full w-full items-center justify-center max-w-[500px] px-2 sm:px-4"
        style={{ perspective: '1200px' }}
      >
        {/* The 3D Rotating Cube Box */}
        <div
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${cubeAngle}deg)`,
            transition: isDragging.current ? 'none' : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative h-full w-full max-w-[420px] max-h-[94vh] rounded-3xl overflow-hidden bg-black shadow-2xl cursor-pointer"
        >
          {/* Media Player: YouTube Shorts OR native video OR image */}
          <div className="absolute inset-0 size-full overflow-hidden pointer-events-none">
            {ytInfo ? (
              <div className="absolute inset-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  key={currentStory.id}
                  src={buildYouTubeEmbedSrc(ytInfo.videoId, {
                    autoplay: true,
                    muted: isMuted,
                    loop: true,
                  })}
                  title={currentStory.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  className="absolute left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none select-none"
                />
              </div>
            ) : currentStory.videoUrl || currentStory.imageUrl?.endsWith('.mp4') ? (
              <video
                ref={videoRef}
                key={currentStory.id}
                src={currentStory.videoUrl || currentStory.imageUrl}
                poster={currentStory.imageUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.imageUrl}
                alt={currentStory.title}
                className={cn(
                  'absolute inset-0 size-full object-cover transition-transform duration-700 ease-out',
                  !paused && 'scale-[1.02]',
                )}
              />
            )}
          </div>

          {/* Gradients for UI clarity */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/75 via-transparent to-black/85" />

          {/* Center Play/Pause indicator */}
          {showCenterIcon && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-4 text-white backdrop-blur-sm animate-in zoom-in-75 fade-in duration-200">
              {paused ? <Pause className="size-8 fill-white" /> : <Play className="size-8 fill-white ml-0.5" />}
            </div>
          )}

          {/* --- TOP HEADER (Segmented Progress Bars at the VERY TOP + Author Info + Sound & Close Buttons) --- */}
          <div
            className={cn(
              'absolute inset-x-0 top-0 z-30 flex flex-col gap-2 p-3 sm:p-3.5 transition-opacity duration-200 bg-gradient-to-b from-black/80 via-black/40 to-transparent',
              isHolding ? 'opacity-0' : 'opacity-100',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. TOPMOST: Segmented Progress Bars (Zero overlap, strictly topmost position) */}
            <div className="flex items-center gap-1.5 w-full">
              {currentGroup.stories.map((st, i) => {
                let fill = '0%';
                if (i < storyIdx) fill = '100%';
                else if (i === storyIdx) fill = `${progress * 100}%`;

                return (
                  <div
                    key={st.id}
                    className="relative h-1 flex-1 rounded-full bg-white/30 overflow-hidden backdrop-blur-xs"
                  >
                    <div
                      className="h-full bg-[#03EF62] rounded-full transition-all duration-75"
                      style={{ width: fill }}
                    />
                  </div>
                );
              })}
            </div>

            {/* 2. DIRECTLY BELOW: Header Row with Author on Left, Sound + Close on Right */}
            <div className="flex items-center justify-between gap-2 text-white pt-0.5">
              {/* Left: Author Profile + Follow Icon Button */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateProfile) onNavigateProfile(currentGroup.authorId);
                  }}
                  className="relative group shrink-0"
                >
                  <Avatar
                    src={currentGroup.authorAvatar}
                    name={currentGroup.authorName}
                    size="size-9"
                    ring
                    className="ring-[#03EF62]"
                  />
                </button>

                <div className="flex flex-col min-w-0 leading-tight">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                      <span className="font-bangla font-bold text-sm truncate text-white drop-shadow">
                        {currentGroup.authorName}
                      </span>
                      {/* Follow Icon Button (Icon Only, No Text) */}
                      {currentGroup.authorId !== currentUser?.id && (
                        <FollowIconButton
                          isFollowing={isFollowing}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentUser) {
                              onOpenAuth();
                              return;
                            }
                            onToggleFollow(currentGroup.authorId);
                          }}
                          className="size-6 shrink-0"
                        />
                      )}
                    </div>
                    {/* Smaller tags / designations in a single line (beside name or wraps to next line) */}
                    <div className="flex items-center gap-1 text-[10.5px] font-bangla text-white/75 drop-shadow truncate shrink-0">
                      <span className="truncate max-w-[110px] text-emerald-300 font-medium">
                        {currentStory.category || 'প্রতিবেদন'}
                      </span>
                      <span>·</span>
                      <span className="truncate text-white/60">
                        {currentGroup.authorHandle ? `@${currentGroup.authorHandle}` : 'লেখক ও গবেষক'}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold shrink-0">
                        <Num>{toBengaliNumerals(storyIdx + 1)}/{toBengaliNumerals(totalAccountStories)}</Num>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Sound On/Off Button & Close (X) Button STRICTLY SIDE-BY-SIDE */}
              <div className="flex items-center gap-1.5 shrink-0">
                {ytInfo && <YouTubeMark size="sm" className="rounded-md bg-black/45 px-1.5 py-0.5 mr-0.5" />}
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  className="flex size-7.5 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition active:scale-90"
                  aria-label={isMuted ? 'শব্দ শুনুন' : 'শব্দ বন্ধ করুন'}
                  title={isMuted ? 'শব্দ শুনুন' : 'শব্দ বন্ধ করুন'}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4 text-[#03EF62]" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-7.5 items-center justify-center rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition active:scale-90"
                  aria-label="বন্ধ করুন"
                  title="বন্ধ করুন"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Title / Caption overlay with Facebook-style Lift & Expand */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-[80px] z-25 px-3.5 transition-all duration-300 pointer-events-auto',
              isHolding ? 'opacity-0' : 'opacity-100',
              isCaptionExpanded ? '-translate-y-4' : 'translate-y-0',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'transition-all duration-200',
                isCaptionExpanded
                  ? 'bg-black/85 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar'
                  : 'bg-gradient-to-t from-black/60 to-transparent p-1.5 rounded-xl',
              )}
            >
              <p
                className={cn(
                  'font-bangla leading-snug transition-colors',
                  isCaptionExpanded
                    ? 'text-white text-sm font-medium'
                    : 'text-white/70 text-xs sm:text-[13px] line-clamp-2 font-normal drop-shadow',
                )}
              >
                {currentStory.title}
              </p>

              {/* Expand / Collapse Button */}
              {currentStory.title && currentStory.title.length > 20 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCaptionExpanded((prev) => !prev);
                    setPaused(!isCaptionExpanded);
                  }}
                  className="mt-1 font-bangla text-xs font-bold text-[#03EF62] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  {isCaptionExpanded ? 'সংক্ষেপ করুন' : '... আরও দেখুন'}
                </button>
              )}
            </div>
          </div>

          {/* --- BOTTOM INTERACTIVE ACTIONS (Quick Reply, React, Comment, Share, Save) --- */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-30 p-3 flex flex-col gap-2 transition-opacity duration-200 bg-gradient-to-t from-black via-black/80 to-transparent',
              isHolding ? 'opacity-0' : 'opacity-100',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating LinkedIn / Facebook Reaction Picker (Pops down when unpressed) */}
            {showReactionPicker && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowReactionPicker(false)}
                />
                <div className="relative z-30 flex items-center gap-2 bg-[#061621]/95 border border-white/20 p-2 rounded-full shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150 self-start">
                  {LINKEDIN_REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      type="button"
                      onClick={() => triggerReaction(r.type as LinkedInReactionType, r.emoji)}
                      title={r.labelBn}
                      className="p-1 hover:scale-125 transition-transform active:scale-95 flex items-center justify-center rounded-full"
                    >
                      <LinkedInReactionBadge type={r.type as LinkedInReactionType} size="size-7" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Quick Reply Form + Action Buttons */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSendComment} className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="একটি বার্তা বা উত্তর লিখুন..."
                  className="w-full rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 font-bangla text-xs text-white placeholder-white/60 backdrop-blur-md focus:border-[#03EF62] focus:bg-black/50 focus:outline-none transition"
                />
                {commentText.trim() && (
                  <button
                    type="submit"
                    className="absolute right-1.5 flex size-6 items-center justify-center rounded-full bg-[#03EF62] text-[#061621] transition active:scale-95 shadow-sm"
                  >
                    <Send className="size-3" />
                  </button>
                )}
              </form>

              {/* React Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setShowReactionPicker((prev) => !prev);
                }}
                className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition active:scale-90 relative"
                title="প্রতিক্রিয়া জানান"
              >
                {activeReaction ? (
                  <LinkedInReactionBadge type={activeReaction} size="size-5" />
                ) : (
                  <Heart className="size-5 hover:text-[#ff3b5c] transition-colors" />
                )}
              </button>

              {/* Comments drawer button (Pops down when unpressed) */}
              <button
                type="button"
                onClick={() => {
                  setShowComments((prev) => {
                    const next = !prev;
                    setPaused(next);
                    return next;
                  });
                }}
                className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition active:scale-90 relative"
                title="মন্তব্য দেখুন"
              >
                <MessageCircle className="size-5" />
                {itemComments.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#03EF62] px-1 font-bangla text-[9px] font-bold text-[#061621]">
                    <Num>{toBengaliNumerals(itemComments.length)}</Num>
                  </span>
                )}
              </button>

              {/* Share Story */}
              <button
                type="button"
                onClick={() => onShare(currentStory.title)}
                className="flex size-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition active:scale-90"
                title="লিংক শেয়ার করুন"
              >
                <Share2 className="size-4.5" />
              </button>

              {/* Save Story */}
              <button
                type="button"
                onClick={() => onSave(currentStory.id)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full transition active:scale-90',
                  isSaved ? 'bg-[#03EF62] text-[#061621]' : 'bg-white/15 text-white hover:bg-white/25',
                )}
                title="স্টোরি সংরক্ষণ করুন"
              >
                <Bookmark className={cn('size-4.5', isSaved && 'fill-current')} />
              </button>
            </div>

            {/* Quick emoji reaction bar */}
            <div className="flex items-center justify-around px-1 pt-0.5">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => triggerReaction('like', emoji)}
                  className="text-lg hover:scale-130 transition-transform active:scale-90 p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Comments Slide-Up / Drawer (Pops down when unpressed) --- */}
      {showComments && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              setShowComments(false);
              setPaused(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[380px] z-50 flex flex-col bg-[#07161f] text-white border-t sm:border-t-0 sm:border-l border-white/15 shadow-2xl rounded-t-3xl sm:rounded-none max-h-[82vh] sm:max-h-full animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
          >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 bg-[#0a1f2b]/80">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-[#03EF62]" />
              <h3 className="font-bangla text-sm font-bold text-white">
                মন্তব্যসমূহ (<Num>{toBengaliNumerals(itemComments.length)}</Num>)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowComments(false);
                setPaused(false);
              }}
              className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {itemComments.length === 0 ? (
              <div className="py-16 text-center text-white/50 font-bangla text-xs">
                এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!
              </div>
            ) : (
              itemComments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar src={c.avatar} name={c.author} size="size-7" />
                  <div className="flex-1 min-w-0 bg-white/5 rounded-2xl p-2.5 border border-white/5">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bangla text-xs font-bold text-white truncate">{c.author}</span>
                      <span className="font-bangla text-[10.5px] text-emerald-400">
                        {c.timestampLabel || 'এখন'}
                      </span>
                    </div>
                    <p className="mt-1 font-bangla text-xs text-white/85 leading-relaxed break-words">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendComment} className="p-3 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="মন্তব্য লিখুন..."
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-bangla text-xs text-white placeholder-white/50 focus:border-[#03EF62] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="flex size-8 items-center justify-center rounded-xl bg-[#03EF62] text-[#061621] disabled:opacity-40 transition"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      </>
      )}

      {/* Floating 3D CSS Keyframe in head */}
      <style>{`
        @keyframes storyBurst {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-140px) scale(1.3) rotate(-15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-280px) scale(1.6) rotate(20deg);
          }
        }
      `}</style>
    </div>
  );
}

