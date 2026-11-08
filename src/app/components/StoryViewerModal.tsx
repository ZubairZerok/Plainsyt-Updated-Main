import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { X, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Avatar, FollowIconButton, Num, cn } from './Primitives';
import type { TopicStory, UserProfile } from '../types';
import { toBengaliNumerals } from '../utils/pureLogic';
import { YouTubeMark, buildYouTubeEmbedSrc, getYouTubeEmbedInfo, ytPostCommand } from './YouTubeMark';

export { getYouTubeEmbedInfo };

export interface AccountStoryGroup {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorHandle?: string;
  stories: TopicStory[];
}



interface Props {
  open: boolean;
  stories: TopicStory[];
  initialStoryId?: string | null;
  currentUser: UserProfile | null;
  followingIds: string[];
  onClose: () => void;
  onToggleFollow: (authorId: string) => void;
  onOpenAuth: () => void;
  onNavigateProfile?: (userId: string) => void;
}

export function StoryViewerModal({
  open,
  stories,
  initialStoryId,
  currentUser,
  followingIds,
  onClose,
  onToggleFollow,
  onOpenAuth,
  onNavigateProfile,
}: Props) {
  // Lock page scroll while the viewer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 1. Group stories by author account
  const accountGroups: AccountStoryGroup[] = useMemo(() => {
    if (!stories || stories.length === 0) return [];
    const groups: AccountStoryGroup[] = [];
    for (const story of stories) {
      const authorId = story.authorId || 'unknown';
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
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragging = useRef(false);

  // Position at initialStoryId or authorId on open
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
        if (accountGroups[a].authorId === initialStoryId) {
          setAccountIdx(a);
          setStoryIdx(0);
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
    if (!open || paused || isHolding || isCaptionExpanded || isRotating || !currentStory) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      return;
    }

    const intervalMs = 50;
    const step = intervalMs / (storyDurationSec * 1000);

    progressTimer.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          setTimeout(() => advanceToNext(false), 0);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [open, paused, isHolding, isCaptionExpanded, isRotating, currentStory, storyDurationSec, advanceToNext]);

  // YouTube / Video Playback Sync
  useEffect(() => {
    if (!open) return;
    if (paused || isHolding) {
      ytPostCommand(iframeRef.current, 'pauseVideo');
      videoRef.current?.pause();
    } else {
      ytPostCommand(iframeRef.current, 'playVideo');
      void videoRef.current?.play().catch(() => undefined);
    }
  }, [open, paused, isHolding, storyIdx, accountIdx]);

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
        onClose();
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
  }, [open, onClose, advanceToNext, advanceToPrev]);

  // --- Touch & Pointer Gestures for 3D Cube Rotation and Tap Zones ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
    if (!pointerStart.current || isRotating) return;
    const deltaX = e.clientX - pointerStart.current.x;

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

  if (!open || !currentGroup || !currentStory) return null;

  const isFollowing = followingIds.includes(currentGroup.authorId);

  return (
    <div
      onClick={(e) => {
        if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/95 backdrop-blur-md select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Story Viewer"
    >
      {/* Click outside to close backdrop button (behaves like Esc key) */}
      <button
        type="button"
        aria-label="Close story viewer"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default -z-10 focus:outline-none bg-transparent"
      />

      {/* Background ambient blur */}
      <img
        src={currentStory.imageUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-20 blur-3xl pointer-events-none scale-110"
      />

      {/* 3D Perspective Scene Container */}
      <div
        onClick={(e) => {
          if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
            onClose();
          }
        }}
        className="relative flex h-full w-full items-center justify-center max-w-[500px] px-2 sm:px-4"
        style={{ perspective: '1200px' }}
      >
        {/* The 3D Rotating Cube Box */}
        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateProfile) {
                      onClose();
                      onNavigateProfile(currentGroup.authorId);
                    }
                  }}
                  title={`${currentGroup.authorName} এর প্রোফাইল দেখুন`}
                  className="relative group shrink-0 cursor-pointer"
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
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                    <div className="inline-flex items-center gap-1.5 min-w-0 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateProfile) {
                            onClose();
                            onNavigateProfile(currentGroup.authorId);
                          }
                        }}
                        title={`${currentGroup.authorName} এর প্রোফাইল দেখুন`}
                        className="font-bangla font-bold text-sm truncate text-white drop-shadow hover:underline hover:text-[#03EF62] transition text-left cursor-pointer"
                      >
                        {currentGroup.authorName}
                      </button>
                      {/* Follow Icon Button (Lime background & White checkmark when following) */}
                      {currentGroup.authorId !== currentUser?.id && (
                        <FollowIconButton
                          isFollowing={isFollowing}
                          limeTick
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
                    <div className="inline-flex items-center gap-1 text-[11px] sm:text-[11px] font-bangla text-white/80 drop-shadow whitespace-nowrap overflow-hidden text-ellipsis max-w-full shrink-0">
                      <span className="truncate max-w-[100px] text-emerald-300 font-medium">
                        {currentStory.category || 'প্রতিবেদন'}
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[90px] text-white/60">
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
        </div>
      </div>
    </div>
  );
}

