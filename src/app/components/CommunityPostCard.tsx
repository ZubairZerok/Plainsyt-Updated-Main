import { useState } from 'react';
import { isZubairIdentifier } from '../lib/auth';
import { Globe2, MoreHorizontal, MessageCircle, Share2, Send, Bookmark, Bot, ExternalLink } from 'lucide-react';
import type { CommunityPost, LinkedInReactionType, UserProfile } from '../types';
import { Avatar, FEED_CARD, VerifiedBadge, Num, cn } from './Primitives';
import { LinkedInReactionPickerButton, LinkedInReactionSummary } from './LinkedInReactionBar';
import { SharePopoverButton } from './ShareModal';
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
  onShare,
  onNavigateProfile,
  onOpenPhoto,
  hasStory,
  onOpenStory,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const canManageComment = (comment: Comment) =>
    Boolean(
      currentUser &&
        currentUser.id &&
        comment.authorId &&
        (currentUser.id === comment.authorId ||
          (isZubairIdentifier(currentUser.id) && isZubairIdentifier(comment.authorId))),
    );
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
              {expanded ? 'See less' : 'See more'}
            </button>
          )}
        </div>
      )}

      {post.externalLink && (
        <div className="mx-3 mt-2.5 sm:mx-4">
          <a
            href={post.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-pine-900/25 bg-pine-50 px-3 py-1.5 font-mono text-[12px] text-pine-800 hover:border-pine-900"
          >
            {post.externalLink} <ExternalLink className="size-3.5" />
          </a>
        </div>
      )}

      {post.aiLabel && (
        <p className="mx-3 mt-2 inline-flex items-center gap-1 rounded-md bg-canvas-subtle px-2 py-0.5 font-mono text-[10px] text-pine-600 sm:mx-4">
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
              <img src={s} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {imgs.length >= 3 && (
        <div className="mt-3 grid aspect-[4/3] grid-cols-[1.5fr_1fr] grid-rows-2 gap-0.5 bg-pine-100">
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 0, post.content.slice(0, 90), post.author.name, post.authorId)}
            className="row-span-2 block size-full cursor-zoom-in"
          >
            <img src={imgs[0]} alt="Field visit" className="size-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 1, post.content.slice(0, 90), post.author.name, post.authorId)}
            className="block size-full cursor-zoom-in"
          >
            <img src={imgs[1]} alt="" className="size-full object-cover" />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhoto(imgs, 2, post.content.slice(0, 90), post.author.name, post.authorId)}
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
          className="w-full justify-center"
        />
        <button
          type="button"
          onClick={() => setShowComments((s) => !s)}
          aria-label="মন্তব্য দেখুন বা লিখুন"
          title="মন্তব্য"
          className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13.5px] font-semibold text-pine-900/65 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
        >
          <MessageCircle className="size-4 sm:size-[19px] shrink-0 dark:text-[#03EF62]" />
          {post.comments.length > 0 && (
            <span className="font-bangla font-bold text-[12px] opacity-90">
              (<Num>{toBengaliNumerals(post.comments.length)}</Num>)
            </span>
          )}
        </button>
        <SharePopoverButton
          title={post.content.slice(0, 60)}
          url={`/post/${post.id}`}
        >
          <button
            type="button"
            className="flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13.5px] font-semibold text-pine-900/65 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0"
          >
            <Share2 className="size-4 sm:size-[19px] shrink-0 dark:text-[#03EF62]" />
            <span className="truncate">Share</span>
          </button>
        </SharePopoverButton>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={post.userSaved}
          aria-label="Save post"
          className={cn(
            'flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13.5px] font-semibold transition hover:bg-canvas-subtle whitespace-nowrap min-w-0',
            post.userSaved ? 'text-emerald-600 dark:text-[#03EF62]' : 'text-pine-900/60 dark:text-slate-300',
          )}
        >
          <Bookmark className={cn('size-4 sm:size-[18px] shrink-0 dark:text-[#03EF62]', post.userSaved && 'fill-current')} />
          <span className="truncate">{post.userSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-canvas-border px-3 pb-1 pt-3 sm:px-4">
          {post.comments.length === 0 && (
            <p className="pb-2 text-center text-[12.5px] text-pine-900/50">প্রথম মন্তব্যটি আপনিই করুন।</p>
          )}
          {post.comments.filter((c) => !c.parentId).map((c) => {
            const replies = post.comments.filter((r) => r.parentId === c.id);
            const isReplying = replyingToId === c.id;
            return (
              <div key={c.id} className="mb-3 space-y-1.5">
                <div className="flex gap-2">
                  <button type="button" onClick={() => onNavigateProfile(c.authorId)} className="shrink-0">
                    <Avatar src={c.avatar} name={c.author} size="size-8" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-canvas-subtle px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onNavigateProfile(c.authorId)}
                        className="block font-bangla text-left hover:underline"
                      >
                        <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white">{c.author}</span>
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
                        <p className="font-bangla text-[13.5px] leading-snug text-slate-800 dark:text-slate-200">
                          {c.text}
                          {c.isEdited && (
                            <span className="ml-1.5 text-[11px] text-slate-400 font-normal">(সম্পাদিত)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 mt-0.5 flex flex-wrap items-center gap-2.5 font-bangla text-[12px] font-medium text-emerald-800 dark:text-emerald-400">
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
                        className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-canvas-subtle p-2"
                      >
                        <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-7" />
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          autoFocus
                          placeholder={`${c.author}-কে উত্তর দিন…`}
                          className="flex-1 bg-transparent font-bangla text-[12.5px] text-slate-900 dark:text-white outline-none"
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
                      <div className="mt-2 pl-3 border-l-2 border-emerald-500/25 dark:border-white/10 space-y-2">
                        {replies.map((r) => (
                          <div key={r.id} className="flex gap-2">
                            <button type="button" onClick={() => onNavigateProfile(r.authorId)} className="shrink-0">
                              <Avatar src={r.avatar} name={r.author} size="size-7" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="rounded-2xl bg-canvas-subtle/80 px-2.5 py-1.5">
                                <button
                                  type="button"
                                  onClick={() => onNavigateProfile(r.authorId)}
                                  className="block font-bangla text-left hover:underline"
                                >
                                  <span className="text-[12px] font-semibold text-slate-900 dark:text-white">{r.author}</span>
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
                                  <p className="font-bangla text-[13px] leading-snug text-slate-800 dark:text-slate-200">
                                    {r.text}
                                    {r.isEdited && (
                                      <span className="ml-1.5 text-[10px] text-slate-400 font-normal">(সম্পাদিত)</span>
                                    )}
                                  </p>
                                )}
                              </div>
                              <div className="ml-2 mt-0.5 flex flex-wrap items-center gap-2 font-bangla text-[11px] font-medium text-emerald-800 dark:text-emerald-400">
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
              </div>
            );
          })}
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
            placeholder="Write a comment…"
            className="flex-1 bg-transparent font-bangla text-[13.5px] text-pine-900 outline-none placeholder:text-pine-900/40"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send"
            className="flex size-7 items-center justify-center rounded-full text-pine-600 disabled:opacity-30"
          >
            <Send className="size-4" />
          </button>
        </div>
      </form>
    </article>
  );
}
