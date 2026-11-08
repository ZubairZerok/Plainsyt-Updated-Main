import { useState } from 'react';
import { safeUrl } from '../lib/mappers';
import { Globe2, MoreHorizontal, MessageCircle, Share2, Send, Bookmark, Bot, ExternalLink } from 'lucide-react';
import type { CommunityPost, LinkedInReactionType, UserProfile } from '../types';
import { Avatar, FEED_CARD, VerifiedBadge, Num, cn } from './Primitives';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { SharePopoverButton } from './ShareModal';
import { CommentThread } from './CommentThread';
import { deepLinkCommentId } from '../lib/notifications';
import { toBengaliNumerals, totalReactions } from '../utils/pureLogic';

export const TEXT_THEMES = [
  '',
  'bg-gradient-to-br from-[#0f5e3e] to-[#38b17e]',
  'bg-gradient-to-br from-[#f2994a] to-[#f2c94c]',
  'bg-gradient-to-br from-[#7b2ff7] to-[#f107a3]',
  'bg-gradient-to-br from-[#04301f] to-[#1b3a6b]',
  'bg-gradient-to-br from-[#e41e3f] to-[#ff8a00]',
];

interface Props {
  post: CommunityPost;
  currentUser: UserProfile | null;
  onReact: (type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: () => void;
  onSave: () => void;
  onComment: (text: string, parentId?: string, replyToAuthor?: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReactComment?: (commentId: string, type: LinkedInReactionType) => void;
  onShare: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (images: string[], index: number, title?: string, authorName?: string, authorId?: string) => void;
  hasStory?: boolean;
  onOpenStory?: () => void;
}

export function CommunityPostCard({
  post,
  currentUser,
  onReact,
  onOpenReactionsBreakdown,
  onSave,
  onComment,
  onEditComment,
  onDeleteComment,
  onReactComment,
  onNavigateProfile,
  onOpenPhoto,
  hasStory,
  onOpenStory,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  // Open the thread straight away when a notification deep-links to one of its comments.
  const [showComments, setShowComments] = useState(() => {
    const id = deepLinkCommentId();
    return Boolean(id && post.comments.some((c) => c.id === id));
  });
  const [text, setText] = useState('');

  const long = post.content.length > 260;
  const shown = long && !expanded ? post.content.slice(0, 240).trimEnd() + '…' : post.content;
  const themed = post.textTheme && post.content.length < 140 && !post.images?.length;
  const imgs = post.images ?? [];
  const extra = imgs.length - 3;

  const submit = () => {
    if (!text.trim()) return;
    onComment(text.trim());
    setText('');
    setShowComments(true);
  };

  const reactionTotal = totalReactions(post.reactionCounts, post.stats.likes);

  return (
    <article className={FEED_CARD}>
      <header className="flex items-start gap-2.5 px-3 pt-3 sm:px-4">
        <button
          type="button"
          onClick={() => {
            if (hasStory && onOpenStory) onOpenStory();
            else onNavigateProfile(post.authorId);
          }}
          className="shrink-0"
          title={hasStory ? `${post.author.name} এর স্টোরি দেখুন` : post.author.name}
        >
          <Avatar src={post.author.avatar} name={post.author.name} size="size-10" online hasStory={hasStory} />
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
            <div className="inline-flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateProfile(post.authorId)}
                className="truncate text-left font-bangla text-[14.5px] font-semibold text-pine-900 hover:underline"
              >
                {post.author.name}
              </button>
              {post.author.isVerified && <VerifiedBadge />}
            </div>
            {/* Smaller tags / designations in a single line (beside name or wraps to next line) */}
            <div className="inline-flex items-center gap-1 text-[11px] font-bangla text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full shrink-0">
              {post.author.role && (
                <>
                  <span className="truncate max-w-[130px] font-medium text-emerald-700 dark:text-[#03EF62]">
                    {post.author.role}
                  </span>
                  <span>·</span>
                </>
              )}
              <span className="shrink-0">{post.timestamp}</span>
              <span>·</span>
              <Globe2 className="size-3 shrink-0 text-slate-400" aria-label="Public" />
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label="More"
          className="flex size-8 items-center justify-center rounded-full text-pine-900/60 hover:bg-canvas-subtle"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      {themed ? (
        <div className={cn('mx-0 mt-3 flex min-h-[260px] items-center justify-center px-8 py-10 text-center', post.textTheme)}>
          <p className="font-bangla text-[24px] font-bold leading-snug text-white">{post.content}</p>
        </div>
      ) : (
        <div className="whitespace-pre-line px-3 pt-2.5 font-bangla text-[15px] leading-[1.6] text-pine-900 sm:px-4">
          {shown}
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="ml-1 font-sans text-[14px] font-semibold text-pine-900/60 hover:underline"
            >
              {expanded ? 'কম দেখুন' : 'আরও দেখুন'}
            </button>
          )}
        </div>
      )}

      {safeUrl(post.externalLink) && (
        <div className="mx-3 mt-2.5 sm:mx-4">
          <a
            href={safeUrl(post.externalLink)}
            target="_blank"
            rel="noopener noreferrer"
            title={post.externalLink}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-pine-900/25 bg-pine-50 px-3 py-2 font-mono text-[12px] text-pine-800 hover:border-pine-900"
          >
            <span className="min-w-0 truncate">{post.externalLink?.replace(/^https?:\/\/(www\.)?/, '')}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        </div>
      )}

      {post.aiLabel && (
        <p className="mx-3 mt-2 inline-flex items-center gap-1 rounded-md bg-canvas-subtle px-2 py-0.5 font-mono text-[11px] text-accent-fg sm:mx-4">
          <Bot className="size-3" />
          AI info · Made with AI
        </p>
      )}

      {post.sharedPost && (
        <div className="mx-3 mt-3 rounded-xl border border-canvas-border bg-canvas-subtle/60 p-3.5 sm:mx-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => post.sharedPost?.authorId && onNavigateProfile(post.sharedPost.authorId)}
            >
              <Avatar src={post.sharedPost.authorAvatar} name={post.sharedPost.authorName} size="size-8" />
            </button>
            <span>
              <button
                type="button"
                onClick={() => post.sharedPost?.authorId && onNavigateProfile(post.sharedPost.authorId)}
                className="block text-left text-[13.5px] font-semibold text-pine-900 hover:underline"
              >
                {post.sharedPost.authorName}
              </button>
              <span className="flex items-center gap-1 font-bangla text-[11.5px] text-pine-900/55">
                {post.sharedPost.timestamp} · <Globe2 className="size-3" />
              </span>
            </span>
          </div>
          <blockquote className="relative mt-2.5 border-l-[3px] border-pine-500 pl-3 font-bangla text-[14.5px] leading-[1.65] text-pine-900/90">
            <span className="absolute -left-1 -top-4 font-display text-[40px] leading-none text-pine-400/40">“</span>
            {post.sharedPost.text}
          </blockquote>
        </div>
      )}

      {/* Clickable Photos -> Opens PhotoLightboxModal */}
      {imgs.length === 1 && (
        <div className="mt-3 bg-pine-100">
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 0, post.content.slice(0, 90), post.author.name, post.authorId)}
            className="block w-full cursor-zoom-in"
          >
            <img src={imgs[0]} alt="Post attachment" className="max-h-[520px] w-full object-cover" />
          </button>
        </div>
      )}
      {imgs.length === 2 && (
        <div className="mt-3 grid grid-cols-2 gap-0.5 bg-pine-100">
          {imgs.map((s, idx) => (
            <button
              key={s + idx}
              type="button"
              onClick={() => onOpenPhoto(imgs, idx, post.content.slice(0, 90), post.author.name, post.authorId)}
              className="block cursor-zoom-in"
            >
              <img src={s} alt="" className="aspect-square w-full object-cover sm:aspect-[4/3]" />
            </button>
          ))}
        </div>
      )}
      {imgs.length >= 3 && (
        <div className="mt-3 grid aspect-[4/3] sm:aspect-auto sm:h-[26rem] grid-cols-[1.5fr_1fr] grid-rows-2 gap-0.5 bg-pine-100">
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 0, post.content.slice(0, 90), post.author.name, post.authorId)}
            aria-label="ছবি বড় করে দেখুন"
            className="row-span-2 block size-full cursor-zoom-in"
          >
            <img src={imgs[0]} alt="Field visit" className="size-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 1, post.content.slice(0, 90), post.author.name, post.authorId)}
            aria-label="ছবি বড় করে দেখুন"
            className="block size-full cursor-zoom-in"
          >
            <img src={imgs[1]} alt="" className="size-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 2, post.content.slice(0, 90), post.author.name, post.authorId)}
            aria-label="ছবি বড় করে দেখুন"
            className="relative block size-full cursor-zoom-in"
          >
            <img src={imgs[2]} alt="" className="size-full object-cover" />
            {extra > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-[30px] font-semibold text-white">
                +{extra}
              </span>
            )}
          </button>
        </div>
      )}

      {/* LinkedIn Reaction Summary */}
      <div className="px-3 pb-2 pt-2.5 sm:px-4">
        <LinkedInReactionSummary
          counts={post.reactionCounts}
          fallbackTotal={post.stats.likes}
          userReaction={post.userReaction}
          onOpenBreakdown={onOpenReactionsBreakdown}
          rightSlot={
            post.stats.commentsCount > 0 ? (
              <button type="button" onClick={() => setShowComments((s) => !s)} className="hover:underline">
                {toBengaliNumerals(post.stats.commentsCount)}টি মন্তব্য
              </button>
            ) : null
          }
        />
      </div>

      {/* LinkedIn Action Bar */}
      <div className="mx-1.5 grid grid-cols-4 sm:mx-4 border-t border-canvas-border py-1 gap-1 items-center">
        <LinkedInReactionPickerButton
          userReaction={post.userReaction}
          onSelect={onReact}
          countLabel={reactionTotal > 0 ? toBengaliNumerals(reactionTotal) : undefined}
          showLabel
          className="h-9 w-full justify-center !rounded-lg !border-transparent !bg-transparent !py-0 hover:!bg-canvas-subtle !text-[12px] sm:!text-[13.5px]"
        />
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          aria-label="মন্তব্য দেখুন বা লিখুন"
          title="মন্তব্য"
          className="flex items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13.5px] font-semibold text-pine-900/65 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
        >
          <MessageCircle className="size-4 sm:size-[19px] shrink-0 dark:text-[#03EF62]" />
          <span className="truncate">মন্তব্য</span>
          {post.comments.length > 0 && (
            <span className="font-bangla font-bold text-[12px] opacity-90">
              (<Num>{toBengaliNumerals(post.comments.length)}</Num>)
            </span>
          )}
        </button>
        <SharePopoverButton
          wrapperClassName="w-full"
          title={post.content.slice(0, 60)}
          url={`/post/${post.id}`}
        >
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13.5px] font-semibold text-pine-900/65 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
          >
            <Share2 className="size-4 sm:size-[19px] shrink-0 dark:text-[#03EF62]" />
            <span className="truncate">শেয়ার</span>
          </button>
        </SharePopoverButton>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={post.userSaved}
          aria-label="Save post"
          className={cn(
            'flex items-center justify-center gap-1 sm:gap-1.5 h-9 rounded-lg px-1 text-[12px] sm:text-[13.5px] font-semibold transition hover:bg-canvas-subtle whitespace-nowrap min-w-0',
            post.userSaved ? 'text-emerald-600 dark:text-[#03EF62]' : 'text-pine-900/60 dark:text-slate-300',
          )}
        >
          <Bookmark className={cn('size-4 sm:size-[18px] shrink-0 dark:text-[#03EF62]', post.userSaved && 'fill-current')} />
          <span className="truncate">{post.userSaved ? 'সংরক্ষিত' : 'সংরক্ষণ'}</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-canvas-border px-3 pb-2 pt-3 sm:px-4">
          <CommentThread
            comments={post.comments}
            currentUser={currentUser}
            onNavigateProfile={onNavigateProfile}
            onReply={(text, parentId, replyTo) => onComment(text, parentId, replyTo)}
            onEdit={onEditComment}
            onDelete={onDeleteComment}
            onReact={onReactComment}
          />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn('flex items-center gap-2 px-3 pb-3 sm:px-4', !showComments && 'pt-1')}
      >
        <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-8" />
        <div className="flex h-9 flex-1 items-center rounded-full bg-canvas-subtle pl-3.5 pr-1 ring-1 ring-transparent focus-within:ring-pine-500">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setShowComments(true)}
            placeholder="মন্তব্য লিখুন…"
            className="flex-1 bg-transparent font-bangla text-[13.5px] text-pine-900 outline-none placeholder:text-pine-900/60"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send"
            className="flex size-7 items-center justify-center rounded-full text-accent-fg disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </article>
  );
}
