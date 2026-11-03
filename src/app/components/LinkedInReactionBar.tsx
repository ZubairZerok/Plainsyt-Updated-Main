import React, { useEffect, useRef, useState } from 'react';
import type { LinkedInReactionType, ReactionCounts, ReactionRecord } from '../types';
import { LINKEDIN_REACTIONS, getReactionMeta, topReactionTypes, totalReactions, toBengaliNumerals } from '../utils/pureLogic';
import { Avatar, CloseButton, Modal, cn } from './Primitives';

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
        <svg viewBox="0 0 20 20" className="size-[62%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M2 10.5a1.5 1.5 0 1 1 3 0v6a1.5 1.5 0 0 1-3 0v-6zM6 10.2c0-.5.3-1 .8-1.2l3.4-1.7V4a2 2 0 0 1 2-2c.6 0 1.1.4 1.2 1l.6 4h3.5a2 2 0 0 1 2 2.3l-1.3 6.5A2 2 0 0 1 16.2 17H7a1 1 0 0 1-1-1v-5.8z" />
        </svg>
      )}
      {type === 'insightful' && (
        /* Lightbulb — Learned something new */
        <svg viewBox="0 0 20 20" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M10 2a6 6 0 0 0-4 10.5V14a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.5A6 6 0 0 0 10 2zm-2 14h4v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1z" />
        </svg>
      )}
      {type === 'support' && (
        /* Handshake — Backing the initiative, project, or policy stance */
        <svg viewBox="0 0 24 24" className="size-[66%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M21.7 8.3a2.5 2.5 0 0 0-3.5 0l-2.7 2.7-2.1-2.1a2.5 2.5 0 0 0-3.5 0L7.4 11.4 4.9 8.9a1.5 1.5 0 0 0-2.1 2.1l3.5 3.5a1.5 1.5 0 0 0 2.1 0l3-3 2.1 2.1a2.5 2.5 0 0 0 3.5 0l4.7-4.7a2.5 2.5 0 0 0 0-3.5zM3.5 14.5l2.5 2.5a2.5 2.5 0 0 0 3.5 0l2.2-2.2-2.1-2.1-2.2 2.2a1.5 1.5 0 0 1-2.1 0l-1.8-1.8a1.5 1.5 0 0 0-2.1 2.1l2.1-0.7z" />
        </svg>
      )}
      {type === 'celebrate' && (
        /* Clapping Hands / Trophy — For milestones, breakthroughs, or success stories */
        <svg viewBox="0 0 20 20" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M15 3h1.5A2.5 2.5 0 0 1 19 5.5V6a3.5 3.5 0 0 1-3.5 3.5H15a5 5 0 0 1-4 4.9V16h2a1 1 0 0 1 1 1v1H6v-1a1 1 0 0 1 1-1h2v-1.6A5 5 0 0 1 5 9.5H4.5A3.5 3.5 0 0 1 1 6v-.5A2.5 2.5 0 0 1 3.5 3H5V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1zm0 2V3H5v2h10zM3.5 5a.5.5 0 0 0-.5.5V6a1.5 1.5 0 0 0 1.5 1.5H5V5h-1.5zm13 0H15v2.5h.5A1.5 1.5 0 0 0 17 6v-.5a.5.5 0 0 0-.5-.5z" />
        </svg>
      )}
      {type === 'curious' && (
        /* Magnifying Glass — Want to see more data / follow-ups on this */
        <svg viewBox="0 0 20 20" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M9 3a6 6 0 1 0 3.7 10.7l4.3 4.3a1 1 0 0 0 1.4-1.4l-4.3-4.3A6 6 0 0 0 9 3zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
          <circle cx="9" cy="9" r="1.5" />
        </svg>
      )}
      {type === 'love' && (
        <svg viewBox="0 0 16 16" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M8 13.7 2.5 8.3C1 6.8 1 4.3 2.5 2.8c1.5-1.5 3.9-1.5 5.5 0 1.6-1.5 4-1.5 5.5 0 1.5 1.5 1.5 4 0 5.5L8 13.7z" />
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
        {countLabel && <span className="font-bangla font-bold text-[12px] opacity-90">({countLabel})</span>}
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
