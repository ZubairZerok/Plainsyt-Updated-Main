import { useEffect, useRef, useState, type ReactNode } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const cn = (...a: (string | false | null | undefined)[]) => clsx(a);

export const CARD =
  'rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-200';

const TONES = ['bg-pine-100 text-pine-800', 'bg-[#f6e7c8] text-[#6b4a12]', 'bg-[#e8e1f5] text-[#3d2b6b]', 'bg-[#fbe1d8] text-[#7a2e16]', 'bg-[#dcecf5] text-[#163f5c]'];

export function Avatar({
  src, name, size = 'size-10', online, ring, hasStory, className,
}: { src?: string; name?: string; size?: string; online?: boolean; ring?: boolean; hasStory?: boolean; className?: string }) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [src]);

  const s = src || '';
  const isUrl = Boolean(s && (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('/') || s.startsWith('data:')));
  const code0 = s.charCodeAt(0) || 65;
  const code1 = s.charCodeAt(1) || 66;
  const tone = TONES[(code0 + code1) % TONES.length];
  const isPlainsytAvatar = Boolean(
    (name && (name.toLowerCase().includes('plainsyt') || name.includes('প্লেইনসাইট'))) ||
    s.toLowerCase().includes('icon.png') ||
    (s.toLowerCase().includes('plainsyt') && isUrl)
  );

  const fallbackText = typeof name === 'string' && name.trim() ? name.trim() : (typeof s === 'string' && s.trim() && !isUrl ? s.trim() : 'PS');
  const initials = fallbackText
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || (s.slice(0, 2).toUpperCase() || 'PS');

  return (
    <span className={cn('relative inline-flex shrink-0', size, className)}>
      <span
        className={cn(
          'relative flex size-full items-center justify-center overflow-hidden rounded-full font-semibold text-[0.7em] leading-none select-none',
          hasStory
            ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-canvas-card shadow-sm'
            : ring
              ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-canvas-card'
              : 'border border-slate-200/60 dark:border-white/10',
          isPlainsytAvatar ? 'bg-[#03EF62]' : ((!isUrl || loadFailed) && tone),
        )}
      >
        {isUrl && !loadFailed ? (
          <img
            src={s}
            alt={name ?? ''}
            onError={() => setLoadFailed(true)}
            className={cn('size-full text-transparent', isPlainsytAvatar ? 'object-contain p-1' : 'object-cover')}
          />
        ) : (
          <span className="text-[12px] font-bold">{initials}</span>
        )}
      </span>
      {online && (
        <span className="absolute bottom-0 right-0 size-[28%] min-h-2.5 min-w-2.5 rounded-full border-2 border-canvas-card bg-[#03EF62]" />
      )}
    </span>
  );
}

/** Standardized reusable Follow Icon Button across entire SAAS */
export function FollowIconButton({
  isFollowing,
  onClick,
  className,
  title,
  showLabel,
  limeTick,
}: {
  isFollowing: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  title?: string;
  showLabel?: boolean;
  limeTick?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || (isFollowing ? 'অনুসরণ করছেন' : 'ফলো করুন')}
      aria-label={title || (isFollowing ? 'অনুসরণ করছেন' : 'ফলো করুন')}
      className={cn(
        'group relative inline-flex items-center justify-center rounded-full transition-all active:scale-90 shadow-sm shrink-0',
        showLabel ? 'h-8 px-3.5 gap-1.5 text-xs font-bold' : 'size-7',
        isFollowing
          ? (limeTick
              ? 'bg-[#03EF62] text-[#061621] border border-[#03EF62] hover:bg-[#02d857]'
              : 'bg-slate-100 dark:bg-white/15 text-slate-800 dark:text-white border border-slate-200 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/25')
          : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d857] hover:scale-105',
        className,
      )}
    >
      {isFollowing ? (
        <Check className="size-3.5 stroke-[2.8]" />
      ) : (
        <UserPlus className="size-3.5 stroke-[2.8]" />
      )}
      {showLabel && (
        <span className="font-bangla font-bold">{isFollowing ? 'অনুসরণ করছেন' : 'ফলো করুন'}</span>
      )}
    </button>
  );
}

export function VerifiedBadge() {
  return (
    <svg viewBox="0 0 16 16" className="inline size-3.5 shrink-0 text-[#03EF62]" aria-label="Verified">
      <path fill="currentColor" d="M8 0l2 1.6 2.5-.2.7 2.4 2.2 1.3-.9 2.4.9 2.4-2.2 1.3-.7 2.4-2.5-.2L8 16l-2-1.6-2.5.2-.7-2.4L.6 10.9l.9-2.4-.9-2.4 2.2-1.3.7-2.4 2.5.2z" />
      <path fill="none" stroke="var(--canvas-card)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M5 8.2l2 2 4-4.2" />
    </svg>
  );
}

export function Modal({
  open, onClose, children, className, labelledBy, centerOnMobile = false,
}: { open: boolean; onClose: () => void; children: ReactNode; className?: string; labelledBy?: string; centerOnMobile?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog (first real control, not the backdrop button).
    queueMicrotask(() => (focusables().find((el) => el.getAttribute('aria-label') !== 'Close') ?? panelRef.current)?.focus());
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] flex justify-center',
        centerOnMobile ? 'items-center p-3 sm:p-4' : 'items-end sm:items-center sm:p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button aria-label="Close" className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div ref={panelRef} tabIndex={-1} className={cn('relative max-h-[92dvh] w-full overflow-y-auto outline-none', className)}>{children}</div>
    </div>
  );
}

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className={cn('flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95', className)}
    >
      <X className="size-4" />
    </button>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500', className)}>{children}</p>
  );
}

/** Strict Hind Siliguri Bold 700 wrapper for numbers */
export function Num({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('font-bangla font-bold tracking-normal', className)}>
      {children}
    </span>
  );
}

export const FEED_CARD =
  'border-y border-slate-200/70 dark:border-white/10 bg-canvas-card sm:rounded-2xl sm:border sm:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] transition-all duration-200';

