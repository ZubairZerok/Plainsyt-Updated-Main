import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Bookmark, Share2, Clapperboard, MapPin, Volume2, VolumeX } from 'lucide-react';
import type { LinkedInReactionType, StoryReel } from '../types';
import { Avatar, FEED_CARD, VerifiedBadge, cn } from './Primitives';
import { LinkedInReactionBadge, LinkedInReactionPickerButton } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, totalReactions } from '../utils/pureLogic';
import { getYouTubeEmbedInfo } from './ReelPlayerModal';

interface Props {
  reel: StoryReel;
  saved: boolean;
  following: boolean;
  isOwnCreator?: boolean;
  onPlay: () => void;
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
  onPlay,
  onReact,
  onSave,
  onShare,
  onFollow,
  onNavigateProfile,
}: Props) {
  const photo = reel.mediaUrl;
  const rxTotal = totalReactions(reel.reactionCounts, reel.likes);
  const ytInfo = reel.videoUrl ? getYouTubeEmbedInfo(reel.videoUrl) : null;

  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const cardRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autoplay when > 50% of the reel card is visible in the news feed; pause when < 50%
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
            setShowDetails(true);
          }
        }
      },
      { threshold: [0, 0.5, 1.0] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-hide top header and bottom title/details after 3 seconds of watching
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPlaying) {
      setShowDetails(true);
      timerRef.current = setTimeout(() => {
        setShowDetails(false);
      }, 3000);
    } else {
      setShowDetails(true);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying]);

  const handleToggleDetails = () => {
    setShowDetails((prev) => {
      const next = !prev;
      if (next && isPlaying) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShowDetails(false);
        }, 3000);
      }
      return next;
    });
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => !m);
    // Bring details back briefly when user interacts
    setShowDetails(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowDetails(false);
    }, 3000);
  };

  return (
    <article ref={cardRef} className={cn(FEED_CARD, 'overflow-hidden')}>
      {/* Top Header: Creator details & YouTube shorts tag (Disappears smoothly after 3s of watching) */}
      <header
        className={cn(
          'relative z-20 flex items-center gap-3 px-3.5 py-3 sm:px-4 bg-white dark:bg-[#071f2d] border-b border-slate-200/90 dark:border-white/10 shadow-xs transition-all duration-500 ease-in-out',
          !showDetails && isPlaying ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0',
        )}
      >
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
                    following ? 'text-slate-400 dark:text-slate-500' : 'text-emerald-600 dark:text-[#00ED64] hover:text-emerald-700 dark:hover:text-[#33ff88] hover:underline',
                  )}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </p>
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mt-1">
            {reel.videoUrl?.includes('youtu') ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-[#e60023] dark:text-[#ff3b4e]">
                <svg className="size-3.5 fill-[#e60023] dark:fill-[#ff3b4e] shrink-0" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>YouTube Shorts</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                <Clapperboard className="size-3.5 text-emerald-600 dark:text-[#00ED64]" />
                Reel
              </span>
            )}
            <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
            <span className="font-mono text-[11.5px] font-bold text-slate-800 dark:text-slate-200">{reel.duration}</span>
            {reel.location && (
              <>
                <span className="text-slate-400 dark:text-slate-500 font-bold">·</span>
                <span className="truncate text-slate-700 dark:text-slate-300 font-bangla font-medium">{reel.location}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* Main Video Viewport */}
      <div className="relative bg-[#021a11]" onClick={handleToggleDetails}>
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
          />
        )}
        <div className="relative mx-auto aspect-[9/16] max-h-[600px] w-full max-w-[330px] overflow-hidden bg-black">
          {isPlaying && ytInfo ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytInfo.videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytInfo.videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`}
              title={reel.title}
              className="size-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isPlaying && (reel.videoUrl || reel.mediaUrl?.endsWith('.mp4')) ? (
            <video
              src={reel.videoUrl || reel.mediaUrl}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <div className="relative size-full">
              {photo ? (
                <img src={photo} alt={reel.title} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-gradient-to-br from-pine-900 via-pine-700 to-pine-500" />
              )}
              <span className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/85" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/40 text-white backdrop-blur-sm transition hover:scale-110"
                aria-label="Play video"
              >
                <Play className="ml-1 size-7 fill-white" />
              </button>
            </div>
          )}

          {/* Top Overlays: Duration badge & Shorts / Sound button */}
          <div
            className={cn(
              'absolute inset-x-3 top-3 z-30 flex items-center justify-between transition-all duration-500 ease-in-out',
              !showDetails && isPlaying ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0',
            )}
          >
            <span className="rounded-md bg-black/80 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-md backdrop-blur-xs border border-white/20">
              {reel.duration}
            </span>
            <div className="flex items-center gap-1.5">
              {isPlaying && (
                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={isMuted ? 'শব্দ শুনুন (Unmute)' : 'শব্দ বন্ধ করুন (Mute)'}
                  title={isMuted ? 'Unmute' : 'Mute'}
                  className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-sm hover:bg-black/80 transition"
                >
                  {isMuted ? <VolumeX className="size-3.5 text-white" /> : <Volume2 className="size-3.5 text-[#00ED64]" />}
                </button>
              )}
              {reel.videoUrl?.includes('youtu') ? (
                <a
                  href={reel.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#ff0033] hover:bg-red-700 px-3 py-1 text-[11.5px] font-bold text-white shadow-lg transition active:scale-95 ring-1 ring-white/30"
                  title="YouTube-এ দেখুন"
                >
                  <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>Shorts</span>
                </a>
              ) : null}
            </div>
          </div>

          {/* Bottom Title & Description: Disappears after 3s of watching */}
          <div
            className={cn(
              'absolute bottom-4 left-3.5 right-16 z-30 text-left transition-all duration-500 ease-in-out',
              !showDetails && isPlaying ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0',
            )}
          >
            <span className="block font-bangla text-[17px] sm:text-[18px] font-bold leading-snug text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {reel.title}
            </span>
            {reel.location && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[11px] font-bold text-white/90 backdrop-blur-xs">
                <MapPin className="size-3 text-[#00ED64]" /> {reel.location}
              </span>
            )}
          </div>

          {/* Right Action Icons (Reactions, Save, Share) */}
          <div className="absolute bottom-4 right-2 z-30 flex flex-col items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onReact(reel.userReaction ?? 'like')}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition hover:bg-black/65">
                <LinkedInReactionBadge type={reel.userReaction ?? 'like'} size="size-6" />
              </span>
              <span className="font-mono text-[10.5px] font-medium">
                {formatBengaliNumberCompact(rxTotal)}
              </span>
            </button>

            <button
              type="button"
              onClick={onSave}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55">
                <Bookmark className={cn('size-[22px]', saved && 'fill-current text-[#bbf0d8]')} />
              </span>
              <span className="font-mono text-[10.5px] font-medium">{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={onShare}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55">
                <Share2 className="size-[22px]" />
              </span>
              <span className="font-mono text-[10.5px] font-medium">Share</span>
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
            <div className={cn('h-full bg-[#00ED64] transition-all duration-300', isPlaying ? 'w-full' : 'w-1/3')} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-white/10 px-3 py-2 sm:px-4">
        <LinkedInReactionPickerButton
          userReaction={reel.userReaction}
          onSelect={onReact}
          countLabel={rxTotal > 0 ? formatBengaliNumberCompact(rxTotal) : undefined}
        />
        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-[#00ED64] transition"
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          <span>{isPlaying ? 'বিরতি দিন' : 'চালান'}</span>
        </button>
      </div>
    </article>
  );
}
