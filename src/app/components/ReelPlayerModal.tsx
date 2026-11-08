import { useEffect, useState, useRef, useCallback } from 'react';
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
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Avatar, cn } from './Primitives';
import { SharePopoverButton } from './ShareModal';
import type { Comment, UserProfile } from '../types';
import { toBengaliNumerals } from '../utils/pureLogic';
import {
  YouTubeMark,
  buildYouTubeEmbedSrc,
  ytPostCommand,
  parseDurationLabel,
} from './YouTubeMark';

export interface PlayerItem {
  id: string;
  title: string;
  creator: string;
  avatar: string;
  image: string;
  meta: string;
  likes?: number;
  videoUrl?: string;
  duration?: string;
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

interface Props {
  items: PlayerItem[] | null;
  start: number;
  currentUser?: UserProfile | null;
  comments?: Comment[];
  onClose: () => void;
  onShare: (t: string) => void;
  onOpenAuth?: () => void;
  onComment?: (targetId: string, text: string, parentId?: string, replyToAuthor?: string) => void;
  onEditComment?: (id: string, newText: string) => void;
  onDeleteComment?: (id: string) => void;
  onReactStory?: (targetId: string) => void;
  onBookmarkStory?: (targetId: string) => void;
}

export function ReelPlayerModal({
  items,
  start,
  currentUser,
  comments = [],
  onClose,
  onOpenAuth,
  onComment,
  onEditComment,
  onDeleteComment,
  onReactStory,
  onBookmarkStory,
}: Props) {
  const [idx, setIdx] = useState(start);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(0);
  const [showChrome, setShowChrome] = useState(true);

  const commentInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);
  const accumulated = useRef(0);

  useEffect(() => {
    setIdx(start);
    setPaused(false);
    setShowComments(false);
    setProgress(0);
    accumulated.current = 0;
    startedAt.current = 0;
  }, [start, items]);

  const count = items?.length ?? 0;
  const next = useCallback(() => {
    if (idx < count - 1) {
      setIdx(idx + 1);
      setPaused(false);
      setProgress(0);
      accumulated.current = 0;
      startedAt.current = 0;
    } else {
      onClose();
    }
  }, [idx, count, onClose]);

  const prev = useCallback(() => {
    setIdx((i) => Math.max(0, i - 1));
    setPaused(false);
    setProgress(0);
    accumulated.current = 0;
    startedAt.current = 0;
  }, []);

  const bumpChrome = useCallback(() => {
    setShowChrome(true);
    if (chromeTimer.current) clearTimeout(chromeTimer.current);
    chromeTimer.current = setTimeout(() => setShowChrome(false), 2800);
  }, []);

  const togglePlayPause = useCallback(() => {
    setPaused((p) => {
      const nextP = !p;
      setShowCenterIcon(true);
      setTimeout(() => setShowCenterIcon(false), 700);
      return nextP;
    });
    bumpChrome();
  }, [bumpChrome]);

