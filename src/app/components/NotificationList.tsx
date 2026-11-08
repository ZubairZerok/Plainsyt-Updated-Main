import { useEffect, useRef, useState } from 'react';
import {
  AtSign, Bell, Check, CheckCheck, CornerDownRight, Heart, MessageCircle, MoreHorizontal, Newspaper, Trash2, UserPlus,
} from 'lucide-react';
import type { NotificationItem } from '../types';
import { Avatar, cn } from './Primitives';
import { formatRelativeBn } from '../lib/mappers';
import { actionText, actorsText, contextText, groupByTime, isUnread, notificationSentence } from '../lib/notifications';

const KIND: Record<string, { icon: typeof Heart; cls: string }> = {
  reaction: { icon: Heart, cls: 'bg-rose-500' },
  comment: { icon: MessageCircle, cls: 'bg-sky-500' },
  reply: { icon: CornerDownRight, cls: 'bg-indigo-500' },
  mention: { icon: AtSign, cls: 'bg-violet-500' },
  follow: { icon: UserPlus, cls: 'bg-emerald-600' },
  new_article: { icon: Newspaper, cls: 'bg-amber-500' },
  system: { icon: Bell, cls: 'bg-slate-500' },
  bookmark: { icon: Bell, cls: 'bg-slate-500' },
};

/** Re-render every minute so "৫ মিনিট আগে" stays true while the list is open. */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

function ActorStack({ n, size }: { n: NotificationItem; size: 'sm' | 'md' }) {
  const actors = n.actors?.length ? n.actors : [{ id: n.actorId || '', name: n.actorName || n.source || 'PS', avatar: n.actorAvatar || '' }];
  const kind = KIND[n.type ?? 'system'] ?? KIND.system;
  const Icon = kind.icon;
  const box = size === 'md' ? 'size-12' : 'size-11';
  return (
    <div className={cn('relative shrink-0', box)}>
      {actors.length > 1 && (n.actorCount ?? 1) > 1 ? (
        <>
          <span className="absolute right-0 top-0 rounded-full">
            <Avatar src={actors[1].avatar} name={actors[1].name} size={size === 'md' ? 'size-9' : 'size-8'} />
          </span>
          <span className="absolute bottom-0 left-0 rounded-full bg-canvas-card p-[2px]">
            <Avatar src={actors[0].avatar} name={actors[0].name} size={size === 'md' ? 'size-9' : 'size-8'} />
          </span>
        </>
      ) : (
        <Avatar src={actors[0].avatar} name={actors[0].name} size={size === 'md' ? 'size-12' : 'size-11'} />
      )}
      <span
        aria-hidden
        className={cn(
          'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-canvas-card',
          kind.cls,
        )}
      >
        <Icon className="size-3" strokeWidth={2.6} />
      </span>
    </div>
  );
}

