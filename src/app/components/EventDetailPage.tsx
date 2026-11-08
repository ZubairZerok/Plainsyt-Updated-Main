import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, CalendarDays, MapPin, Share2, Ticket, Users, CheckCircle2, Check, ExternalLink } from 'lucide-react';
import type { UpcomingEvent } from '../types';
import { cn } from './Primitives';
import { safeUrl } from '../lib/mappers';

interface Props {
  eventId?: string;
  event?: UpcomingEvent;
  events?: UpcomingEvent[];
  isRegistered?: boolean;
  onBack?: () => void;
  onNavigate?: (path: string) => void;
  onOpenRegister: (event: UpcomingEvent) => void;
  onShare?: (title: string) => void;
}

export function EventDetailPage({
  eventId,
  event: propEvent,
  events,
  isRegistered: propIsRegistered,
  onBack,
  onNavigate,
  onOpenRegister,
  onShare,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Resolve event from prop or lookup by ID from list. Unknown ids show a real "not found" page.
  const activeEvent: UpcomingEvent | undefined = propEvent || (eventId ? events?.find((e) => e.id === eventId) : undefined);

  if (!activeEvent) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center font-bangla dark:border-white/10 dark:bg-canvas-card">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">ইভেন্টটি পাওয়া যায়নি</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">এই ইভেন্টটি বর্তমানে নেই বা মুছে ফেলা হয়েছে।</p>
        <button
          type="button"
          onClick={() => (onBack ? onBack() : onNavigate?.('/events'))}
          className="mt-4 inline-flex h-10 items-center rounded-lg bg-pine-900 px-4 text-[13.5px] font-semibold text-canvas"
        >
          সব ইভেন্ট দেখুন
        </button>
      </section>
    );
  }

  const isRegistered = propIsRegistered ?? activeEvent.isRegistered ?? false;

  const handleShare = () => {
    if (onShare) {
      onShare(activeEvent.title);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          setCopied(true);
          toast.success('Copied', { duration: 1500 });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => toast.error('লিংক কপি করা যায়নি'));
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('/events');
    } else {
      window.history.back();
    }
  };

  return (
    <article className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Top back bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#061621] bg-canvas-card px-3.5 py-2 font-bangla text-[13px] font-semibold text-[#061621] shadow-tactile-xs hover:bg-canvas-subtle transition"
        >
          <ArrowLeft className="size-4" /> সকল ইভেন্টে ফিরুন
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 rounded-xl border border-canvas-border bg-canvas-card px-3.5 py-1.5 text-[12.5px] font-semibold text-pine-900 shadow-sm hover:bg-canvas-subtle transition"
        >
          {copied ? (
            <>
              <Check className="size-4 text-emerald-600" /> লিংক কপি হয়েছে!
            </>
          ) : (
            <>
              <Share2 className="size-4 text-pine-700" /> শেয়ার করুন
            </>
          )}
        </button>
      </div>

      {/* Main Event Card: only real event data is shown */}
      <div className="overflow-hidden rounded-2xl border border-canvas-border bg-canvas-card shadow-tactile-lg">
        <div className="relative border-b border-white/10 bg-gradient-to-r from-[#061621] via-[#092215] to-[#041a10] p-6 text-white sm:p-10">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="rounded-md bg-[#03EF62] px-2.5 py-1 font-bold text-[#061621]">
              {activeEvent.dateMonth} {activeEvent.dateDay}
            </span>
            {activeEvent.organizerName && (
              <span className="rounded-md bg-white/10 px-2.5 py-1 text-white/90">{activeEvent.organizerName}</span>
            )}
          </div>

          <h1 className="mt-4 break-words font-bangla text-[26px] font-bold leading-tight text-white sm:text-[34px]">
            {activeEvent.title}
          </h1>

          {activeEvent.description && (
            <p className="mt-3 max-w-2xl whitespace-pre-line break-words font-bangla text-[15px] leading-relaxed text-white/85">
              {activeEvent.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/15 pt-5 text-[13px] text-white/90">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-[#03EF62]" /> {activeEvent.dateMonth} {activeEvent.dateDay}
            </span>
            {activeEvent.location && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-4 shrink-0 text-[#03EF62]" /> <span className="break-words">{activeEvent.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="size-4 shrink-0 text-[#03EF62]" /> {activeEvent.attendeesCount} জন নিবন্ধিত
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-canvas-border bg-pine-50 p-5">
            <p className="font-bangla text-[17px] font-bold text-pine-950">
              {isRegistered ? 'আপনি এই ইভেন্টে রেজিস্টার্ড আছেন' : 'এই ইভেন্টে অংশ নিতে নিবন্ধন করুন'}
            </p>
            <button
              type="button"
              onClick={() => onOpenRegister(activeEvent)}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl border border-[#061621] px-6 font-bangla text-[15px] font-bold shadow-tactile-xs transition',
                isRegistered
                  ? 'bg-canvas-card text-pine-950 hover:bg-canvas-subtle'
                  : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d955]',
              )}
            >
              {isRegistered ? (
                <>
                  <CheckCircle2 className="size-5 text-emerald-600" /> টিকিট ও তথ্য দেখুন
                </>
              ) : (
                <>
                  <Ticket className="size-5" /> এখনই নিবন্ধন করুন
                </>
              )}
            </button>
          </div>

          {safeUrl(activeEvent.externalLink) && (
            <a
              href={safeUrl(activeEvent.externalLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-xl border border-canvas-border bg-canvas-subtle px-4 py-3 font-bangla text-[14px] font-semibold text-pine-950 hover:bg-canvas-border/40"
            >
              <span className="min-w-0 truncate">ইভেন্টের অফিসিয়াল পেজ</span>
              <ExternalLink className="size-4 shrink-0" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
