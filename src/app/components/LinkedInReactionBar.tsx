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
  const isIdea = type === 'insightful';
  const isLike = type === 'like';

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
      {isLike && (
        /* Heart icon from reaction-buttons.html */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      {isIdea && (
        /* Bulb icon from reaction-buttons.html */
        <svg viewBox="0 0 24 24" className="size-[68%] overflow-visible fill-none stroke-current stroke-2 drop-shadow-xs" aria-hidden>
          <g className="stroke-[1.8]"><path d="M12 -.2V-2.4M17.8 2.2l1.55-1.55M6.2 2.2L4.65.65M20.2 8h2.2M3.8 8H1.6"/></g>
          <path className="fill-current stroke-current" d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.3 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path className="stroke-current" d="M9 18h6M10 22h4"/>
        </svg>
      )}
      {!isLike && !isIdea && (
        /* Fallback standard */
        <svg viewBox="0 0 24 24" className="size-[64%] fill-current drop-shadow-xs" aria-hidden>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
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
  showLabel,
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
  /** Show the reaction name beside the icon (action-bar style, matches Comment/Share/Save). */
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<LinkedInReactionType | null>(null);
  const [burstDots, setBurstDots] = useState<Array<{ x: number; y: number }>>([]);
  const [burstKind, setBurstKind] = useState<LinkedInReactionType | null>(null);
  const [rollDir, setRollDir] = useState<'up' | 'down' | ''>('');
  const [btnHovered, setBtnHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number>();
  const closeTimer = useRef<number>();
  const didLongPress = useRef(false);
  const pointerId = useRef<number | null>(null);

  const triggerBurst = (kind: LinkedInReactionType) => {
    const isIdea = kind === 'insightful';
    const n = isIdea ? 6 : 8;
    const dots: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + (isIdea ? -Math.PI / 2 : 0);
      const d = isIdea ? 24 : 22;
      dots.push({ x: Math.round(Math.cos(a) * d), y: Math.round(Math.sin(a) * d) });
    }
    setBurstDots(dots);
    setBurstKind(kind);
    setRollDir('up');
    window.setTimeout(() => {
      setBurstDots([]);
      setBurstKind(null);
    }, 700);
  };

  const openMenu = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
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
    if (userReaction === type) {
      setRollDir('down');
    } else {
      triggerBurst(type);
    }
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
    select(userReaction ?? 'like');
  };

  const activeMeta = userReaction ? getReactionMeta(userReaction) : null;
  const isIdea = userReaction === 'insightful';

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
        'absolute z-50 flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#18213A]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-md',
        floating
          ? 'bottom-[calc(100%+10px)] right-0 origin-bottom-right'
          : 'bottom-[calc(100%+10px)] left-0 origin-bottom-left',
        'animate-in fade-in zoom-in-95 duration-150',
      )}
    >
      {LINKEDIN_REACTIONS.map((r) => {
        const isIdeaOption = r.type === 'insightful';
        const isCurrent = userReaction === r.type;
        const isHoveredOrActive = hovered === r.type;
        return (
          <div key={r.type} className="relative flex flex-col items-center">
            {isHoveredOrActive && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 dark:bg-black/95 px-2.5 py-0.5 font-bangla text-[11px] font-bold text-white shadow-md pointer-events-none animate-in fade-in zoom-in-90 duration-100 z-30">
                {r.labelBn}
              </div>
            )}
            <button
              type="button"
              data-reaction-type={r.type}
              data-kind={isIdeaOption ? 'idea' : 'like'}
              aria-pressed={isCurrent}
              onPointerEnter={() => setHovered(r.type)}
              onPointerLeave={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                select(r.type);
              }}
              className={cn(
                'react-btn !p-2 !rounded-full transition-transform duration-150 ease-out cursor-pointer',
                isHoveredOrActive ? '!scale-125' : isCurrent ? '!scale-110' : 'hover:scale-110',
              )}
              title={r.labelBn}
              aria-label={r.labelBn}
            >
              <span className="react-ico-wrap">
                <svg className="react-ico" viewBox="0 0 24 24" aria-hidden="true">
                  {isIdeaOption ? (
                    <>
                      <g className="react-rays">
                        <path d="M12 -.2V-2.4M17.8 2.2l1.55-1.55M6.2 2.2L4.65.65M20.2 8h2.2M3.8 8H1.6" />
                      </g>
                      <path
                        className={cn('react-glass', isCurrent && 'fill-current stroke-current')}
                        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.3 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
                      />
                      <path className="stroke-current" d="M9 18h6M10 22h4" />
                    </>
                  ) : (
                    <path
                      className={cn('react-heart', isCurrent && 'fill-current stroke-current')}
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                  )}
                </svg>
              </span>
            </button>
          </div>
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
          data-kind={isIdea ? 'idea' : 'like'}
          aria-pressed={!!userReaction}
          aria-label={activeMeta ? activeMeta.labelBn : 'লাইক'}
          title={activeMeta ? activeMeta.labelBn : 'লাইক'}
          className={cn('react-btn !p-2 !rounded-full', className)}
        >
          <span className={cn('react-ico-wrap', burstKind ? 'anim-on' : '')}>
            <svg className="react-ico" viewBox="0 0 24 24" aria-hidden="true">
              {isIdea ? (
                <>
                  <g className="react-rays">
                    <path d="M12 -.2V-2.4M17.8 2.2l1.55-1.55M6.2 2.2L4.65.65M20.2 8h2.2M3.8 8H1.6" />
                  </g>
                  <path
                    className="react-glass"
                    d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.3 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
                  />
                  <path className="stroke-current" d="M9 18h6M10 22h4" />
                </>
              ) : (
                <path
                  className="react-heart"
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              )}
            </svg>
            {burstDots.length > 0 && (
              <>
                {burstDots.map((d, i) => (
                  <span
                    key={i}
                    className="react-dot"
                    style={{ '--x': `${d.x}px`, '--y': `${d.y}px` } as React.CSSProperties}
                  />
                ))}
                <span className="react-ring" />
              </>
            )}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onMouseLeave={scheduleClose}
    >
      {tray}

      {btnHovered && !open && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 dark:bg-black/95 px-2.5 py-0.5 font-bangla text-[11px] font-bold text-white shadow-md pointer-events-none animate-in fade-in zoom-in-90 duration-100 z-30 hidden sm:block">
          {activeMeta ? activeMeta.labelBn : 'লাইক'}
        </div>
      )}

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClick}
        onContextMenu={(e) => e.preventDefault()}
        onMouseEnter={() => {
          setBtnHovered(true);
          window.clearTimeout(holdTimer.current);
          holdTimer.current = window.setTimeout(openMenu, 480);
        }}
        onMouseLeave={() => {
          setBtnHovered(false);
          scheduleClose();
        }}
        title={activeMeta ? activeMeta.labelBn : 'লাইক'}
        aria-label={activeMeta ? activeMeta.labelBn : 'লাইক'}
        data-kind={isIdea ? 'idea' : 'like'}
        aria-pressed={!!userReaction}
        className={cn(
          'react-btn',
          compact ? '!h-6 !px-2 !py-0 !text-xs' : countLabel ? '!px-2.5 !py-1.5' : '!p-2',
          className,
        )}
      >
        <span className={cn('react-ico-wrap', burstKind ? 'anim-on' : '')}>
          <svg className="react-ico" viewBox="0 0 24 24" aria-hidden="true">
            {isIdea ? (
              <>
                <g className="react-rays">
                  <path d="M12 -.2V-2.4M17.8 2.2l1.55-1.55M6.2 2.2L4.65.65M20.2 8h2.2M3.8 8H1.6" />
                </g>
                <path
                  className="react-glass"
                  d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.3 1.5 3.5.7.7 1.3 1.5 1.5 2.5"
                />
                <path className="stroke-current" d="M9 18h6M10 22h4" />
              </>
            ) : (
              <path
                className="react-heart"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            )}
          </svg>
          {burstDots.length > 0 && (
            <>
              {burstDots.map((d, i) => (
                <span
                  key={i}
                  className="react-dot"
                  style={{ '--x': `${d.x}px`, '--y': `${d.y}px` } as React.CSSProperties}
                />
              ))}
              <span className="react-ring" />
            </>
          )}
        </span>
        {showLabel && (
          <span className="truncate font-bangla text-[12px] font-semibold sm:text-[13.5px]">
            {activeMeta ? activeMeta.labelBn : 'লাইক'}
          </span>
        )}
        {countLabel && (
          <span className="react-count font-bangla font-bold text-[12px]">
            <span className={cn('react-num', rollDir)}>
              <Num>{countLabel}</Num>
            </span>
          </span>
        )}
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
