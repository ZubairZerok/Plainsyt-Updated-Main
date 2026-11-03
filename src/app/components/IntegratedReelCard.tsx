import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Bookmark,
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { LinkedInReactionType, StoryReel } from '../types';
import { Avatar, FEED_CARD, VerifiedBadge, cn } from './Primitives';
import { LinkedInReactionPickerButton } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, totalReactions } from '../utils/pureLogic';
import { getYouTubeEmbedInfo } from './ReelPlayerModal';
import {
  YouTubeMark,
  buildYouTubeEmbedSrc,
  ytPostCommand,
  parseDurationLabel,
} from './YouTubeMark';

interface Props {
  reel: StoryReel;
  saved: boolean;
  following: boolean;
  isOwnCreator?: boolean;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReact: (type: LinkedInReactionType) => void;
  onSave: () => void;
  onShare: () => void;
  onFollow: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto?: (src: string, title?: string, authorName?: string, authorId?: string) => void;
}

export function IntegratedReelCard({
  reel,
  saved,
  following,
  isOwnCreator,
  hasPrev,
  hasNext,
  onPlay,
  onPrev,
  onNext,
  onReact,
  onSave,
  onShare,
  onFollow,
  onNavigateProfile,
}: Props) {
  const photo = reel.mediaUrl;
  const rxTotal = totalReactions(reel.reactionCounts, reel.likes);
  const ytInfo = reel.videoUrl ? getYouTubeEmbedInfo(reel.videoUrl) : null;
  const durationSec = parseDurationLabel(reel.duration);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showChrome, setShowChrome] = useState(true);
  const [centerFlash, setCenterFlash] = useState<'play' | 'pause' | null>(null);

  const cardRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);
  const accumulated = useRef<number>(0);

  const bumpChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => setShowChrome(false), 2800);
  }, []);

  // Autoplay when ≥50% visible
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsPlaying(true);
            bumpChrome();
          } else {
            setIsPlaying(false);
            setShowChrome(true);
          }
        }
      },
      { threshold: [0, 0.5, 1.0] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [bumpChrome]);

  // Fake / synced timeline for YT (postMessage) and native video
  useEffect(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);

    if (!isPlaying) {
      accumulated.current += startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0;
      startedAt.current = 0;
      return;
    }

    startedAt.current = Date.now();
    progressTimer.current = setInterval(() => {
      const native = videoRef.current;
      if (native && !Number.isNaN(native.duration) && native.duration > 0) {
        setProgress(Math.min(1, native.currentTime / native.duration));
        return;
      }
      const elapsed = accumulated.current + (Date.now() - startedAt.current) / 1000;
      const p = (elapsed % durationSec) / durationSec;
      setProgress(p);
    }, 120);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [isPlaying, durationSec]);

  // Drive YT iframe play/pause/mute without ever showing YT chrome
  useEffect(() => {
    if (!ytInfo) return;
    ytPostCommand(iframeRef.current, isPlaying ? 'playVideo' : 'pauseVideo');
  }, [isPlaying, ytInfo]);

  useEffect(() => {
    if (!ytInfo) return;
    ytPostCommand(iframeRef.current, isMuted ? 'mute' : 'unMute');
  }, [isMuted, ytInfo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) void v.play().catch(() => undefined);
    else v.pause();
  }, [isPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  const flashCenter = (kind: 'play' | 'pause') => {
    setCenterFlash(kind);
    window.setTimeout(() => setCenterFlash(null), 650);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying((p) => {
      const next = !p;
      flashCenter(next ? 'play' : 'pause');
      return next;
    });
    bumpChrome();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => !m);
    bumpChrome();
  };

  const seekTo = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    setProgress(clamped);
    accumulated.current = clamped * durationSec;
    startedAt.current = isPlaying ? Date.now() : 0;
    const native = videoRef.current;
    if (native && native.duration) {
      native.currentTime = clamped * native.duration;
    }
    if (ytInfo) {
      ytPostCommand(iframeRef.current, 'seekTo', [clamped * durationSec, true]);
    }
  };

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
    bumpChrome();
  };

  const actionBtn =
    'flex flex-col items-center gap-0.5 text-white select-none active:scale-90 transition';
  const actionIcon =
    'flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/15 transition hover:bg-black/70';

  return (
    <article ref={cardRef} className={cn(FEED_CARD, 'overflow-hidden')}>
      {/* Header: account + follow only */}
      <header className="relative z-20 flex items-center gap-3 px-3.5 py-3 sm:px-4 bg-white dark:bg-[#071f2d] border-b border-slate-200/90 dark:border-white/10">
        <button type="button" onClick={() => onNavigateProfile(reel.creatorId)} className="shrink-0">
          <Avatar src={reel.creatorAvatar} name={reel.creator} size="size-10" ring online />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
            <button
              type="button"
              onClick={() => onNavigateProfile(reel.creatorId)}
              className="truncate hover:underline tracking-tight"
            >
              {reel.creator}
            </button>
            <VerifiedBadge />
            {!isOwnCreator && (
              <>
                <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
                <button
                  type="button"
                  onClick={onFollow}
                  className={cn(
                    'text-[13px] font-bold transition-colors',
                    following
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-emerald-600 dark:text-[#03EF62] hover:underline',
                  )}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Main Video Viewport */}
      <div className="relative bg-[#021a11]" onClick={togglePlay}>
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
          />
        )}
        <div className="relative mx-auto aspect-[9/16] max-h-[600px] w-full max-w-[330px] overflow-hidden bg-black">
          {ytInfo ? (
            <iframe
              ref={iframeRef}
              key={ytInfo.videoId}
              src={buildYouTubeEmbedSrc(ytInfo.videoId, {
                autoplay: true,
                muted: isMuted,
                loop: true,
              })}
              title={reel.title}
              className="size-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : isPlaying || reel.videoUrl || reel.mediaUrl?.endsWith('.mp4') ? (
            <video
              ref={videoRef}
              src={reel.videoUrl || reel.mediaUrl}
              poster={photo}
              autoPlay={isPlaying}
              muted={isMuted}
              loop
              playsInline
              className="size-full object-cover pointer-events-none"
            />
          ) : (
            <div className="relative size-full">
              {photo ? (
                <img src={photo} alt={reel.title} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-gradient-to-br from-pine-900 via-pine-700 to-pine-500" />
              )}
            </div>
          )}

          {/* Gradient for readability */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />

          {/* Center play/pause flash */}
          {centerFlash && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/55 p-4 text-white backdrop-blur-sm animate-in zoom-in-75 fade-in duration-150">
              {centerFlash === 'pause' ? (
                <Pause className="size-7 fill-white" />
              ) : (
                <Play className="ml-0.5 size-7 fill-white" />
              )}
            </div>
          )}

          {!isPlaying && !centerFlash && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 z-30 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/45 text-white backdrop-blur-sm"
              aria-label="Play"
            >
              <Play className="ml-0.5 size-6 fill-white" />
            </button>
          )}

          {/* YouTube logo + Shorts (not a red pill) */}
          {ytInfo && (
            <div
              className={cn(
                'absolute left-3 top-3 z-30 transition-opacity duration-300',
                showChrome || !isPlaying ? 'opacity-100' : 'opacity-0',
              )}
            >
              <YouTubeMark className="rounded-md bg-black/45 px-2 py-1 backdrop-blur-sm" />
            </div>
          )}

          {/* Prev / Next reel nav */}
          <div
            className={cn(
              'absolute right-2 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 transition-opacity duration-300',
              showChrome || !isPlaying ? 'opacity-100' : 'opacity-0',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => onPrev?.()}
              aria-label="Previous reel"
              className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white border border-white/20 disabled:opacity-25"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext}
              onClick={() => onNext?.()}
              aria-label="Next reel"
              className="flex size-8 items-center justify-center rounded-full bg-black/55 text-white border border-white/20 disabled:opacity-25"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>

          {/* Right action stack: Like → Comment → Share → Save → Mute */}
          <div
            className="absolute bottom-10 right-1.5 z-30 flex flex-col items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={actionBtn}>
              <LinkedInReactionPickerButton
                userReaction={reel.userReaction}
                onSelect={onReact}
                iconOnly
                floating
                className={actionIcon}
              />
              <span className="font-bangla font-bold text-[11px] drop-shadow">{formatBengaliNumberCompact(rxTotal)}</span>
            </div>

            <button type="button" onClick={onPlay} className={actionBtn} aria-label="Comment">
              <span className={actionIcon}>
                <MessageCircle className="size-[18px]" />
              </span>
              <span className="font-bangla text-[10.5px] font-medium drop-shadow">Comment</span>
            </button>

            <button type="button" onClick={onShare} className={actionBtn} aria-label="Share">
              <span className={actionIcon}>
                <Share2 className="size-[18px]" />
              </span>
              <span className="font-bangla text-[10.5px] font-medium drop-shadow">Share</span>
            </button>

            <button type="button" onClick={onSave} className={actionBtn} aria-label="Save">
              <span className={actionIcon}>
                <Bookmark className={cn('size-[18px]', saved && 'fill-current text-[#03EF62]')} />
              </span>
              <span className="font-bangla text-[10.5px] font-medium drop-shadow">{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className={actionBtn}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className={actionIcon}>
                {isMuted ? (
                  <VolumeX className="size-[17px]" />
                ) : (
                  <Volume2 className="size-[17px] text-[#03EF62]" />
                )}
              </span>
            </button>
          </div>

          {/* Custom timeline + pause chip */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-30 px-2.5 pb-2 pt-6 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300',
              showChrome || !isPlaying ? 'opacity-100' : 'opacity-70',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="size-3.5 fill-white" /> : <Play className="ml-0.5 size-3.5 fill-white" />}
              </button>
              <div
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                tabIndex={0}
                onClick={onScrub}
                className="group relative h-5 flex-1 cursor-pointer"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
                  <span
                    className="block h-full rounded-full bg-[#03EF62] transition-[width] duration-100"
                    style={{ width: `${progress * 100}%` }}
                  />
                </span>
                <span
                  className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow opacity-0 transition group-hover:opacity-100"
                  style={{ left: `calc(${progress * 100}% - 5px)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom reaction row only — no বিরতি দিন */}
      <div className="flex items-center border-t border-slate-200/80 dark:border-white/10 px-3 py-2 sm:px-4">
        <LinkedInReactionPickerButton
          userReaction={reel.userReaction}
          onSelect={onReact}
          countLabel={rxTotal > 0 ? formatBengaliNumberCompact(rxTotal) : undefined}
        />
      </div>
    </article>
  );
}
