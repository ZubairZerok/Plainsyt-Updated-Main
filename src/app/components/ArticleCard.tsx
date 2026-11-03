import { useState } from 'react';
import { MessageCircle, Bookmark, Share2, Clock, Send, Eye, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import type { Article, LinkedInReactionType, UserProfile } from '../types';
import { ImageGraphic } from './ImageGraphic';
import { Avatar, FEED_CARD, cn } from './Primitives';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, toBengaliNumerals, totalReactions } from '../utils/pureLogic';

interface Props {
  article: Article;
  lead?: boolean;
  bookmarked: boolean;
  currentUser: UserProfile | null;
  onOpenPopup: () => void;
  onReact: (type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: () => void;
  onBookmark: () => void;
  onComment: (text: string) => void;
  onReactComment?: (commentId: string, type: LinkedInReactionType) => void;
  onShare: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (src: string, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
}

export function ArticleCard({
  article: a,
  lead,
  bookmarked,
  currentUser,
  onOpenPopup,
  onReact,
  onOpenReactionsBreakdown,
  onBookmark,
  onComment,
  onReactComment,
  onShare,
  onNavigateProfile,
  onOpenPhoto,
}: Props) {
  const [text, setText] = useState('');
  const [showComments, setShowComments] = useState(Boolean(lead));

  const submit = () => {
    if (!text.trim()) return;
    onComment(text.trim());
    setText('');
    setShowComments(true);
  };

  const reactionTotal = totalReactions(a.reactionCounts, a.stats.likes);

  return (
    <article className={cn(FEED_CARD, 'overflow-hidden')}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenPopup}
        onKeyDown={(e) => e.key === 'Enter' && onOpenPopup()}
        className="block w-full cursor-pointer text-left"
        aria-label={a.title}
      >
        <ImageGraphic
          type={a.imageType}
          coverImageUrl={a.coverImageUrl}
          title={a.title}
          className={lead ? 'aspect-[16/9]' : 'aspect-[2/1]'}
          plate={`FIG. ${a.id.toUpperCase()}`}
          onClickPhoto={
            a.coverImageUrl
              ? (src) => onOpenPhoto(src, a.title, a.subtitle, a.author.name, a.authorId)
              : undefined
          }
        />
      </div>

      <div className="px-4 pb-3 pt-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200/90 dark:border-white/10 bg-slate-100 dark:bg-white/10 px-3 py-0.5 font-bangla text-[12px] font-semibold text-slate-700 dark:text-slate-300">
            {a.category}
          </span>
          <span className="flex items-center gap-1 font-bangla text-[12px] text-slate-600 dark:text-slate-300">
            <Clock className="size-3 text-[#03EF62]" />
            {toBengaliNumerals(a.readTimeMinutes)} মিনিট পড়া
          </span>
          {/* Post Date & Time replacing Views count */}
          <span className="flex items-center gap-1 font-bangla text-[12px] text-slate-600 dark:text-slate-300">
            <Calendar className="size-3 text-[#03EF62]" />
            {a.publishedAt}
          </span>
          <a
            href={`/article/${a.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="নতুন ট্যাবে পড়ুন"
            aria-label="নতুন ট্যাবে পড়ুন"
            className="ml-auto inline-flex size-7.5 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-[#03EF62] hover:bg-slate-100 dark:hover:bg-white/10 transition shadow-2xs hover:scale-105 active:scale-95"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>

        <button type="button" onClick={onOpenPopup} className="mt-3 block text-left">
          <h2
            className={cn(
              'font-display font-bold leading-[1.18] tracking-[-0.01em] text-pine-950 decoration-pine-400 decoration-2 underline-offset-4 hover:underline',
              lead ? 'text-[24px] sm:text-[30px]' : 'text-[20px] sm:text-[22px]',
            )}
          >
            {a.title}
          </h2>
        </button>
        <p className="mt-2 font-bangla text-[15px] leading-relaxed text-pine-900/75">{a.subtitle}</p>

        {/* Author Byline -> Click navigates to Author Profile */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-canvas-border pt-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateProfile(a.authorId)}
              className="shrink-0"
              aria-label={`View ${a.author.name}'s profile`}
            >
              <Avatar src={a.author.avatar} name={a.author.name} size="size-9" />
            </button>
            <span className="min-w-0">
              <button
                type="button"
                onClick={() => onNavigateProfile(a.authorId)}
                className="block truncate text-left font-bangla text-[13.5px] font-semibold text-pine-900 hover:underline"
              >
                {a.author.name}
              </button>
              <span className="block truncate font-bangla text-[12px] text-slate-600 dark:text-slate-400">
                {a.author.designation} {a.author.organization ? `· ${a.author.organization}` : ''}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPopup}
            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#03EF62] hover:bg-[#02d955] px-4 py-1.5 text-[12.5px] font-bold text-[#061621] transition active:scale-95 shadow-sm sm:inline-flex"
          >
            <span>পড়ুন</span>
            <ArrowRight className="size-3.5 text-[#061621]" strokeWidth={2.5} />
          </button>
        </div>

        {/* LinkedIn Reaction Summary */}
        <LinkedInReactionSummary
          counts={a.reactionCounts}
          fallbackTotal={a.stats.likes}
          userReaction={a.userReaction}
          onOpenBreakdown={onOpenReactionsBreakdown}
          className="mt-3 pt-2 border-t border-canvas-border/60"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              className="font-mono text-[11px] hover:underline"
            >
              {toBengaliNumerals(a.stats.commentsCount)} comments
            </button>
          }
        />
      </div>

      {/* Action Bar with LinkedIn Reaction Picker */}
      <div className="grid grid-cols-4 items-center gap-1 border-t border-canvas-border px-1.5 py-1 sm:px-3">
        <LinkedInReactionPickerButton
          userReaction={a.userReaction}
          onSelect={onReact}
          countLabel={reactionTotal > 0 ? formatBengaliNumberCompact(reactionTotal) : undefined}
          className="w-full justify-center"
        />
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13px] font-semibold text-pine-900/70 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
        >
          <MessageCircle className="size-4 sm:size-[18px] shrink-0" />
          <span className="truncate">
            <span className="hidden xs:inline">Comment</span> ({toBengaliNumerals(a.stats.commentsCount)})
          </span>
        </button>
        <button
          type="button"
          onClick={onShare}
          className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13px] font-semibold text-pine-900/70 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
        >
          <Share2 className="size-4 sm:size-[18px] shrink-0" />
          <span className="truncate">Share</span>
        </button>
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={bookmarked}
          aria-label="Bookmark"
          className={cn(
            'flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13px] font-semibold transition hover:bg-canvas-subtle whitespace-nowrap min-w-0',
            bookmarked ? 'text-emerald-600 dark:text-[#03EF62]' : 'text-pine-900/70 dark:text-slate-200',
          )}
        >
          <Bookmark className={cn('size-4 sm:size-[18px] shrink-0', bookmarked && 'fill-current')} />
          <span className="truncate">{bookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-canvas-border bg-canvas-subtle/50 px-4 py-3 sm:px-5">
          {a.comments.map((c) => (
            <div key={c.id} className="mb-2.5 flex gap-2">
              <button type="button" onClick={() => onNavigateProfile(c.authorId)} className="shrink-0">
                <Avatar src={c.avatar} name={c.author} size="size-8" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-canvas-card px-3 py-2 ring-1 ring-canvas-border">
                  <button
                    type="button"
                    onClick={() => onNavigateProfile(c.authorId)}
                    className="font-bangla text-[12.5px] font-semibold text-pine-900 hover:underline"
                  >
                    {c.author} <span className="font-normal text-emerald-700/80 dark:text-emerald-400">· {c.role}</span>
                  </button>
                  <p className="font-bangla text-[13.5px] leading-snug text-pine-900/85">{c.text}</p>
                </div>
                <div className="ml-2 mt-0.5 flex items-center gap-2 font-bangla text-[12px] font-medium text-emerald-800 dark:text-emerald-400">
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
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2"
          >
            <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-8" />
            <div className="flex h-9 flex-1 items-center rounded-full border border-canvas-border bg-canvas-card pl-3.5 pr-1 focus-within:border-pine-600">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="আপনার গঠনমূলক মতামত লিখুন…"
                className="flex-1 bg-transparent font-bangla text-[13.5px] text-pine-900 outline-none placeholder:text-pine-900/40"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Send comment"
                className="flex size-7 items-center justify-center rounded-full text-pine-600 disabled:opacity-30"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
