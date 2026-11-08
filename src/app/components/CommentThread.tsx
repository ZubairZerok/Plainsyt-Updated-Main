import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownRight, MoreHorizontal, Pencil, Send, Trash2, X } from 'lucide-react';
import type { Comment, LinkedInReactionType, UserProfile } from '../types';
import { Avatar, cn } from './Primitives';
import { LinkedInReactionPickerButton } from './LinkedInReactionBar';
import { getReactionMeta, toBengaliNumerals } from '../utils/pureLogic';
import { deepLinkCommentId } from '../lib/notifications';

/**
 * One threaded comment list used everywhere (post cards, article cards, article reader, reel player).
 * Mobile-first: avatars align to the bubble top, compact 12px action links with real tap targets,
 * owner actions tucked behind a "⋯" menu, long reply chains collapse, inline reply composer.
 */

type Tone = 'default' | 'dark';

export interface CommentThreadProps {
  comments: Comment[];
  currentUser: UserProfile | null;
  onNavigateProfile: (userId: string) => void;
  /** Post a reply. Omit to hide "উত্তর দিন" (or pass onRequestReply to use an external composer). */
  onReply?: (text: string, parentId: string, replyToAuthor: string) => void;
  /** Use an external composer instead of the inline one (e.g. the reel drawer's footer input). */
  onRequestReply?: (parent: Comment, mentionAuthor: string) => void;
  onEdit?: (commentId: string, newText: string) => void;
  onDelete?: (commentId: string) => void;
  onReact?: (commentId: string, type: LinkedInReactionType) => void;
  /** Called when a signed-out user tries to act. */
  onRequireAuth?: () => void;
  tone?: Tone;
  /** How many top-level comments to show before "আরও দেখুন". */
  initialVisible?: number;
  emptyText?: string;
  className?: string;
}

const REPLIES_PREVIEW = 2;

const toneCls = (tone: Tone) =>
  tone === 'dark'
    ? {
        bubble: 'bg-white/[0.07] ring-1 ring-white/10',
        name: 'text-white',
        text: 'text-white/90',
        meta: 'text-white/70',
        action: 'text-white/80 hover:text-[#03EF62]',
        line: 'border-white/15',
        composer: 'bg-white/10 ring-white/15 text-white placeholder:text-white/60',
        menu: 'bg-[#0b1f2b] ring-white/10 text-white',
        menuItem: 'hover:bg-white/10',
        chip: 'bg-[#0b1f2b] ring-white/15 text-white',
        empty: 'text-white/70',
      }
    : {
        bubble: 'bg-canvas-subtle ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
        name: 'text-slate-900 dark:text-white',
        text: 'text-slate-800 dark:text-slate-100',
        meta: 'text-slate-500 dark:text-slate-400',
        action: 'text-slate-600 hover:text-accent-fg dark:text-slate-300 dark:hover:text-[#03EF62]',
        line: 'border-slate-200 dark:border-white/10',
        composer: 'bg-canvas-subtle ring-canvas-border text-slate-900 dark:text-white',
        menu: 'bg-canvas-card ring-canvas-border text-slate-800 dark:text-slate-100',
        menuItem: 'hover:bg-canvas-subtle',
        chip: 'bg-canvas-card ring-canvas-border text-slate-700 dark:text-slate-200',
        empty: 'text-slate-500 dark:text-slate-400',
      };

/** Highlight a leading "@Name " mention. */
function CommentText({ text, mention, className }: { text: string; mention?: string; className?: string }) {
  if (mention && text.startsWith(`@${mention}`)) {
    return (
      <p className={className}>
        <span className="font-semibold text-accent-fg dark:text-[#03EF62]">@{mention}</span>
        {text.slice(mention.length + 1)}
      </p>
    );
  }
  return <p className={className}>{text}</p>;
}

