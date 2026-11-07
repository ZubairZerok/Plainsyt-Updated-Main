import { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, Facebook, ExternalLink, Globe } from 'lucide-react';
import { Modal, CloseButton, cn } from './Primitives';
import { toast } from 'sonner';

export interface SharePayload {
  title: string;
  url?: string;
}

export function SharePopoverButton({
  title,
  url,
  children,
  className,
  floating,
}: {
  title: string;
  url?: string;
  children?: React.ReactNode;
  className?: string;
  floating?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://pla.insyt.bd');
  const shareUrl = rawUrl.startsWith('http')
    ? rawUrl
    : typeof window !== 'undefined'
      ? `${window.location.origin}${rawUrl}`
      : `https://pla.insyt.bd${rawUrl}`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      toast.success('Copied', { duration: 1500 });
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      toast.error('লিংক কপি করা যায়নি');
    }
  };

  const handleFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
    if (typeof window !== 'undefined') {
      window.open(fbShareUrl, '_blank', 'noopener,noreferrer,width=620,height=580');
    }
    setOpen(false);
  };

  const handleNative = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });
        setOpen(false);
      } catch {
        // ignore
      }
    }
  };

  const hasNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <div onClick={(e) => { e.stopPropagation(); setOpen((prev) => !prev); }} className="cursor-pointer">
        {children || (
          <button
            type="button"
            className={className || "flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-1.5 sm:py-2 px-1 text-[12px] sm:text-[13.5px] font-semibold text-pine-900/65 dark:text-slate-200 transition hover:bg-canvas-subtle whitespace-nowrap min-w-0 cursor-pointer"}
            aria-label="শেয়ার"
            title="শেয়ার"
          >
            <Share2 className="size-4 sm:size-[19px] shrink-0 dark:text-[#03EF62]" />
            <span className="font-bangla">শেয়ার</span>
          </button>
        )}
      </div>

      {open && (
        <div
          role="toolbar"
          aria-label="Share popup"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute z-50 flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#18213A]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-150',
            floating
              ? 'bottom-[calc(100%+8px)] right-0 origin-bottom-right'
              : 'bottom-[calc(100%+8px)] left-0 sm:left-1/2 sm:-translate-x-1/2 origin-bottom',
          )}
        >
          {/* Facebook */}
          <div className="relative group flex flex-col items-center">
            <button
              type="button"
              onClick={handleFacebook}
              className="flex size-9 items-center justify-center rounded-full bg-[#1877F2] text-white hover:scale-110 active:scale-95 transition-transform shadow-sm cursor-pointer"
              title="Facebook-এ শেয়ার করুন"
              aria-label="Facebook"
            >
              <Facebook className="size-4.5 fill-current" />
            </button>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 dark:bg-black/95 px-2 py-0.5 font-bangla text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
              Facebook
            </span>
          </div>

          {/* Copy Link */}
          <div className="relative group flex flex-col items-center">
            <button
              type="button"
              onClick={handleCopy}
              className="flex size-9 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-110 active:scale-95 transition-transform shadow-sm cursor-pointer"
              title="লিংক কপি করুন"
              aria-label="লিংক কপি"
            >
              {copied ? <Check className="size-4.5 text-[#03EF62]" /> : <Copy className="size-4" />}
            </button>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 dark:bg-black/95 px-2 py-0.5 font-bangla text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
              {copied ? 'কপি হয়েছে' : 'লিংক কপি'}
            </span>
          </div>

          {/* Native share if available */}
          {hasNative && (
            <div className="relative group flex flex-col items-center">
              <button
                type="button"
                onClick={handleNative}
                className="flex size-9 items-center justify-center rounded-full bg-[#03EF62] text-[#061621] hover:scale-110 active:scale-95 transition-transform shadow-sm cursor-pointer"
                title="অন্যান্য অ্যাপে শেয়ার"
                aria-label="Share"
              >
                <Share2 className="size-4" />
              </button>
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 dark:bg-black/95 px-2 py-0.5 font-bangla text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30">
                শেয়ার
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ShareModal({
  open: _open,
  payload: _payload,
  onClose: _onClose,
}: {
  open?: boolean;
  payload?: SharePayload | null;
  onClose?: () => void;
}) {
  // Modal popup system permanently removed per user request: "remove that popup system whle pressing the share button. Totaly delete it. keepthat react style share button"
  return null;
}

