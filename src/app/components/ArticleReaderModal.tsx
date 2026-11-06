import { useState, useRef } from 'react';
import { Bookmark, Share2, Clock, Send, Eye, ExternalLink, Calendar, GraduationCap, ShieldCheck, CornerDownRight, ArrowLeft } from 'lucide-react';
import type { Article, Comment, LinkedInReactionType, UserProfile } from '../types';
import { Modal, CloseButton, Avatar, SectionLabel, Num, cn } from './Primitives';
import { ImageGraphic } from './ImageGraphic';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, toBengaliNumerals, totalReactions } from '../utils/pureLogic';
import { ArticleReaderSkeleton } from './Skeletons';

interface Props {
  article: Article | null;
  bookmarked: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onReact: (type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: () => void;
  onBookmark: () => void;
  onComment: (t: string, parentId?: string, replyToAuthor?: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReactComment?: (commentId: string, type: LinkedInReactionType) => void;
  onShare: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (src: string, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
}

export function ArticleReaderContent({
  article: a,
  bookmarked,
  currentUser,
  isStandalonePage = false,
  onClose,
  onReact,
  onOpenReactionsBreakdown,
  onBookmark,
  onComment,
  onEditComment,
  onDeleteComment,
  onReactComment,
  onShare,
  onNavigateProfile,
  onOpenPhoto,
}: Omit<Props, 'article'> & { article: Article; isStandalonePage?: boolean }) {
  const [text, setText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const canManageComment = (c: Comment) =>
    Boolean(
      currentUser &&
        (currentUser.id === c.authorId ||
          currentUser.name === c.author ||
          currentUser.role === 'Admin'),
    );
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const rxTotal = totalReactions(a.reactionCounts, a.stats.likes);

  // Pull-to-dismiss gesture for mobile view (handles touch and pointer gestures)
  const handleDragStart = (clientY: number) => {
    touchStartY.current = clientY;
  };

  const handleDragMove = (clientY: number) => {
    if (touchStartY.current === null) return;
    const diff = clientY - touchStartY.current;
    if (diff > 0) {
      setDragOffsetY(diff);
    }
  };

  const handleDragEnd = () => {
    if (dragOffsetY > 90 && !isStandalonePage) {
      onClose();
    }
    setDragOffsetY(0);
    touchStartY.current = null;
  };

  return (
    <article
      style={{
        transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined,
        transition: dragOffsetY > 0 ? 'none' : 'transform 200ms ease-out',
      }}
      className="rounded-t-3xl border border-slate-200/80 dark:border-[#03EF62]/60 bg-canvas-card shadow-2xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300 ease-out"
    >
      {/* Sticky top header with mobile drag-down handle */}
      <div
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest('button, a, input, textarea')) return;
          handleDragStart(e.clientY);
        }}
        onPointerMove={(e) => handleDragMove(e.clientY)}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className="sticky top-0 z-10 flex flex-col border-b border-slate-100 dark:border-white/10 bg-canvas-card/95 backdrop-blur-md cursor-grab active:cursor-grabbing"
      >
        {!isStandalonePage && (
          <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1 w-full select-none">
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-[#03EF62]" />
          </div>
        )}

        <div className="flex items-center justify-between px-4 sm:px-5 py-2">
          {isStandalonePage ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-pine-800/80 dark:text-slate-300 font-bangla">
              <button
                type="button"
                onClick={onClose}
                aria-label="হোম ফিডে ফিরে যান"
                title="ফিডে ফিরে যান"
                className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-canvas-card text-slate-700 dark:text-slate-200 hover:border-[#03EF62] hover:text-emerald-700 dark:hover:text-[#03EF62] transition shadow-xs active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="size-4 shrink-0" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-[#03EF62]" />
                <span>প্রবন্ধ বিবরণী</span>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
          {!isStandalonePage && (
            <a
              href={`/article/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-[#03EF62] bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-[#03EF62] hover:bg-slate-100 dark:hover:bg-[#03EF62]/10 hover:text-slate-900 dark:hover:text-[#03EF62] transition shadow-2xs hover:scale-105 active:scale-95"
              title="নতুন ট্যাবে পড়ুন (Open in new tab)"
              aria-label="নতুন ট্যাবে পড়ুন"
            >
              <ExternalLink className="size-4.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onBookmark}
            aria-pressed={bookmarked}
            aria-label="Bookmark"
            title="সংরক্ষণ করুন"
            className={cn(
              'flex size-9 items-center justify-center rounded-full border border-slate-200/80 dark:border-[#03EF62] bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-[#03EF62]/10 transition shadow-2xs hover:scale-105 active:scale-95',
              bookmarked ? 'text-emerald-600 dark:text-[#03EF62]' : 'text-slate-600 dark:text-[#03EF62]',
            )}
          >
            <Bookmark className={cn('size-4.5', bookmarked && 'fill-current')} />
          </button>
          {!isStandalonePage && (
            <CloseButton
              onClick={onClose}
              className="border border-slate-200/80 dark:border-[#03EF62] dark:text-[#03EF62] dark:hover:bg-[#03EF62]/10"
            />
          )}
        </div>
      </div>
    </div>

      <ImageGraphic
        type={a.imageType}
        coverImageUrl={a.coverImageUrl}
        title={a.title}
        className="aspect-[2/1]"
        plate={`FIG. ${a.id.toUpperCase()} — ${a.categoryEn.toUpperCase()}`}
        onClickPhoto={
          a.coverImageUrl
            ? (src) => onOpenPhoto(src, a.title, a.subtitle, a.author.name, a.authorId)
            : undefined
        }
      />

      {a.imageCaption && (
        <figcaption className="border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] px-5 py-2.5 font-bangla text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-400 italic">
          {a.imageCaption}
        </figcaption>
      )}

      <div className="px-5 pb-8 pt-6 sm:px-10">
        <p className="font-bangla text-[13px] font-semibold text-pine-600">{a.category}</p>
        <h1
          id="reader-title"
          className="mt-2 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.01em] text-pine-950 sm:text-[38px]"
        >
          {a.title}
        </h1>
        <p className="mt-3 font-bangla text-[17px] leading-relaxed text-pine-900/75">{a.subtitle}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-pine-900 py-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (!isStandalonePage) onClose();
                onNavigateProfile(a.authorId);
              }}
            >
              <Avatar src={a.author.avatar} name={a.author.name} size="size-9" />
            </button>
            <div>
              <button
                type="button"
                onClick={() => {
                  if (!isStandalonePage) onClose();
                  onNavigateProfile(a.authorId);
                }}
                className="block text-left font-bangla text-[14px] font-semibold text-pine-900 hover:underline"
              >
                {a.author.name}
              </button>
              <span className="block font-bangla text-[12.5px] text-slate-600 dark:text-slate-300">
                {a.author.designation} {a.author.organization ? `· ${a.author.organization}` : ''}
              </span>
            </div>
          </div>
          <span className="ml-auto flex items-center gap-3 font-bangla text-[12px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 text-[#03EF62]" />
              {a.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3 text-[#03EF62]" />
              {toBengaliNumerals(a.readTimeMinutes)} মিনিট
            </span>
          </span>
        </div>

        {a.takeaways.length > 0 && (
          <aside className="mt-6 rounded-2xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
            <SectionLabel>মূল কথা · Key takeaways</SectionLabel>
            <ol className="mt-3 space-y-2">
              {a.takeaways.map((t, i) => (
                <li key={t + i} className="flex gap-2.5 font-bangla text-[14.5px] text-slate-800 dark:text-slate-100">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bangla text-[12px] font-bold">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </aside>
        )}

        <div className="mt-6 space-y-4 font-bangla text-[17px] leading-[1.85] text-slate-800 dark:text-slate-100">
          {a.content.map((para, i) => (
            <p
              key={i}
              className={cn(
                i === 0 &&
                  'first-letter:float-left first-letter:mr-2.5 first-letter:font-display first-letter:text-[50px] first-letter:font-bold first-letter:leading-[0.88] first-letter:text-emerald-700 dark:first-letter:text-emerald-400',
              )}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Authoritative Peer-Reviewed Research & Primary Source Citation */}
        {(a.researchBasis || a.externalLink) && (() => {
          const resolvedSourceUrl =
            a.researchBasis?.sourceUrl ||
            a.externalLink ||
            (a.researchBasis?.doiOrSource?.startsWith('http') ? a.researchBasis.doiOrSource : '') ||
            (a.id === 'art-bina-gamma-2026' ? 'http://bina.gov.bd/' : '') ||
            (a.id === 'art-japan-cucumber-robot-2026' ? 'https://www.zen-noh.or.jp/' : '') ||
            `https://scholar.google.com/scholar?q=${encodeURIComponent(a.researchBasis?.journalOrInst || a.title)}`;

          return (
            <section
              aria-label="গবেষণা ও তথ্যসূত্র"
              className="mt-8 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-canvas-card/80 p-5 sm:p-6 shadow-xs backdrop-blur-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#03EF62]/15 text-emerald-700 dark:text-[#03EF62]">
                    <GraduationCap className="size-4" />
                  </span>
                  <div>
                    <h4 className="font-bangla text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-[#03EF62]">
                      গবেষণা ও প্রাথমিক তথ্যসূত্র · Scientific Citation
                    </h4>
                    <p className="font-bangla text-[11px] text-slate-500 dark:text-slate-400">
                      পিয়ার-রিভিউড প্রকাশনা ও প্রাতিষ্ঠানিক গবেষণা ডেটাসেট
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 dark:border-[#03EF62]/40 bg-emerald-50/80 dark:bg-[#03EF62]/10 px-2.5 py-0.5 font-bangla text-[10.5px] font-bold text-emerald-800 dark:text-[#03EF62]">
                  <ShieldCheck className="size-3" /> যাচাইকৃত সোর্স
                </span>
              </div>

              {a.researchBasis && (
                <div className="space-y-3 font-bangla">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      গবেষক দল ও প্রতিষ্ঠান:
                    </span>
                    <p className="mt-0.5 text-[14px] font-bold text-slate-900 dark:text-white leading-snug">
                      {a.researchBasis.journalOrInst}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        ফিল্ড সাইট / রেফারেন্স:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-mono text-[11.5px]">
                        {a.researchBasis.doiOrSource}
                      </p>
                    </div>
                    {a.researchBasis.keyMetric && (
                      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-right">
                        <span className="block text-[10px] text-slate-400 font-medium">মূল প্রযুক্তিগত পরিমাপক</span>
                        <span className="font-bangla text-xs font-bold text-emerald-700 dark:text-[#03EF62]">
                          <Num>{a.researchBasis.keyMetric}</Num>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                <a
                  href={resolvedSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 dark:border-[#03EF62]/40 bg-emerald-600 dark:bg-[#03EF62] px-4 py-2 text-xs font-bold text-white dark:text-[#061621] hover:bg-emerald-700 dark:hover:bg-[#02d857] transition shadow-xs cursor-pointer active:scale-95"
                >
                  <span>মূল গবেষণা ও অফিসিয়াল সোর্স দেখুন</span>
                  <ExternalLink className="size-3.5 stroke-[2.5]" />
                </a>
                <span className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                  {resolvedSourceUrl.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </section>
          );
        })()}

        <div className="mt-6">
          <LinkedInReactionSummary
            counts={a.reactionCounts}
            fallbackTotal={a.stats.likes}
            userReaction={a.userReaction}
            onOpenBreakdown={onOpenReactionsBreakdown}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-slate-200/80 dark:border-[#03EF62] bg-canvas-card shadow-sm">
            <LinkedInReactionPickerButton
              userReaction={a.userReaction}
              onSelect={onReact}
              countLabel={rxTotal > 0 ? formatBengaliNumberCompact(rxTotal) : undefined}
            />
          </div>
          <button
            type="button"
            onClick={onShare}
            className="flex h-10 items-center gap-2 rounded-full border border-slate-200/80 dark:border-[#03EF62] bg-canvas-card px-4 text-[14px] font-semibold text-slate-700 dark:text-[#03EF62] shadow-sm hover:bg-slate-50 dark:hover:bg-[#03EF62]/10 transition"
          >
            <Share2 className="size-[18px] text-[#03EF62]" />
            Share
          </button>
        </div>

        <section className="mt-8 border-t border-slate-100 dark:border-white/10 pt-5">
          <h2 className="font-display text-[22px] font-semibold text-slate-900 dark:text-white">
            আলোচনা <span className="font-bangla font-bold text-[14px] text-emerald-600 dark:text-[#03EF62]">({toBengaliNumerals(a.stats.commentsCount)})</span>
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) {
                onComment(text.trim());
                setText('');
              }
            }}
            className="mt-3 flex items-start gap-2.5"
          >
            <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-9" />
            <div className="flex-1 rounded-2xl border border-slate-200/80 dark:border-[#03EF62]/50 bg-slate-50/50 dark:bg-white/5 focus-within:border-[#03EF62] focus-within:bg-white dark:focus-within:bg-canvas-card transition p-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="তথ্যভিত্তিক মতামত দিন…"
                className="w-full resize-none bg-transparent px-2 py-1 font-bangla text-[14.5px] text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
              />
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-[#03EF62] hover:bg-[#02d857] text-[#061621] px-4 text-[12.5px] font-bold shadow-sm disabled:opacity-40 transition"
                >
                  <Send className="size-3.5 text-[#061621]" />
                  Post Comment
                </button>
              </div>
            </div>
          </form>
          <ul className="mt-4 space-y-4">
            {a.comments.filter((c) => !c.parentId).map((c) => {
              const replies = a.comments.filter((r) => r.parentId === c.id);
              const isReplying = replyingToId === c.id;
              return (
                <li key={c.id} className="space-y-2">
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isStandalonePage) onClose();
                        onNavigateProfile(c.authorId);
                      }}
                    >
                      <Avatar src={c.avatar} name={c.author} size="size-9" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isStandalonePage) onClose();
                          onNavigateProfile(c.authorId);
                        }}
                        className="block font-bangla text-left hover:underline"
                      >
                        <span className="text-[13.5px] font-semibold text-pine-900 dark:text-white">{c.author}</span>
                      </button>
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
                          className="mt-1 space-y-2"
                        >
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoFocus
                            rows={2}
                            className="w-full rounded-xl border border-emerald-500/50 bg-white dark:bg-canvas-card p-2 font-bangla text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="submit"
                              disabled={!editingText.trim()}
                              className="rounded-lg bg-[#03EF62] px-2.5 py-1 font-bangla text-xs font-bold text-[#061621] hover:bg-[#02d857] transition disabled:opacity-40 cursor-pointer"
                            >
                              সংরক্ষণ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              className="rounded-lg border border-slate-300 dark:border-white/10 px-2.5 py-1 font-bangla text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            >
                              বাতিল
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className="font-bangla text-[14.5px] leading-relaxed text-pine-900/85 dark:text-slate-200">
                          {c.text}
                          {c.isEdited && (
                            <span className="ml-1.5 text-[11px] text-slate-400 font-normal">(সম্পাদিত)</span>
                          )}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2.5 font-bangla text-[12px] font-medium text-emerald-800 dark:text-emerald-400">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{c.timestamp}</span>
                        {onReactComment && (
                          <LinkedInReactionPickerButton
                            compact
                            userReaction={c.userReaction}
                            onSelect={(type) => onReactComment(c.id, type)}
                            countLabel={c.likes > 0 ? String(c.likes) : undefined}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isReplying) {
                              setReplyingToId(null);
                            } else {
                              setReplyingToId(c.id);
                              setReplyText(`@${c.author} `);
                            }
                          }}
                          className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
                        >
                          উত্তর দিন
                        </button>
                        {canManageComment(c) && (
                          <>
                            <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(c.id);
                                setEditingText(c.text);
                              }}
                              className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
                              title="মন্তব্য সম্পাদনা করুন"
                            >
                              এডিট
                            </button>
                            <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof window !== 'undefined' && window.confirm('আপনি কি এই মন্তব্যটি মুছে ফেলতে চান?')) {
                                  onDeleteComment?.(c.id);
                                }
                              }}
                              className="font-bangla font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer"
                              title="মন্তব্য মুছে ফেলুন"
                            >
                              মুছুন
                            </button>
                          </>
                        )}
                      </div>

                      {/* Inline Reply Input */}
                      {isReplying && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (replyText.trim()) {
                              onComment(replyText.trim(), c.id, c.author);
                              setReplyText('');
                              setReplyingToId(null);
                            }
                          }}
                          className="mt-2.5 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-2"
                        >
                          <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-7" />
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            autoFocus
                            placeholder={`${c.author}-কে উত্তর দিন…`}
                            className="flex-1 bg-transparent font-bangla text-[13px] text-slate-900 dark:text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="text-[11px] text-slate-400 hover:text-slate-600 px-2 font-bangla"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            disabled={!replyText.trim()}
                            className="h-7 px-3 rounded-full bg-[#03EF62] text-[#061621] text-[11px] font-bold disabled:opacity-40"
                          >
                            উত্তর
                          </button>
                        </form>
                      )}

                      {/* Nested Threaded Replies */}
                      {replies.length > 0 && (
                        <div className="mt-2.5 pl-3 border-l-2 border-emerald-500/25 dark:border-white/10 space-y-2.5">
                          {replies.map((r) => (
                            <div key={r.id} className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isStandalonePage) onClose();
                                  onNavigateProfile(r.authorId);
                                }}
                              >
                                <Avatar src={r.avatar} name={r.author} size="size-7" />
                              </button>
                              <div className="min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isStandalonePage) onClose();
                                    onNavigateProfile(r.authorId);
                                  }}
                                  className="block font-bangla text-left hover:underline"
                                >
                                  <span className="text-[12.5px] font-semibold text-pine-900 dark:text-white">{r.author}</span>
                                </button>
                                {editingCommentId === r.id ? (
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const clean = editingText.trim();
                                      if (clean && clean !== r.text) {
                                        onEditComment?.(r.id, clean);
                                      }
                                      setEditingCommentId(null);
                                    }}
                                    className="mt-1 space-y-2"
                                  >
                                    <textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      autoFocus
                                      rows={2}
                                      className="w-full rounded-xl border border-emerald-500/50 bg-white dark:bg-canvas-card p-2 font-bangla text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="submit"
                                        disabled={!editingText.trim()}
                                        className="rounded-lg bg-[#03EF62] px-2.5 py-1 font-bangla text-xs font-bold text-[#061621] hover:bg-[#02d857] transition disabled:opacity-40 cursor-pointer"
                                      >
                                        সংরক্ষণ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingCommentId(null)}
                                        className="rounded-lg border border-slate-300 dark:border-white/10 px-2.5 py-1 font-bangla text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                                      >
                                        বাতিল
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <p className="font-bangla text-[13.5px] leading-relaxed text-pine-900/85 dark:text-slate-200">
                                    {r.text}
                                    {r.isEdited && (
                                      <span className="ml-1.5 text-[10px] text-slate-400 font-normal">(সম্পাদিত)</span>
                                    )}
                                  </p>
                                )}
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 font-bangla text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
                                  <span className="text-slate-400">{r.timestamp}</span>
                                  {onReactComment && (
                                    <LinkedInReactionPickerButton
                                      compact
                                      userReaction={r.userReaction}
                                      onSelect={(type) => onReactComment(r.id, type)}
                                      countLabel={r.likes > 0 ? String(r.likes) : undefined}
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingToId(c.id);
                                      setReplyText(`@${r.author} `);
                                    }}
                                    className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
                                  >
                                    উত্তর দিন
                                  </button>
                                  {canManageComment(r) && (
                                    <>
                                      <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommentId(r.id);
                                          setEditingText(r.text);
                                        }}
                                        className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
                                        title="মন্তব্য সম্পাদনা করুন"
                                      >
                                        এডিট
                                      </button>
                                      <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (typeof window !== 'undefined' && window.confirm('আপনি কি এই মন্তব্যটি মুছে ফেলতে চান?')) {
                                            onDeleteComment?.(r.id);
                                          }
                                        }}
                                        className="font-bangla font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer"
                                        title="মন্তব্য মুছে ফেলুন"
                                      >
                                        মুছুন
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}

export function ArticleReaderModal(props: Props & { isOpen?: boolean }) {
  const isOpen = props.isOpen !== undefined ? props.isOpen : !!props.article;
  if (!isOpen) return null;
  return (
    <Modal open={isOpen} onClose={props.onClose} className="max-w-[760px]" labelledBy="reader-title">
      {props.article ? (
        <ArticleReaderContent {...props} article={props.article} />
      ) : (
        <ArticleReaderSkeleton />
      )}
    </Modal>
  );
}
