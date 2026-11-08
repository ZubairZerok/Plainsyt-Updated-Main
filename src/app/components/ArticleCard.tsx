import { useState } from 'react';
import { MessageCircle, Bookmark, Share2, Clock, Send, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import type { Article, LinkedInReactionType, UserProfile } from '../types';
import { ImageGraphic } from './ImageGraphic';
import { Avatar, FEED_CARD, Num, cn } from './Primitives';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { SharePopoverButton } from './ShareModal';
import { CommentThread } from './CommentThread';
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
  onComment: (text: string, parentId?: string, replyToAuthor?: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReactComment?: (commentId: string, type: LinkedInReactionType) => void;
  onShare: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (src: string, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
  hasStory?: boolean;
  onOpenStory?: () => void;
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
  onEditComment,
  onDeleteComment,
  onReactComment,
  onNavigateProfile,
  onOpenPhoto,
  hasStory,
  onOpenStory,
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
            <span className="font-bangla font-bold">{toBengaliNumerals(a.readTimeMinutes)}</span> মিনিট পড়া
          </span>
          {/* Post Date & Time replacing Views count */}
          <span className="flex items-center gap-1 font-bangla text-[12px] text-slate-600 dark:text-slate-300"><Calendar className="size-3 text-[#03EF62]" /><span className="font-bangla font-bold">{a.publishedAt}</span></span>
          <a
            href={`/article/${a.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="নতুন ট্যাবে পড়ুন"
            aria-label="নতুন ট্যাবে পড়ুন"
            className="ml-auto inline-flex size-7.5 items-center justify-center rounded-full border border-slate-200/80 dark:border-[#03EF62]/40 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-[#03EF62] hover:bg-slate-100 dark:hover:bg-[#03EF62]/10 transition shadow-2xs hover:scale-105 active:scale-95"
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
              onClick={() => {
                if (hasStory && onOpenStory) onOpenStory();
                else onNavigateProfile(a.authorId);
              }}
              className="shrink-0"
              aria-label={`View ${a.author.name}'s story or profile`}
              title={hasStory ? `${a.author.name} এর স্টোরি দেখুন` : a.author.name}
            >
              <Avatar src={a.author.avatar} name={a.author.name} size="size-9" hasStory={hasStory} />
            </button>
            <div className="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-tight">
              <button
                type="button"
                onClick={() => onNavigateProfile(a.authorId)}
                className="shrink-0 text-left font-bangla text-[13.5px] font-semibold text-pine-900 hover:underline"
              >
                {a.author.name}
              </button>
              {/* Smaller tags / designations in a single line (beside name or wraps to next line) */}
              {(a.author.designation || a.author.organization) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bangla text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                  <span className="truncate text-emerald-700 dark:text-[#03EF62] font-medium">{a.author.designation}</span>
                  {a.author.organization && (
                    <>
                      <span>·</span>
                      <span className="truncate">{a.author.organization}</span>
                    </>
                  )}
                </span>
              )}
            </div>
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
              className="font-bangla font-bold text-[12px] hover:underline"
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
          showLabel
          className="h-9 w-full justify-center !rounded-lg !border-transparent !bg-transparent !py-0 hover:!bg-canvas-subtle !text-[12px] sm:!text-[13.5px]"
        />
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          aria-label="মন্তব্য দেখুন বা লিখুন"
          title="মন্তব্য"
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13px] font-semibold text-pine-900/70 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
        >
          <MessageCircle className="size-4 sm:size-[18px] shrink-0 dark:text-[#03EF62]" />
          <span className="truncate">মন্তব্য</span>
          {a.stats.commentsCount > 0 && (
            <span className="font-bangla font-bold text-[12px] opacity-90">
              (<Num>{toBengaliNumerals(a.stats.commentsCount)}</Num>)
            </span>
          )}
        </button>
        <SharePopoverButton
          wrapperClassName="w-full"
          title={a.title}
          url={`/article/${a.slug || a.id}`}
        >
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13px] font-semibold text-pine-900/70 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
          >
            <Share2 className="size-4 sm:size-[18px] shrink-0 dark:text-[#03EF62]" />
            <span className="truncate">শেয়ার</span>
          </button>
        </SharePopoverButton>
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={bookmarked}
          aria-label="Bookmark"
          className={cn(
            'flex items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13px] font-semibold transition hover:bg-canvas-subtle whitespace-nowrap min-w-0',
            bookmarked ? 'text-emerald-600 dark:text-[#03EF62]' : 'text-pine-900/70 dark:text-slate-200',
          )}
        >
          <Bookmark className={cn('size-4 sm:size-[18px] shrink-0 dark:text-[#03EF62]', bookmarked && 'fill-current')} />
          <span className="truncate">{bookmarked ? 'সংরক্ষিত' : 'সংরক্ষণ'}</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-canvas-border bg-canvas-subtle/50 px-4 py-3 sm:px-5">
          <CommentThread
            className="mb-3"
            comments={a.comments}
            currentUser={currentUser}
            onNavigateProfile={onNavigateProfile}
            onReply={(text, parentId, replyTo) => onComment(text, parentId, replyTo)}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
            onReact={onReactComment}
          />
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
                className="flex-1 bg-transparent font-bangla text-[13.5px] text-pine-900 outline-none placeholder:text-pine-900/60"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Send comment"
                className="flex size-7 items-center justify-center rounded-full text-accent-fg disabled:opacity-50"
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
