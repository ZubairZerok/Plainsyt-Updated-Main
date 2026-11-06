import React, { useEffect, useRef, useState } from 'react';
import type { LinkedInReactionType, ReactionCounts, ReactionRecord } from '../types';
import { LINKEDIN_REACTIONS, getReactionMeta, topReactionTypes, totalReactions, toBengaliNumerals } from '../utils/pureLogic';
import { Avatar, CloseButton, Modal, Num, cn } from './Primitives';

export function LinkedInReactionBadge({
  type,
  size = 'size-5',
  className,
}: {
  type: LinkedInReactionType;
  size?: string;
  className?: string;
}) {
  const meta = getReactionMeta(type);
  return (
    <span
      title={meta.label}
      style={{ backgroundColor: meta.bg }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full text-white select-none shadow-sm transition-transform',
        size,
        className,
      )}
    >
      {type === 'like' && (
        /* Thumbs Up — Standard agreement */
        <svg viewBox="0 0 24 24" className="size-[62%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M2 20h2V8H2v12zm19.5-9c-.3-.3-.7-.5-1.1-.5H14l1.1-5.3c.1-.5 0-1-.3-1.4-.3-.4-.7-.6-1.2-.6h-1c-.3 0-.6.1-.8.3L7.3 10.3C7.1 10.5 7 10.7 7 11v9c0 1.1.9 2 2 2h8.5c.8 0 1.5-.5 1.8-1.2l2.3-5.4c.2-.4.2-.9 0-1.4z" />
        </svg>
      )}
      {type === 'celebrate' && (
        /* Clapping Hands / Applause — For milestones and breakthroughs */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M18.5 2.5c-1.1 0-2 .9-2 2 0 .4.1.7.3 1L14 8.3 11.6 6c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4L12.5 10l-3.2-3.2c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4L11 11.4 7.6 8c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l4.2 4.2c-.7.6-1.4 1.4-1.9 2.3l-3-1.8c-.5-.3-1.2-.2-1.5.3-.3.5-.2 1.2.3 1.5l4.3 2.6c1.3 2.1 3.6 3.5 6.2 3.5 4.1 0 7.5-3.4 7.5-7.5 0-2.3-1-4.4-2.7-5.8.4-.5.6-1.1.6-1.7 0-1.1-.9-2-2-2z" />
        </svg>
      )}
      {type === 'support' && (
        /* Heart-in-Hands — Backing the initiative or solidarity */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 .71-.11 1.4-.3 2.05-.6-.3-1.27-.45-1.95-.45-2.76 0-5 2.24-5 5 0 .93.26 1.8.72 2.55-1.07.72-2.39 1.25-3.47 1.7zm10-3.35c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5 5-2.24 5-5zm-3 1h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z" />
        </svg>
      )}
      {type === 'insightful' && (
        /* Luminous Lightbulb — Thought-leadership and valuable insights */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 2a7 7 0 00-7 7c0 2.4 1.2 4.5 3 5.7V17c0 .6.4 1 1 1h6c.6 0 1-.4 1-1v-2.3c1.8-1.3 3-3.4 3-5.7a7 7 0 00-7-7zm2 15h-4v-1h4v1zm0-2h-4v-1h4v1zm1.3-4.7l-.3.3V13h-4v-1.4l-.3-.3A5 5 0 1115.3 10.3z" />
        </svg>
      )}
      {type === 'love' && (
        /* Heart — Strong emotional connection and love */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      {type === 'curious' && (
        /* Thinking Curious Face — Curious to learn or investigate more */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3-9c.83 0 1.5-.67 1.5-1.5S9.83 8 9 8s-1.5.67-1.5 1.5S8.17 11 9 11zm6 0c.83 0 1.5-.67 1.5-1.5S15.83 8 15 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-3 4c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      )}
    </span>
  );
}

export function LinkedInReactionSummary({
  counts,
  fallbackTotal = 0,
  userReaction,
  onOpenBreakdown,
  rightSlot,
  className,
}: {
  counts?: ReactionCounts;
  fallbackTotal?: number;
  userReaction?: LinkedInReactionType | null;
  onOpenBreakdown?: () => void;
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  const total = totalReactions(counts, fallbackTotal);
  const topTypes = topReactionTypes(counts);

  if (total === 0 && !rightSlot) return null;

  return (
    <div className={cn('flex items-center justify-between text-[12px] font-bangla text-slate-500 dark:text-slate-400', className)}>
      {total > 0 ? (
        <button
          type="button"
          onClick={onOpenBreakdown}
          className="group inline-flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <span className="flex -space-x-1">
            {topTypes.map((t) => (
              <LinkedInReactionBadge
                key={t}
                type={t}
                size="size-[17px]"
                className="ring-1.5 ring-white dark:ring-[#071f2d]"
              />
            ))}
          </span>
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {userReaction
              ? total > 1
                ? `আপনি এবং আরও ${toBengaliNumerals(total - 1)} জন`
                : 'আপনি প্রতিক্রিয়া জানিয়েছেন'
              : `${toBengaliNumerals(total)}টি প্রতিক্রিয়া`}
          </span>
        </button>
      ) : (
        <span className="font-bangla text-[11px] text-slate-400">প্রথম প্রতিক্রিয়া দিন</span>
      )}
      {rightSlot}
    </div>
  );
}

/**
 * Facebook-style press-and-hold reaction picker.
 * Quick tap = like (or toggle active). Hold ~350ms = tray pops with bounce.
 */
export function LinkedInReactionPickerButton({
  userReaction,
  onSelect,
  countLabel,
  compact,
  iconOnly,
  floating,
  className,
}: {
  userReaction?: LinkedInReactionType | null;
  onSelect: (type: LinkedInReactionType) => void;
  countLabel?: string;
  compact?: boolean;
  /** Icon-only trigger (reel side stack) */
  iconOnly?: boolean;
  /** Open tray upward over dark video chrome */
  floating?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<LinkedInReactionType | null>(null);
  const [burst, setBurst] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number>();
  const closeTimer = useRef<number>();
  const didLongPress = useRef(false);
  const pointerId = useRef<number | null>(null);

  const openMenu = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    setBurst(true);
    window.setTimeout(() => setBurst(false), 420);
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setHovered(null);
    }, 180);
  };

  const cancelHold = () => {
    window.clearTimeout(holdTimer.current);
  };

  const select = (type: LinkedInReactionType) => {
    onSelect(type);
    setOpen(false);
    setHovered(null);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHovered(null);
      }
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    didLongPress.current = false;
    pointerId.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    holdTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      openMenu();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.(12);
        } catch {
          /* ignore */
        }
      }
    }, 350);
  };

  const pickFromPoint = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    const btn = el?.closest('[data-reaction-type]') as HTMLElement | null;
    const type = btn?.dataset.reactionType as LinkedInReactionType | undefined;
    if (type) setHovered(type);
    return type;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!didLongPress.current || !open) return;
    pickFromPoint(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    cancelHold();
    if (pointerId.current !== null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(pointerId.current);
      } catch {
        /* ignore */
      }
      pointerId.current = null;
    }
    if (didLongPress.current) {
      const picked = pickFromPoint(e.clientX, e.clientY) || hovered;
      if (picked) select(picked);
      e.preventDefault();
      return;
    }
  };

  const onPointerCancel = () => {
    cancelHold();
    pointerId.current = null;
  };

  const onClick = (e: React.MouseEvent) => {
    if (didLongPress.current) {
      e.preventDefault();
      e.stopPropagation();
      didLongPress.current = false;
      return;
    }
    onSelect(userReaction ?? 'like');
  };

  const activeMeta = userReaction ? getReactionMeta(userReaction) : null;

  const tray = open && (
    <div
      role="toolbar"
      aria-label="Reactions"
      onMouseEnter={() => {
        window.clearTimeout(closeTimer.current);
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      className={cn(
        'absolute z-50 flex items-end gap-0.5 rounded-full border border-white/20 bg-white px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.28)] dark:bg-[#0b1a14] dark:border-white/10',
        floating
          ? 'bottom-[calc(100%+10px)] right-0 origin-bottom-right'
          : 'bottom-[calc(100%+10px)] left-0 origin-bottom-left',
        burst ? 'fb-reaction-tray-in' : '',
      )}
    >
      {LINKEDIN_REACTIONS.map((r, i) => {
        const isHot = hovered === r.type || userReaction === r.type;
        return (
          <button
            key={r.type}
            type="button"
            data-reaction-type={r.type}
            style={{ animationDelay: `${i * 35}ms` }}
            onPointerEnter={() => setHovered(r.type)}
            onPointerLeave={() => setHovered(null)}
            onClick={(e) => {
              e.stopPropagation();
              select(r.type);
            }}
            className={cn(
              'fb-reaction-emoji relative flex size-10 items-center justify-center rounded-full transition-transform duration-150 ease-out will-change-transform',
              isHot ? 'scale-[1.45] -translate-y-3 z-10' : 'scale-100 translate-y-0',
            )}
            aria-label={`${r.label} (${r.labelBn})`}
          >
            {isHot && (
              <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#061621] px-2.5 py-1 text-center font-bangla shadow-2xl ring-1 ring-white/15 z-40">
                <span className="block text-[11px] font-bold text-white leading-tight">{r.labelBn}</span>
                <span className="block text-[9.5px] font-medium text-slate-300 leading-tight">{r.desc}</span>
              </span>
            )}
            <LinkedInReactionBadge type={r.type} size="size-9" className="shadow-md ring-2 ring-white/90" />
          </button>
        );
      })}
    </div>
  );

  if (iconOnly) {
    return (
      <div ref={rootRef} className="relative inline-flex" onMouseLeave={scheduleClose}>
        {tray}
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClick={onClick}
          onContextMenu={(e) => e.preventDefault()}
          aria-pressed={!!userReaction}
          className={cn(className)}
        >
          <LinkedInReactionBadge type={userReaction ?? 'like'} size="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onMouseEnter={() => {
        /* desktop: hover opens like FB desktop after a beat */
      }}
      onMouseLeave={scheduleClose}
    >
      {tray}

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        onMouseEnter={() => {
          window.clearTimeout(holdTimer.current);
          holdTimer.current = window.setTimeout(openMenu, 480);
        }}
        aria-pressed={!!userReaction}
        style={activeMeta ? { color: activeMeta.color } : undefined}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-sans font-semibold transition-all hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 select-none touch-manipulation',
          compact ? 'text-[11.5px] px-2 py-0.5' : 'text-[13px]',
          !activeMeta && 'text-slate-600 dark:text-slate-300',
          className,
        )}
      >
        {activeMeta ? (
          <LinkedInReactionBadge type={activeMeta.type} size={compact ? 'size-3.5' : 'size-[18px]'} />
        ) : (
          <LinkedInReactionBadge
            type="like"
            size={compact ? 'size-3.5' : 'size-[18px]'}
            className="!bg-slate-200 dark:!bg-white/10 !text-slate-600 dark:!text-slate-300"
          />
        )}
        <span>{activeMeta ? activeMeta.labelBn : 'লাইক'}</span>
        {countLabel && <span className="font-bangla font-bold text-[12px] opacity-90">(<Num>{countLabel}</Num>)</span>}
      </button>
    </div>
  );
}