function RowMenu({
  unread, onToggleRead, onDelete,
}: { unread: boolean; onToggleRead?: () => void; onDelete?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      } else if (!ref.current?.contains(e.target as Node)) setOpen(false);
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
  if (!onToggleRead && !onDelete) return null;
  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="বিজ্ঞপ্তির অপশন"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-canvas-subtle hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-xl bg-canvas-card py-1 shadow-xl ring-1 ring-canvas-border animate-in fade-in zoom-in-95 duration-100"
        >
          {onToggleRead && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onToggleRead();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-bangla text-[13px] font-semibold text-slate-800 hover:bg-canvas-subtle dark:text-slate-100"
            >
              <Check className="size-4" /> {unread ? 'পড়া হয়েছে চিহ্নিত করুন' : 'অপঠিত চিহ্নিত করুন'}
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-bangla text-[13px] font-semibold text-rose-600 hover:bg-canvas-subtle dark:text-rose-400"
            >
              <Trash2 className="size-4" /> বিজ্ঞপ্তিটি সরান
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export interface NotificationListProps {
  items: NotificationItem[];
  variant?: 'panel' | 'page';
  onOpen: (n: NotificationItem) => void;
  onToggleRead?: (id: string, isRead: boolean) => void;
  onDelete?: (id: string) => void;
  /** Show "ফলো ব্যাক" on follow notifications from people you don't follow yet. */
  followingIds?: string[];
  onFollowBack?: (userId: string) => void;
  emptyTitle?: string;
  emptyText?: string;
}

export function NotificationList({
  items, variant = 'page', onOpen, onToggleRead, onDelete, followingIds, onFollowBack,
  emptyTitle = 'সব শান্ত এখানে',
  emptyText = 'কেউ আপনার পোস্টে প্রতিক্রিয়া, মন্তব্য বা ফলো করলে এখানে সাথে সাথে দেখা যাবে।',
}: NotificationListProps) {
  const now = useNow();
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-canvas-subtle text-accent-fg">
          <CheckCheck className="size-7" />
        </span>
        <p className="mt-3 font-bangla text-[15px] font-bold text-slate-900 dark:text-white">{emptyTitle}</p>
        <p className="mt-1 max-w-xs font-bangla text-[13px] text-slate-500 dark:text-slate-400">{emptyText}</p>
      </div>
    );
  }
  const sections = groupByTime(items, now);
  return (
    <div className={variant === 'page' ? 'space-y-5' : 'space-y-2'}>
      {sections.map((s) => (
        <section key={s.bucket} aria-label={s.label}>
          <h3
            className={cn(
              'px-3 pb-1.5 font-bangla font-bold text-slate-900 dark:text-white',
              variant === 'page' ? 'text-[15px]' : 'pt-1 text-[13px]',
            )}
          >
            {s.label}
          </h3>
          <ul className="space-y-0.5">
            {s.items.map((n) => {
              const unread = isUnread(n);
              const ctx = contextText(n);
              const action = actionText(n);
              const followBack =
                n.type === 'follow' && (n.actorCount ?? 1) === 1 && n.actorId && onFollowBack && followingIds && !followingIds.includes(n.actorId);
              return (
                <li key={n.id}>
                  <div
                    role="link"
                    tabIndex={0}
                    aria-label={`${notificationSentence(n)}${unread ? ' (অপঠিত)' : ''}`}
                    onClick={() => onOpen(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpen(n);
                      }
                    }}
                    className={cn(
                      'group relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 outline-none transition',
                      'focus-visible:ring-2 focus-visible:ring-[#03EF62]',
                      unread ? 'bg-emerald-50 hover:bg-emerald-100/70 dark:bg-[#03EF62]/[0.07] dark:hover:bg-[#03EF62]/[0.12]' : 'hover:bg-canvas-subtle',
                    )}
                  >
                    <ActorStack n={n} size={variant === 'page' ? 'md' : 'sm'} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bangla text-[13.5px] leading-snug text-slate-800 dark:text-slate-100">
                        {action ? (
                          <>
                            <strong className="font-bold text-slate-900 dark:text-white">{actorsText(n)}</strong> {action}
                          </>
                        ) : (
                          n.message || n.title
                        )}
                      </p>
                      {ctx && (
                        <p className="mt-0.5 line-clamp-2 break-words font-bangla text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                          “{ctx}”
                        </p>
                      )}
                      <p className={cn('mt-1 font-bangla text-[12px] font-semibold', unread ? 'text-accent-fg' : 'text-slate-500 dark:text-slate-400')}>
                        {formatRelativeBn(n.updatedAt || n.createdAt, now) || n.time}
                      </p>
                      {followBack && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFollowBack!(n.actorId!);
                          }}
                          className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-[#03EF62] px-3.5 font-bangla text-[12.5px] font-bold text-[#061621] transition hover:bg-[#02d857] active:scale-95"
                        >
                          <UserPlus className="size-3.5" /> ফলো ব্যাক করুন
                        </button>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <RowMenu
                        unread={unread}
                        onToggleRead={onToggleRead ? () => onToggleRead(n.id, unread) : undefined}
                        onDelete={onDelete ? () => onDelete(n.id) : undefined}
                      />
                      {unread && <span aria-hidden className="size-2.5 rounded-full bg-[#03EF62] shadow-[0_0_0_3px_rgba(3,239,98,0.18)]" />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
