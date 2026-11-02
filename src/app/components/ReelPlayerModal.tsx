import { useEffect, useState, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Pause,
  Play,
  ChevronUp,
  ChevronDown,
  Send,
  LogIn,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Avatar, cn } from './Primitives';
import type { CommentItem, UserProfile } from '../types';
import { toBengaliNumerals } from '../utils/pureLogic';

export interface PlayerItem {
  id: string;
  title: string;
  creator: string;
  avatar: string;
  image: string;
  meta: string;
  likes?: number;
  videoUrl?: string;
}

export function getYouTubeEmbedInfo(url?: string): { embedUrl: string; directUrl: string; videoId: string } | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    const videoId = match[1];
    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`,
      directUrl: `https://www.youtube.com/shorts/${videoId}`,
    };
  }
  return null;
}

interface Props {
  items: PlayerItem[] | null;
  start: number;
  currentUser?: UserProfile | null;
  comments?: CommentItem[];
  onClose: () => void;
  onShare: (t: string) => void;
  onOpenAuth?: () => void;
  onComment?: (targetId: string, text: string) => void;
  onReactStory?: (targetId: string) => void;
  onBookmarkStory?: (targetId: string) => void;
}

export function ReelPlayerModal({
  items,
  start,
  currentUser,
  comments = [],
  onClose,
  onShare,
  onOpenAuth,
  onComment,
  onReactStory,
  onBookmarkStory,
}: Props) {
  const [idx, setIdx] = useState(start);
  const [paused, setPaused] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState<boolean>(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIdx(start);
    setPaused(false);
    setShowComments(false);
  }, [start, items]);

  const count = items?.length ?? 0;
  const next = () => (idx < count - 1 ? setIdx(idx + 1) : onClose());
  const prev = () => setIdx(Math.max(0, idx - 1));

  // Keyboard navigation
  useEffect(() => {
    if (!items) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showComments) {
          setShowComments(false);
        } else {
          onClose();
        }
      }
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, idx, showComments]);

  if (!items || items.length === 0 || !items[idx]) return null;
  const it = items[idx];
  const ytInfo = getYouTubeEmbedInfo(it.videoUrl);
  const isLiked = liked[it.id];
  const isSaved = saved[it.id];

  // Filter comments for current item
  const itemComments = comments.filter(
    (c) => c.targetId === it.id || c.targetId === `reel-${it.id}` || c.targetId === `story-${it.id}`,
  );

  const togglePlayPause = () => {
    setPaused((p) => {
      const nextP = !p;
      setShowCenterIcon(true);
      setTimeout(() => setShowCenterIcon(false), 700);
      return nextP;
    });
  };

  const handleToggleComments = () => {
    setShowComments((open) => {
      const nextOpen = !open;
      if (nextOpen) setPaused(true);
      return nextOpen;
    });
  };

  const handleLikeStory = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setLiked((l) => ({ ...l, [it.id]: !l[it.id] }));
    onReactStory?.(it.id);
  };

  const handleSaveStory = () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setSaved((s) => ({ ...s, [it.id]: !s[it.id] }));
    onBookmarkStory?.(it.id);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    const val = commentText.trim();
    if (!val) return;
    onComment?.(it.id, val);
    setCommentText('');
  };

  const handleLikeComment = (cid: string) => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setCommentLikes((prev) => ({
      ...prev,
      [cid]: (prev[cid] ?? 0) + 1,
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050a07]/95 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={it.title}
    >
      {/* Blurred background ambience */}
      <img
        src={it.image}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-25 blur-3xl pointer-events-none"
      />

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition active:scale-95"
      >
        <X className="size-5" />
      </button>

      {/* Main player container (expands side-by-side with comments drawer on desktop) */}
      <div className="relative flex h-full w-full items-center justify-center sm:h-[92vh] max-w-[940px] px-2 sm:px-4">
        {/* Story Video / Visual Card */}
        <div
          onClick={ytInfo ? undefined : togglePlayPause}
          className="relative h-full w-full max-w-[430px] shrink-0 overflow-hidden bg-black shadow-2xl cursor-pointer select-none sm:rounded-2xl sm:border sm:border-white/15"
        >
          {ytInfo ? (
            <div className="absolute inset-0 size-full bg-black">
              <iframe
                key={it.id}
                src={ytInfo.embedUrl}
                title={it.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="size-full border-0 object-cover"
              />
            </div>
          ) : (
            <img
              key={it.id}
              src={it.image}
              alt={it.title}
              className={cn(
                'absolute inset-0 size-full object-cover [animation:kenburns_6s_ease-out_forwards]',
                paused && '[animation-play-state:paused]',
              )}
            />
          )}
          <div
            className={cn(
              'absolute inset-0 pointer-events-none',
              ytInfo
                ? 'bg-gradient-to-b from-black/75 via-transparent to-black/85'
                : 'bg-gradient-to-b from-black/60 via-transparent to-black/90',
            )}
          />

          {/* Progress Bars (hidden for YouTube Shorts since YouTube provides native scrubber) */}
          {!ytInfo && (
            <div className="absolute inset-x-3 top-3 z-10 flex gap-1 pointer-events-none">
              {items.map((x, i) => (
                <span key={x.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                  {i < idx && <span className="block h-full w-full bg-white" />}
                  {i === idx && (
                    <span
                      key={`${x.id}-${idx}`}
                      onAnimationEnd={next}
                      className={cn(
                        'block h-full w-full origin-left bg-white [animation:reel-progress_6s_linear_forwards]',
                        paused && '[animation-play-state:paused]',
                      )}
                    />
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Top Header: Creator info */}
          <div className="absolute inset-x-3 top-6 z-10 flex items-center gap-2.5 text-white">
            <Avatar src={it.avatar} name={it.creator} size="size-9" ring />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bangla text-[14px] font-bold">{it.creator}</p>
              <p className="truncate font-mono text-[10.5px] text-white/70">{it.meta}</p>
            </div>
            {ytInfo ? (
              <a
                href={ytInfo.directUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 hover:bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition active:scale-95"
                title="YouTube-এ দেখুন"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Shorts</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                aria-label={paused ? 'Play' : 'Pause'}
                className="flex size-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition active:scale-95"
              >
                {paused ? <Play className="size-4 fill-white" /> : <Pause className="size-4 fill-white" />}
              </button>
            )}
          </div>

          {/* Center Play/Pause Micro-Animation indicator */}
          {!ytInfo && showCenterIcon && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-5 text-white backdrop-blur-sm animate-in zoom-in-75 fade-in duration-200">
              {paused ? <Pause className="size-8 fill-white" /> : <Play className="size-8 fill-white ml-0.5" />}
            </div>
          )}

          {/* Right Floating Action Stack */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-24 right-2.5 z-20 flex flex-col items-center gap-4 text-white"
          >
            {/* Heart / Like button (Requires login) */}
            <button
              type="button"
              onClick={handleLikeStory}
              className="group flex flex-col items-center gap-0.5 transition active:scale-90"
              aria-pressed={isLiked}
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition group-hover:bg-black/60',
                  isLiked && 'bg-[#ff3b5c]/20',
                )}
              >
                <Heart
                  className={cn(
                    'size-6 transition-transform group-hover:scale-110',
                    isLiked ? 'fill-[#ff3b5c] text-[#ff3b5c]' : 'text-white',
                  )}
                />
              </span>
              <span className="font-mono text-[10.5px]">
                {toBengaliNumerals((it.likes ?? 0) + (isLiked ? 1 : 0))}
              </span>
            </button>

            {/* Comment button (Opens right side comment drawer) */}
            <button
              type="button"
              onClick={handleToggleComments}
              className="group flex flex-col items-center gap-0.5 transition active:scale-90"
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition group-hover:bg-black/60',
                  showComments && 'bg-[#00ED64]/30 ring-2 ring-[#00ED64]',
                )}
              >
                <MessageCircle
                  className={cn('size-6 transition-transform group-hover:scale-110', showComments ? 'text-[#00ED64]' : 'text-white')}
                />
              </span>
              <span className="font-mono text-[10.5px]">
                {toBengaliNumerals(itemComments.length)}
              </span>
            </button>

            {/* Save / Bookmark button (Requires login) */}
            <button
              type="button"
              onClick={handleSaveStory}
              className="group flex flex-col items-center gap-0.5 transition active:scale-90"
            >
              <span
                className={cn(
                  'flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition group-hover:bg-black/60',
                  isSaved && 'bg-white/20',
                )}
              >
                <Bookmark
                  className={cn(
                    'size-6 transition-transform group-hover:scale-110',
                    isSaved ? 'fill-white text-white' : 'text-white',
                  )}
                />
              </span>
              <span className="font-mono text-[10.5px]">{isSaved ? 'সংরক্ষিত' : 'সংরক্ষণ'}</span>
            </button>

            {/* Share button */}
            <button
              type="button"
              onClick={() => onShare(it.title)}
              className="group flex flex-col items-center gap-0.5 transition active:scale-90"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition group-hover:bg-black/60">
                <Share2 className="size-6 transition-transform group-hover:scale-110" />
              </span>
              <span className="font-mono text-[10.5px]">শেয়ার</span>
            </button>
          </div>

          {/* Bottom Story / Reel Title */}
          <div className="absolute inset-x-4 bottom-6 z-10 pr-16 text-white pointer-events-none">
            <p className="font-bangla text-[18px] sm:text-[20px] font-bold leading-snug drop-shadow-md line-clamp-2">
              {it.title}
            </p>
            <p className="mt-1.5 font-mono text-[10.5px] text-white/75">
              {ytInfo ? 'YouTube Shorts · ' : `${toBengaliNumerals(idx + 1)} / ${toBengaliNumerals(count)} · `}
              {it.meta}
            </p>
          </div>
        </div>

        {/* Right Side Comments Drawer (Desktop split view & Mobile slide-up) */}
        {showComments && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'z-30 flex flex-col bg-[#07161f] text-white border border-white/10 shadow-2xl transition-all duration-300',
              // Desktop: right adjacent panel
              'sm:ml-3 sm:h-[92vh] sm:w-[360px] md:w-[390px] sm:rounded-2xl',
              // Mobile: overlay modal from bottom
              'fixed inset-x-0 bottom-0 top-1/4 rounded-t-3xl sm:static sm:inset-auto',
            )}
          >
            {/* Comments Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0a1f2b]/60 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-[#00ED64]" />
                <h3 className="font-bangla text-[15px] font-bold text-white">
                  মন্তব্যসমূহ ({toBengaliNumerals(itemComments.length)})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Comments List (Always readable even when logged out!) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-white/5 no-scrollbar">
              {itemComments.length === 0 ? (
                <div className="py-12 text-center text-white/50 font-bangla text-[13.5px]">
                  এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!
                </div>
              ) : (
                itemComments.map((c) => {
                  const likes = (c.likes ?? 0) + (commentLikes[c.id] ?? 0);
                  return (
                    <div key={c.id} className="pt-3 first:pt-0 flex items-start gap-2.5">
                      <Avatar src={c.avatar} name={c.author} size="size-8" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-bangla text-[13px] font-bold text-white truncate">
                            {c.author}
                          </span>
                          <span className="font-bangla text-[11.5px] font-medium text-emerald-300 shrink-0">
                            {c.timestampLabel || 'এখন'}
                          </span>
                        </div>
                        <p className="mt-0.5 font-bangla text-[13px] text-white/85 leading-relaxed break-words">
                          {c.text}
                        </p>
                        {/* Like reaction button for comment */}
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleLikeComment(c.id)}
                            className="inline-flex items-center gap-1 font-bangla text-[11px] font-medium text-white/60 hover:text-[#00ED64] transition"
                          >
                            <ThumbsUp className="size-3" />
                            <span>{likes > 0 ? toBengaliNumerals(likes) : 'লাইক'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!currentUser && onOpenAuth) {
                                onOpenAuth();
                              } else {
                                commentInputRef.current?.focus();
                              }
                            }}
                            className="font-bangla text-[11px] font-medium text-white/60 hover:text-white transition"
                          >
                            উত্তর দিন
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Section: If logged in, comment input; if logged out, Auth required banner */}
            <div className="border-t border-white/10 p-3 bg-[#0a1f2b]/80 rounded-b-2xl">
              {currentUser ? (
                <form onSubmit={handleSendComment} className="flex items-center gap-2">
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="size-8" />
                  <input
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="আপনার মন্তব্য লিখুন…"
                    className="flex-1 rounded-full bg-white/10 px-3.5 py-2 font-bangla text-[13px] text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-[#00ED64]"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00ED64] text-[#061621] transition hover:bg-[#00d859] disabled:opacity-40 active:scale-95"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-2 text-center">
                  <p className="font-bangla text-[12.5px] text-white/80">
                    মন্তব্য করতে বা প্রতিক্রিয়া জানাতে লগইন করুন
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#00ED64] hover:bg-[#00d859] px-5 py-1.5 font-bangla text-[13px] font-bold text-[#061621] shadow-md transition active:scale-95"
                  >
                    <LogIn className="size-3.5 text-[#061621]" />
                    <span>লগইন করুন</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Prev / Next side arrow controls */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <button
          onClick={prev}
          disabled={idx === 0}
          aria-label="Previous story"
          className="flex size-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20 transition active:scale-95"
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          onClick={next}
          disabled={idx === count - 1}
          aria-label="Next story"
          className="flex size-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 disabled:opacity-20 transition active:scale-95"
        >
          <ChevronDown className="size-5" />
        </button>
      </div>
    </div>
  );
}
