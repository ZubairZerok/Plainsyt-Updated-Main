import { useState, useRef } from 'react';
import { Bookmark, Share2, Clock, FlaskConical, Send, Eye, ExternalLink, Calendar } from 'lucide-react';
import type { Article, LinkedInReactionType, UserProfile } from '../types';
import { Modal, CloseButton, Avatar, SectionLabel, cn } from './Primitives';
import { ImageGraphic } from './ImageGraphic';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, toBengaliNumerals, totalReactions } from '../utils/pureLogic';

interface Props {
  article: Article | null;
  bookmarked: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onReact: (type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: () => void;
  onBookmark: () => void;
  onComment: (t: string) => void;
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
  onReactComment,
  onShare,
  onNavigateProfile,
  onOpenPhoto,
}: Omit<Props, 'article'> & { article: Article; isStandalonePage?: boolean }) {
  const [text, setText] = useState('');
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

        <div className="flex items-center justify-end px-4 sm:px-5 py-2">
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

        {a.externalLink && (
          <div className="mt-5">
            <a
              href={a.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
            >
              External Reference / Source Link <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        {a.researchBasis && (
          <div className="mt-7 grid gap-3 rounded-2xl border border-slate-200/80 dark:border-[#03EF62]/40 bg-slate-50/60 dark:bg-white/5 p-4 font-mono text-[11.5px] text-slate-700 dark:text-slate-200 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <FlaskConical className="size-5 text-emerald-600 dark:text-[#03EF62]" />
            <div>
              <p className="uppercase tracking-wider text-emerald-600 dark:text-[#03EF62] font-semibold text-[10px]">Research basis</p>
              <p className="mt-0.5 font-medium">{a.researchBasis.journalOrInst}</p>
              <p className="text-slate-500 dark:text-slate-400">{a.researchBasis.doiOrSource}</p>
            </div>
            <span className="rounded-full border border-emerald-200/80 dark:border-[#03EF62]/50 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-[12px] font-semibold text-emerald-800 dark:text-[#03EF62]">
              {a.researchBasis.keyMetric}
            </span>
          </div>
        )}

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
            {a.comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isStandalonePage) onClose();
                    onNavigateProfile(c.authorId);
                  }}
                >
                  <Avatar src={c.avatar} name={c.author} size="size-9" />
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isStandalonePage) onClose();
                      onNavigateProfile(c.authorId);
                    }}
                    className="font-bangla text-[13.5px] font-semibold text-pine-900 hover:underline"
                  >
                    {c.author} <span className="font-normal text-emerald-700/80 dark:text-emerald-400">· {c.role}</span>
                  </button>
                  <p className="font-bangla text-[14.5px] leading-relaxed text-pine-900/85">{c.text}</p>
                  <div className="mt-1 flex items-center gap-2 font-bangla text-[12px] font-medium text-emerald-800 dark:text-emerald-400">
                    <span className="font-semibold">{c.timestamp}</span>
                    {onReactComment && (
                      <LinkedInReactionPickerButton
                        compact
                        userReaction={c.userReaction}
                        onSelect={(type) => onReactComment(c.id, type)}
                        countLabel={c.likes > 0 ? String(c.likes) : undefined}
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

export function ArticleReaderModal(props: Props) {
  if (!props.article) return null;
  return (
    <Modal open={!!props.article} onClose={props.onClose} className="max-w-[760px]" labelledBy="reader-title">
      <ArticleReaderContent {...props} article={props.article} />
    </Modal>
  );
}