  // Keyboard
  useEffect(() => {
    if (!items) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showComments) setShowComments(false);
        else onClose();
      }
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.key === 'm' || e.key === 'M') setIsMuted((m) => !m);
    };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [items, idx, showComments, next, prev, togglePlayPause, onClose]);

  const it = items?.[idx];
  const ytInfo = it ? getYouTubeEmbedInfo(it.videoUrl) : null;
  const durationSec = parseDurationLabel(it?.duration || it?.meta);

  // Timeline + YT/native sync
  useEffect(() => {
    if (!it) return;
    if (progressTimer.current) clearInterval(progressTimer.current);

    if (paused) {
      accumulated.current += startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0;
      startedAt.current = 0;
      ytPostCommand(iframeRef.current, 'pauseVideo');
      videoRef.current?.pause();
      return;
    }

    startedAt.current = Date.now();
    ytPostCommand(iframeRef.current, 'playVideo');
    void videoRef.current?.play().catch(() => undefined);

    progressTimer.current = setInterval(() => {
      const native = videoRef.current;
      if (native && !Number.isNaN(native.duration) && native.duration > 0) {
        setProgress(Math.min(1, native.currentTime / native.duration));
        return;
      }
      const elapsed = accumulated.current + (Date.now() - startedAt.current) / 1000;
      setProgress((elapsed % durationSec) / durationSec);
    }, 120);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [paused, it, durationSec, idx]);

  useEffect(() => {
    ytPostCommand(iframeRef.current, isMuted ? 'mute' : 'unMute');
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted, idx]);

  if (!items || items.length === 0 || !it) return null;

  const isLiked = liked[it.id];
  const isSaved = saved[it.id];
  const itemComments = comments.filter(
    (c) => c.targetId === it.id || c.targetId === `reel-${it.id}` || c.targetId === `story-${it.id}`,
  );

  const seekTo = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    setProgress(clamped);
    accumulated.current = clamped * durationSec;
    startedAt.current = paused ? 0 : Date.now();
    if (videoRef.current?.duration) videoRef.current.currentTime = clamped * videoRef.current.duration;
    ytPostCommand(iframeRef.current, 'seekTo', [clamped * durationSec, true]);
    bumpChrome();
  };

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    seekTo((e.clientX - rect.left) / rect.width);
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
      onOpenAuth?.();
      return;
    }
    setLiked((l) => ({ ...l, [it.id]: !l[it.id] }));
    onReactStory?.(it.id);
  };

  const handleSaveStory = () => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    setSaved((s) => ({ ...s, [it.id]: !s[it.id] }));
    onBookmarkStory?.(it.id);
  };

  const handleSendComment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    const val = commentText.trim();
    if (!val) return;
    onComment?.(it.id, val, replyingTo?.id, replyingTo?.author);
    setCommentText('');
    setReplyingTo(null);
  };

  const handleLikeComment = (cid: string) => {
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    setCommentLikes((prev) => ({ ...prev, [cid]: (prev[cid] ?? 0) + 1 }));
  };

  const actionBtn = 'group flex flex-col items-center gap-0.5 transition active:scale-90';
  const actionIcon =
    'flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/15 transition group-hover:bg-black/65';

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#050a07]/95 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-label={it.title}
    >
      <img src={it.image} alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-25 blur-3xl pointer-events-none" />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-30 flex size-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition active:scale-95"
      >
        <X className="size-5" />
      </button>

      <div className="relative flex h-full w-full items-center justify-center sm:h-[92vh] max-w-[940px] px-2 sm:px-4">
        <div
          onClick={togglePlayPause}
          className="relative h-full w-full max-w-[430px] shrink-0 overflow-hidden bg-black shadow-2xl cursor-pointer select-none sm:rounded-2xl sm:border sm:border-white/15"
        >
          {/* Media — YouTube never shows native controls */}
          {ytInfo ? (
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              <iframe
                ref={iframeRef}
                key={it.id}
                src={buildYouTubeEmbedSrc(ytInfo.videoId, {
                  autoplay: true,
                  muted: isMuted,
                  loop: true,
                })}
                title={it.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="absolute left-1/2 top-1/2 h-[128%] w-[128%] -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none select-none"
              />
            </div>
          ) : it.videoUrl || it.image?.endsWith('.mp4') ? (
            <video
              ref={videoRef}
              key={it.id}
              src={it.videoUrl || it.image}
              poster={it.image}
              autoPlay
              muted={isMuted}
              loop
              playsInline
              className="absolute inset-0 size-full object-cover pointer-events-none"
            />
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

          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/55 via-transparent to-black/80" />

          {/* Header: account only + optional YouTube mark */}
          <div
            className={cn(
              'absolute inset-x-3 top-4 z-10 flex items-center gap-2.5 text-white transition-opacity duration-300',
              showChrome || paused ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Avatar src={it.avatar} name={it.creator} size="size-9" ring />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bangla text-[14px] font-bold">{it.creator}</p>
            </div>
            {ytInfo && <YouTubeMark className="rounded-md bg-black/40 px-2 py-1" />}
          </div>

          {/* Center play/pause flash — also for YouTube */}
          {showCenterIcon && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 p-5 text-white backdrop-blur-sm animate-in zoom-in-75 fade-in duration-200">
              {paused ? <Pause className="size-8 fill-white" /> : <Play className="size-8 fill-white ml-0.5" />}
            </div>
          )}

          {/* Right stack: Like, Comment, Share, Save, Mute */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-20 right-2 z-20 flex flex-col items-center gap-1.5 text-white"
          >
            <button type="button" onClick={handleLikeStory} className={actionBtn} aria-pressed={isLiked}>
              <span className={cn(actionIcon, isLiked && 'bg-[#ff3b5c]/25')}>
                <Heart className={cn('size-5', isLiked ? 'fill-[#ff3b5c] text-[#ff3b5c]' : 'text-white')} />
              </span>
              <span className="font-bangla font-bold text-[11px]">{toBengaliNumerals((it.likes ?? 0) + (isLiked ? 1 : 0))}</span>
            </button>

            <button type="button" onClick={handleToggleComments} className={actionBtn}>
              <span className={cn(actionIcon, showComments && 'bg-[#03EF62]/30 ring-2 ring-[#03EF62]')}>
                <MessageCircle className={cn('size-5', showComments ? 'text-[#03EF62]' : 'text-white')} />
              </span>
              <span className="font-bangla font-bold text-[11px]">{toBengaliNumerals(itemComments.length)}</span>
            </button>

            <SharePopoverButton
              title={it.title}
              url={`/reel/${it.id}`}
              floating
            >
              <div className={actionBtn}>
                <span className={actionIcon}>
                  <Share2 className="size-5" />
                </span>
                <span className="font-mono text-[11px]">শেয়ার</span>
              </div>
            </SharePopoverButton>

            <button type="button" onClick={handleSaveStory} className={actionBtn}>
              <span className={cn(actionIcon, isSaved && 'bg-white/20')}>
                <Bookmark className={cn('size-5', isSaved && 'fill-white')} />
              </span>
              <span className="font-mono text-[11px]">{isSaved ? 'সংরক্ষিত' : 'সংরক্ষণ'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className={actionBtn}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <span className={actionIcon}>
                {isMuted ? <VolumeX className="size-[17px]" /> : <Volume2 className="size-[17px] text-[#03EF62]" />}
              </span>
            </button>
          </div>

          {/* Custom timeline + pause — never YouTube scrubber */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-8 bg-gradient-to-t from-black/75 to-transparent transition-opacity',
              showChrome || paused ? 'opacity-100' : 'opacity-80',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 pr-14 font-bangla text-[15px] font-bold leading-snug text-white line-clamp-2 drop-shadow">
              {it.title}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayPause}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                aria-label={paused ? 'Play' : 'Pause'}
              >
                {paused ? <Play className="ml-0.5 size-3.5 fill-white" /> : <Pause className="size-3.5 fill-white" />}
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
                    className="block h-full rounded-full bg-[#03EF62]"
                    style={{ width: `${progress * 100}%` }}
                  />
                </span>
                <span
                  className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-white shadow opacity-90"
                  style={{ left: `calc(${progress * 100}% - 5px)` }}
                />
              </div>
              <span className="font-bangla font-bold text-[11px] text-white/80 tabular-nums shrink-0">
                {toBengaliNumerals(idx + 1)}/{toBengaliNumerals(count)}
              </span>
            </div>
          </div>
        </div>

        {/* Comments drawer */}
        {showComments && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'z-30 flex flex-col bg-[#07161f] text-white border border-white/10 shadow-2xl transition-all duration-300',
              'sm:ml-3 sm:h-[92vh] sm:w-[360px] md:w-[390px] sm:rounded-2xl',
              'fixed inset-x-0 bottom-0 top-1/4 rounded-t-3xl sm:static sm:inset-auto',
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#0a1f2b]/60 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-[#03EF62]" />
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

            <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-white/5 no-scrollbar">
              {itemComments.length === 0 ? (
                <div className="py-12 text-center text-white/50 font-bangla text-[13.5px]">
                  এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!
                </div>
              ) : (
                itemComments.filter((c) => !c.parentId).map((c) => {
                  const likes = (c.likes ?? 0) + (commentLikes[c.id] ?? 0);
                  const canManage = Boolean(
                    currentUser &&
                      currentUser.id &&
                      c.authorId &&
                      (currentUser.id === c.authorId),
                  );
                  const replies = itemComments.filter((r) => r.parentId === c.id);

                  return (
                    <div key={c.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Avatar src={c.avatar} name={c.author} size="size-8" />
                        <div className="min-w-0 flex-1">
                          <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="font-bangla text-[13px] font-bold text-white truncate">{c.author}</span>
                              <span className="font-bangla text-[11px] font-medium text-emerald-300 shrink-0">
                                {c.timestamp || 'এখন'}
                              </span>
                            </div>
                            {editingCommentId === c.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const clean = editingText.trim();
                                  if (clean && clean !== c.text) {
                                    onEditComment?.(c.id, clean);
                                  }
                                  setEditingCommentId(null);
                                }}
                                className="mt-1 space-y-1.5"
                              >
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  autoFocus
                                  className="w-full rounded-lg border border-white/20 bg-black/40 px-2 py-1 font-bangla text-xs text-white outline-none focus:border-[#03EF62]"
                                />
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="submit"
                                    disabled={!editingText.trim()}
                                    className="rounded px-2 py-0.5 bg-[#03EF62] text-[#061621] text-[11px] font-bold cursor-pointer"
                                  >
                                    সংরক্ষণ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCommentId(null)}
                                    className="rounded px-2 py-0.5 bg-white/10 text-white text-[11px] cursor-pointer"
                                  >
                                    বাতিল
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <p className="mt-0.5 font-bangla text-[13px] text-white/90 leading-relaxed break-words">
                                {c.text}
                                {c.isEdited && (
                                  <span className="ml-1 text-[11px] text-white/40 font-normal">(সম্পাদিত)</span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="ml-2 mt-1 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleLikeComment(c.id)}
                              className="inline-flex items-center gap-1 font-bangla text-[11px] font-medium text-white/60 hover:text-[#03EF62] transition"
                            >
                              <ThumbsUp className="size-3" />
                              <span>{likes > 0 ? toBengaliNumerals(likes) : 'লাইক'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!currentUser && onOpenAuth) {
                                  onOpenAuth();
                                  return;
                                }
                                setReplyingTo({ id: c.id, author: c.author });
                                setCommentText(`@${c.author} `);
                                commentInputRef.current?.focus();
                              }}
                              className="font-bangla text-[11px] font-medium text-white/60 hover:text-[#03EF62] transition cursor-pointer"
                            >
                              উত্তর দিন
                            </button>
                            {canManage && editingCommentId !== c.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingText(c.text);
                                  }}
                                  className="font-bangla text-[11px] font-medium text-white/60 hover:text-[#03EF62] transition cursor-pointer"
                                >
                                  এডিট
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteComment?.(c.id)}
                                  className="font-bangla text-[11px] font-medium text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                >
                                  মুছুন
                                </button>
                              </>
                            )}
                          </div>

                          {/* Nested Replies */}
                          {replies.length > 0 && (
                            <div className="mt-2.5 ml-2 pl-3 border-l-2 border-emerald-500/30 space-y-2">
                              {replies.map((r) => {
                                const rLikes = (r.likes ?? 0) + (commentLikes[r.id] ?? 0);
                                const canManageReply = Boolean(
                                  currentUser &&
                                    currentUser.id &&
                                    r.authorId &&
                                    (currentUser.id === r.authorId),
                                );
                                return (
                                  <div key={r.id} className="flex items-start gap-2">
                                    <Avatar src={r.avatar} name={r.author} size="size-7" />
                                    <div className="min-w-0 flex-1">
                                      <div className="rounded-xl bg-white/5 border border-white/5 px-2.5 py-1.5">
                                        <div className="flex items-baseline justify-between gap-1">
                                          <span className="font-bangla text-[12px] font-bold text-white truncate">{r.author}</span>
                                          <span className="font-bangla text-[11px] text-emerald-300 shrink-0">{r.timestamp || 'এখন'}</span>
                                        </div>
                                        <p className="mt-0.5 font-bangla text-[12px] text-white/85 leading-snug break-words">{r.text}</p>
                                      </div>
                                      <div className="ml-1.5 mt-0.5 flex items-center gap-2.5">
                                        <button
                                          type="button"
                                          onClick={() => handleLikeComment(r.id)}
                                          className="font-bangla text-[11px] font-medium text-white/60 hover:text-[#03EF62] transition"
                                        >
                                          লাইক {rLikes > 0 && `(${toBengaliNumerals(rLikes)})`}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReplyingTo({ id: c.id, author: r.author });
                                            setCommentText(`@${r.author} `);
                                            commentInputRef.current?.focus();
                                          }}
                                          className="font-bangla text-[11px] font-medium text-white/60 hover:text-[#03EF62] transition"
                                        >
                                          উত্তর দিন
                                        </button>
                                        {canManageReply && (
                                          <button
                                            type="button"
                                            onClick={() => onDeleteComment?.(r.id)}
                                            className="font-bangla text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                          >
                                            মুছুন
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-white/10 p-3 bg-[#0a1f2b]/80 rounded-b-2xl">
              {replyingTo && (
                <div className="flex items-center justify-between px-3 py-1 mb-2 bg-[#03EF62]/10 border border-[#03EF62]/30 rounded-xl text-xs font-bangla text-[#03EF62]">
                  <span>{replyingTo.author}-কে উত্তর দেওয়া হচ্ছে…</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setCommentText('');
                    }}
                    className="text-white/60 hover:text-white ml-2 text-sm leading-none"
                    title="বাতিল করুন"
                  >
                    ✕
                  </button>
                </div>
              )}
              {currentUser ? (
                <form onSubmit={handleSendComment} className="flex items-center gap-2">
                  <Avatar src={currentUser.avatar} name={currentUser.name} size="size-8" />
                  <input
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="আপনার মন্তব্য লিখুন…"
                    className="flex-1 rounded-full bg-white/10 px-3.5 py-2 font-bangla text-[13px] text-white outline-none placeholder:text-white/40 focus:ring-1 focus:ring-[#03EF62]"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#03EF62] text-[#061621] transition hover:bg-[#02d955] disabled:opacity-40 active:scale-95 cursor-pointer"
                  >
                    <Send className="size-4" />
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-2 text-center">
                  <p className="font-bangla text-[12.5px] text-white/80">মন্তব্য করতে বা প্রতিক্রিয়া জানাতে লগইন করুন</p>
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#03EF62] hover:bg-[#02d955] px-5 py-1.5 font-bangla text-[13px] font-bold text-[#061621] shadow-md transition active:scale-95"
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

      {/* Prev / Next — always available (mobile + desktop) */}
      <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 sm:right-6 sm:gap-3">
        <button
          onClick={prev}
          disabled={idx === 0}
          aria-label="Previous reel"
          className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 disabled:opacity-20 transition active:scale-95"
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          onClick={next}
          disabled={idx === count - 1}
          aria-label="Next reel"
          className="flex size-10 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 disabled:opacity-20 transition active:scale-95"
        >
          <ChevronDown className="size-5" />
        </button>
      </div>
    </div>
  );
}