export function ReactionBreakdownModal({
  open,
  onClose,
  records,
  counts,
  onNavigateProfile,
}: {
  open: boolean;
  onClose: () => void;
  records: ReactionRecord[];
  counts?: ReactionCounts;
  onNavigateProfile: (userId: string) => void;
}) {
  const [tab, setTab] = useState<'all' | LinkedInReactionType>('all');
  const filtered = tab === 'all' ? records : records.filter((r) => r.type === tab);

  return (
    <Modal open={open} onClose={onClose} className="max-w-[460px]" labelledBy="rx-modal-title">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-canvas-border px-5 py-4">
          <h3 id="rx-modal-title" className="font-display text-[18px] font-bold text-slate-900 dark:text-white">
            প্রতিক্রিয়া তালিকা (Reactions)
          </h3>
          <CloseButton onClick={onClose} />
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-canvas-border px-4 py-2.5 bg-slate-50/50 dark:bg-white/5">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={cn(
              'rounded-full px-3 py-1 text-[12px] font-semibold transition',
              tab === 'all'
                ? 'bg-[#061621] text-white shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:text-slate-900',
            )}
          >
            সকল ({toBengaliNumerals(records.length || totalReactions(counts))})
          </button>
          {LINKEDIN_REACTIONS.map((r) => {
            const c = counts?.[r.type] || records.filter((x) => x.type === r.type).length;
            if (!c) return null;
            return (
              <button
                key={r.type}
                type="button"
                onClick={() => setTab(r.type)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition',
                  tab === r.type
                    ? 'bg-[#061621] text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300',
                )}
              >
                <LinkedInReactionBadge type={r.type} size="size-3.5" />
                <span>{toBengaliNumerals(c)}</span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center font-bangla text-[13px] text-slate-400">
              এই বিভাগে এখনো কোনো প্রতিক্রিয়া রেকর্ড নেই।
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateProfile(r.userId);
                    }}
                    className="relative shrink-0"
                  >
                    <Avatar src={r.userAvatar || 'US'} name={r.userName} size="size-9" />
                    <LinkedInReactionBadge
                      type={r.type}
                      size="size-3.5"
                      className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-[#071f2d]"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateProfile(r.userId);
                      }}
                      className="block truncate text-left font-bangla text-[13.5px] font-semibold text-slate-900 dark:text-white hover:underline"
                    >
                      {r.userName}
                    </button>
                    <p className="truncate font-sans text-[11px] text-slate-500">{r.userRole}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