function OwnerMenu({ tone, onEdit, onDelete }: { tone: Tone; onEdit?: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = toneCls(tone);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
        return;
      }
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  if (!onEdit && !onDelete) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="মন্তব্যের অপশন"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn('flex size-7 items-center justify-center rounded-full transition', t.action)}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-full z-40 mt-1 min-w-[9rem] overflow-hidden rounded-xl py-1 shadow-xl ring-1 animate-in fade-in zoom-in-95 duration-100',
            t.menu,
          )}
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className={cn('flex w-full items-center gap-2 px-3 py-2 text-left font-bangla text-[13px] font-semibold', t.menuItem)}
            >
              <Pencil className="size-3.5" /> সম্পাদনা
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className={cn('flex w-full items-center gap-2 px-3 py-2 text-left font-bangla text-[13px] font-semibold text-rose-600 dark:text-rose-400', t.menuItem)}
            >
              <Trash2 className="size-3.5" /> মুছে ফেলুন
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Composer({
  tone,
  currentUser,
  initial,
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  avatar = true,
}: {
  tone: Tone;
  currentUser: UserProfile | null;
  initial: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  avatar?: boolean;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const t = toneCls(tone);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);
  const send = () => {
    const clean = value.trim();
    if (!clean) return;
    onSubmit(clean);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="mt-2 flex items-start gap-2"
    >
      {avatar && (
        <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-7" className="mt-0.5 shrink-0" />
      )}
      <div className={cn('min-w-0 flex-1 rounded-2xl px-3 py-1.5 ring-1 focus-within:ring-2 focus-within:ring-[#03EF62]/70', t.composer)}>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            } else if (e.key === 'Escape') {
              onCancel();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="block min-h-0 w-full resize-none bg-transparent py-1 font-bangla text-[14px] leading-snug outline-none"
        />
        <div className="flex items-center justify-end gap-1 pb-0.5">
          <button
            type="button"
            onClick={onCancel}
            className={cn('rounded-full px-2.5 py-1 font-bangla text-[12px] font-semibold', t.action)}
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-[#03EF62] px-3 py-1 font-bangla text-[12px] font-bold text-[#061621] transition hover:bg-[#02d857] active:scale-95 disabled:opacity-60"
          >
            <Send className="size-3.5" /> {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  c,
  isReply,
  props,
  editingId,
  setEditingId,
  onStartReply,
  flash,
  mention,
}: {
  c: Comment;
  isReply: boolean;
  flash?: boolean;
  mention?: string;
  props: CommentThreadProps;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onStartReply: (c: Comment) => void;
}) {
  const tone = props.tone ?? 'default';
  const t = toneCls(tone);
  const mine = Boolean(props.currentUser?.id && c.authorId && props.currentUser.id === c.authorId);
  const reactionTotal = c.reactionCounts
    ? Object.values(c.reactionCounts).reduce((s, n) => s + (Number(n) || 0), 0)
    : c.likes;
  const topMeta = c.userReaction ? getReactionMeta(c.userReaction) : null;
  const canReply = Boolean(props.onReply || props.onRequestReply);
  const editing = editingId === c.id;

  return (
    <div id={`comment-${c.id}`} className="flex scroll-mt-24 items-start gap-2">
      <button
        type="button"
        onClick={() => props.onNavigateProfile(c.authorId)}
        aria-label={`${c.author} এর প্রোফাইল`}
        className="mt-0.5 shrink-0 self-start rounded-full !min-h-0 !min-w-0"
      >
        <Avatar src={c.avatar} name={c.author} size={isReply ? 'size-7' : 'size-8'} />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <Composer
            tone={tone}
            currentUser={props.currentUser}
            initial={c.text}
            placeholder="মন্তব্য সম্পাদনা করুন…"
            submitLabel="সংরক্ষণ"
            avatar={false}
            onCancel={() => setEditingId(null)}
            onSubmit={(text) => {
              if (text !== c.text) props.onEdit?.(c.id, text);
              setEditingId(null);
            }}
          />
        ) : (
          <div className="flex items-start gap-1">
            <div className="relative min-w-0 max-w-full">
              <div
                className={cn(
                  'inline-block max-w-full rounded-2xl px-3 py-2 transition-shadow duration-700',
                  t.bubble,
                  flash && 'shadow-[0_0_0_3px_rgba(3,239,98,0.85)]',
                )}
              >
                <button
                  type="button"
                  onClick={() => props.onNavigateProfile(c.authorId)}
                  className={cn('block max-w-full truncate text-left font-bangla text-[13px] font-bold leading-tight hover:underline !min-h-0', t.name)}
                >
                  {c.author}
                </button>
                <CommentText
                  text={c.text}
                  mention={mention}
                  className={cn('mt-0.5 whitespace-pre-wrap break-words font-bangla text-[14px] leading-[1.55]', t.text)}
                />
              </div>
              {reactionTotal > 0 && (
                <span
                  className={cn(
                    'absolute -bottom-2.5 right-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold shadow-sm ring-1',
                    t.chip,
                  )}
                  aria-label={`${toBengaliNumerals(reactionTotal)}টি প্রতিক্রিয়া`}
                >
                  <span aria-hidden>{topMeta?.emoji ?? '👍'}</span>
                  {toBengaliNumerals(reactionTotal)}
                </span>
              )}
            </div>
            {mine && (props.onEdit || props.onDelete) && (
              <OwnerMenu
                tone={tone}
                onEdit={props.onEdit ? () => setEditingId(c.id) : undefined}
                onDelete={props.onDelete ? () => props.onDelete?.(c.id) : undefined}
              />
            )}
          </div>
        )}

        {!editing && (
          <div className={cn('mt-0.5 flex flex-wrap items-center gap-x-3.5 pl-3 font-bangla text-[12px]', t.meta)}>
            <span className="font-medium">
              {c.timestamp || 'এখন'}
              {c.isEdited && <span className="ml-1">· সম্পাদিত</span>}
            </span>
            {props.onReact && (
              <span className={cn('inline-flex min-h-7 items-center', t.action)}>
                <LinkedInReactionPickerButton
                  textOnly
                  userReaction={c.userReaction}
                  onSelect={(type) => (props.currentUser ? props.onReact?.(c.id, type) : props.onRequireAuth?.())}
                />
              </span>
            )}
            {canReply && (
              <button
                type="button"
                onClick={() => (props.currentUser ? onStartReply(c) : props.onRequireAuth?.())}
                className={cn('inline-flex min-h-7 items-center font-bold', t.action)}
              >
                উত্তর দিন
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread(props: CommentThreadProps) {
  const { comments, tone = 'default', initialVisible = 4, emptyText = 'এখনো কোনো মন্তব্য নেই — প্রথম মন্তব্যটি আপনিই করুন।' } = props;
  const t = toneCls(tone);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ parentId: string; mention: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});

  const [flashId, setFlashId] = useState<string | null>(null);
  const handledLink = useRef<string | null>(null);

  // "@Name …" — longest matching participant name in this list.
  const names = useMemo(
    () => [...new Set(comments.map((c) => c.author).filter(Boolean))].sort((a, b) => b.length - a.length),
    [comments],
  );
  const mentionOf = (text: string) => (text.startsWith('@') ? names.find((n) => text.startsWith(`@${n}`)) : undefined);

  // Notification deep link (?c=<comment id>): reveal, scroll to and briefly highlight that comment.
  useEffect(() => {
    const id = deepLinkCommentId();
    if (!id || handledLink.current === id) return;
    const target = comments.find((c) => c.id === id);
    if (!target) return;
    handledLink.current = id;
    setShowAll(true);
    if (target.parentId) setOpenReplies((s) => ({ ...s, [target.parentId!]: true }));
    setFlashId(id);
    const t1 = window.setTimeout(
      () => document.getElementById(`comment-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      400,
    );
    const t2 = window.setTimeout(() => setFlashId(null), 4000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [comments]);

  const { roots, byParent } = useMemo(() => {
    const roots: Comment[] = [];
    const byParent = new Map<string, Comment[]>();
    const ids = new Set(comments.map((c) => c.id));
    for (const c of comments) {
      // Orphaned replies (parent deleted) are shown as top-level so they never vanish.
      if (c.parentId && ids.has(c.parentId)) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    }
    return { roots, byParent };
  }, [comments]);

  if (roots.length === 0) {
    return <p className={cn('py-3 text-center font-bangla text-[13px]', t.empty, props.className)}>{emptyText}</p>;
  }

  const visible = showAll ? roots : roots.slice(0, initialVisible);
  const hidden = roots.length - visible.length;

  const startReply = (parent: Comment, target: Comment) => {
    // Replies are one level deep: replying to a reply threads under the same root, @mentioning its author.
    if (props.onRequestReply) {
      props.onRequestReply(parent, target.author);
      return;
    }
    setOpenReplies((s) => ({ ...s, [parent.id]: true }));
    setReplyTo({ parentId: parent.id, mention: target.author });
  };

  return (
    <div className={cn('space-y-4', props.className)}>
      {visible.map((c) => {
        const replies = byParent.get(c.id) ?? [];
        const expanded = openReplies[c.id] || replies.length <= REPLIES_PREVIEW;
        const shownReplies = expanded ? replies : replies.slice(-REPLIES_PREVIEW);
        const hiddenReplies = replies.length - shownReplies.length;
        const replying = replyTo?.parentId === c.id;
        return (
          <div key={c.id}>
            <CommentItem
              c={c}
              isReply={false}
              flash={flashId === c.id}
              mention={mentionOf(c.text)}
              props={props}
              editingId={editingId}
              setEditingId={setEditingId}
              onStartReply={(target) => startReply(c, target)}
            />
            {(replies.length > 0 || replying) && (
              <div className={cn('ml-4 mt-2 space-y-3 border-l-2 pl-4 sm:ml-[1.125rem]', t.line)}>
                {hiddenReplies > 0 && (
                  <button
                    type="button"
                    onClick={() => setOpenReplies((s) => ({ ...s, [c.id]: true }))}
                    className={cn('inline-flex min-h-7 items-center gap-1.5 font-bangla text-[12.5px] font-bold', t.action)}
                  >
                    <CornerDownRight className="size-3.5" />
                    আরও {toBengaliNumerals(hiddenReplies)}টি উত্তর দেখুন
                  </button>
                )}
                {shownReplies.map((r) => (
                  <CommentItem
                    key={r.id}
                    c={r}
                    isReply
                    flash={flashId === r.id}
                    mention={mentionOf(r.text)}
                    props={props}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    onStartReply={(target) => startReply(c, target)}
                  />
                ))}
                {replying && props.onReply && (
                  <Composer
                    key={`${c.id}-${replyTo?.mention}`}
                    tone={tone}
                    currentUser={props.currentUser}
                    initial={`@${replyTo!.mention} `}
                    placeholder={`${replyTo!.mention}-কে উত্তর দিন…`}
                    submitLabel="উত্তর"
                    onCancel={() => setReplyTo(null)}
                    onSubmit={(text) => {
                      props.onReply?.(text, c.id, replyTo!.mention);
                      setReplyTo(null);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={cn('inline-flex min-h-9 items-center gap-1.5 font-bangla text-[13px] font-bold', t.action)}
        >
          আরও {toBengaliNumerals(hidden)}টি মন্তব্য দেখুন
        </button>
      )}
      {showAll && roots.length > initialVisible && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={cn('ml-3 inline-flex min-h-9 items-center gap-1 font-bangla text-[12.5px] font-semibold', t.meta)}
        >
          <X className="size-3.5" /> কম দেখান
        </button>
      )}
    </div>
  );
}
