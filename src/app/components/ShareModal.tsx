import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Facebook, ExternalLink, Globe } from 'lucide-react';
import { Modal, CloseButton, cn } from './Primitives';
import { toast } from 'sonner';

export interface SharePayload {
  title: string;
  url?: string;
}

export function ShareModal({
  open,
  payload,
  onClose,
}: {
  open: boolean;
  payload: SharePayload | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  if (!payload) return null;

  const rawUrl = payload.url || (typeof window !== 'undefined' ? window.location.href : 'https://pla.insyt.bd');
  const shareUrl = rawUrl.startsWith('http')
    ? rawUrl
    : typeof window !== 'undefined'
      ? `${window.location.origin}${rawUrl}`
      : `https://pla.insyt.bd${rawUrl}`;

  const handleCopyLink = async () => {
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
      toast.success('লিংক কপি করা হয়েছে', {
        description: payload.title,
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2400);
    } catch {
      toast.error('লিংক কপি করা যায়নি');
    }
  };

  const handleShareFacebook = () => {
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(payload.title)}`;
    if (typeof window !== 'undefined') {
      window.open(fbShareUrl, '_blank', 'noopener,noreferrer,width=620,height=580');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: payload.title,
          text: payload.title,
          url: shareUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="p-5 sm:p-6 space-y-5 bg-[#061621] text-white border border-white/15 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#03EF62]/15 text-[#03EF62] border border-[#03EF62]/30">
              <Share2 className="size-4.5" />
            </div>
            <div>
              <h2 className="font-bangla font-bold text-base text-white">শেয়ার করুন</h2>
              <p className="font-bangla text-xs text-slate-400">ফেসবুকে পোস্ট করুন অথবা সরাসরি লিংক কপি করুন</p>
            </div>
          </div>
          <CloseButton onClick={onClose} className="border border-white/15 text-white hover:bg-white/10" />
        </div>

        {/* Content Snippet */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-1">
          <span className="font-mono text-[10px] text-[#03EF62] uppercase tracking-wider">PLAiNSYT Knowledge Share</span>
          <p className="font-bangla text-sm font-semibold text-white/90 line-clamp-2">
            {payload.title}
          </p>
        </div>

        {/* Main Action 1: Share on Facebook */}
        <button
          type="button"
          onClick={handleShareFacebook}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-98 text-white py-3 px-4 font-bangla font-bold text-sm shadow-md transition cursor-pointer"
        >
          <Facebook className="size-5 fill-current" />
          <span>ফেসবুকে শেয়ার করুন (Share on Facebook)</span>
          <ExternalLink className="size-4 opacity-75 ml-1" />
        </button>

        {/* Main Action 2: Copy Link Input & Button */}
        <div className="space-y-1.5">
          <label className="font-bangla text-xs font-semibold text-slate-300">সরাসরি লিংক</label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 p-1.5 focus-within:border-[#03EF62] transition">
            <Globe className="size-4 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 bg-transparent font-mono text-xs text-slate-200 outline-none px-1 truncate select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold font-bangla transition active:scale-95 shrink-0 cursor-pointer',
                copied
                  ? 'bg-[#03EF62] text-[#061621] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-[#03EF62] hover:text-[#061621]',
              )}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 stroke-[3]" />
                  <span>কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>লিংক কপি করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional Native Share for mobile devices */}
        {hasNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 active:scale-98 text-slate-300 py-2.5 px-4 font-bangla text-xs font-medium transition cursor-pointer"
          >
            <Share2 className="size-3.5" />
            <span>অন্যান্য অ্যাপে পাঠান (WhatsApp, Messenger, ইত্যাদিতে)</span>
          </button>
        )}
      </div>
    </Modal>
  );
}

