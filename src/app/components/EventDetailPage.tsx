import { useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Share2,
  Ticket,
  Users,
  CheckCircle2,
  Award,
  Sparkles,
  BookOpen,
  Coffee,
  Check,
} from 'lucide-react';
import type { UpcomingEvent } from '../types';
import { cn } from './Primitives';

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

  // Resolve event from prop or lookup by ID from list
  const activeEvent: UpcomingEvent =
    propEvent ||
    (eventId && events?.find((e) => e.id === eventId)) || {
      id: eventId || 'event-default',
      title: 'জাতীয় কৃষি উদ্ভাবন ও এগ্রো-টেক সম্মেলন ২০২৬',
      location: 'কৃষিবিদ ইনস্টিটিউশন বাংলাদেশ (KIB), ফার্মগেট, ঢাকা',
      dateMonth: 'MAR',
      dateDay: '28',
      attendeesCount: 240,
      isRegistered: false,
      organizerName: 'PLAiNSYT Research & Agritech Forum',
      description:
        'বাংলাদেশের কৃষিবিজ্ঞান, প্রিসিশন প্রযুক্তি ও আধুনিক কৃষি উদ্যোক্তাদের মিলনমেলা। দেশের শীর্ষ গবেষক ও কৃষিবিজ্ঞানীদের নিয়ে বিশেষ আলোচনা সভা ও মাঠ প্রদর্শনী।',
    };

  const isRegistered = propIsRegistered ?? activeEvent.isRegistered ?? false;

  const handleShare = () => {
    if (onShare) {
      onShare(activeEvent.title);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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

      {/* Main Event Card */}
      <div className="overflow-hidden rounded-2xl border border-[#061621] bg-canvas shadow-tactile-lg">
        {/* Banner with Sleek Dark Forest Gradient */}
        <div className="relative bg-gradient-to-r from-[#061621] via-[#092215] to-[#041a10] p-6 text-white sm:p-10 border-b border-[#061621]">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="rounded-md bg-[#03EF62] px-2.5 py-1 font-bold text-[#061621]">
              {activeEvent.dateMonth} {activeEvent.dateDay}, 2026
            </span>
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-white/90">
              {activeEvent.organizerName || 'PLAiNSYT Research Forum'}
            </span>
            <span className="rounded-md bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-emerald-300">
              সরাসরি অফলাইন ইভেন্ট
            </span>
          </div>

          <h1 className="mt-4 font-bangla text-[26px] font-bold leading-tight text-white sm:text-[34px]">
            {activeEvent.title}
          </h1>

          <p className="mt-3 max-w-2xl font-bangla text-[15px] leading-relaxed text-white/80">
            {activeEvent.description ||
              'বাংলাদেশের কৃষিবিজ্ঞান, প্রিসিশন প্রযুক্তি ও আধুনিক কৃষি উদ্যোক্তাদের মিলনমেলা।'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/15 pt-5 text-[13px] text-white/90">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-[#03EF62]" /> {activeEvent.dateMonth}{' '}
              {activeEvent.dateDay}, ২০২৬
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-[#03EF62]" /> সকাল ০৯:৩০ — বিকাল ০৫:০০
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 text-[#03EF62]" /> {activeEvent.location}
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11.5px]">
              <Users className="size-4 text-[#03EF62]" /> {activeEvent.attendeesCount} জন নিবন্ধিত
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Registration Status & CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#061621] bg-[#03EF62]/10 p-5">
            <div>
              <p className="font-bangla text-[17px] font-bold text-[#061621]">
                {isRegistered ? 'আপনি এই ইভেন্টে রেজিস্টার্ড আছেন' : 'ইভেন্টে আসন সংখ্যা সীমিত'}
              </p>
              <p className="font-bangla text-[13px] text-pine-900/75">
                {isRegistered
                  ? 'আপনার কনফার্মেশন পাস ও কিউআর কোড প্রস্তুত রয়েছে।'
                  : 'অংশগ্রহণকারী গবেষক, শিক্ষার্থী ও কৃষকদের জন্য সার্টিফিকেট, কিট ও রিফ্রেশমেন্ট প্রদান করা হবে।'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenRegister(activeEvent)}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-xl border border-[#061621] px-6 font-bangla text-[15px] font-bold shadow-tactile-xs transition',
                isRegistered
                  ? 'bg-canvas text-[#061621] hover:bg-canvas-subtle'
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

          {/* Schedule / Agenda */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[#03EF62]" />
              <h2 className="font-bangla text-[20px] font-bold text-[#061621]">
                ইভেন্টের পূর্ণাঙ্গ কর্মসূচি ও সেশন
              </h2>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="rounded-xl border border-canvas-border bg-canvas-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    সকাল ০৯:৩০ — ১১:০০
                  </span>
                  <span className="text-[11px] font-mono font-bold text-pine-600">SESSION 01</span>
                </div>
                <p className="mt-2 font-bangla text-[15px] font-bold text-pine-900">
                  মাঠ প্রদর্শনী ও আধুনিক জাত পরিচিতি
                </p>
                <p className="mt-1 font-bangla text-[13px] text-pine-900/70 leading-relaxed">
                  জলবায়ু সহনশীল শস্য (BINA ও BRRI জাতসমূহ), ভাসমান হাইড্রোপনিক্স এবং ড্রোন স্প্রে প্রযুক্তির বাস্তব প্রয়োগ।
                </p>
              </div>

              <div className="rounded-xl border border-canvas-border bg-canvas-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    সকাল ১১:১৫ — দুপুর ০১:০০
                  </span>
                  <span className="text-[11px] font-mono font-bold text-pine-600">SESSION 02</span>
                </div>
                <p className="mt-2 font-bangla text-[15px] font-bold text-pine-900">
                  কৃষি বিজ্ঞানী ও উদ্যোক্তা সংলাপ
                </p>
                <p className="mt-1 font-bangla text-[13px] text-pine-900/70 leading-relaxed">
                  কৃষি পণ্যের সঠিক মূল্য প্রাপ্তি, সৌর কোল্ড স্টোরেজ সংরক্ষণ এবং বাজার সংযোগ কর্মশালা।
                </p>
              </div>

              <div className="rounded-xl border border-canvas-border bg-canvas-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    দুপুর ০২:০০ — ০৩:৩০
                  </span>
                  <span className="text-[11px] font-mono font-bold text-pine-600">SESSION 03</span>
                </div>
                <p className="mt-2 font-bangla text-[15px] font-bold text-pine-900">
                  আইওটি ও প্রিসিশন এগ্রিকালচার কেস স্টাডি
                </p>
                <p className="mt-1 font-bangla text-[13px] text-pine-900/70 leading-relaxed">
                  মাটির আর্দ্রতা সেন্সর ও এনপিকে কিট ব্যবহার করে সার খরচ কমানোর সফল ফিল্ড রেজাল্ট।
                </p>
              </div>

              <div className="rounded-xl border border-canvas-border bg-canvas-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    বিকাল ০৩:৪৫ — ০৫:০০
                  </span>
                  <span className="text-[11px] font-mono font-bold text-pine-600">SESSION 04</span>
                </div>
                <p className="mt-2 font-bangla text-[15px] font-bold text-pine-900">
                  প্রশ্নোত্তর পর্ব ও সার্টিফিকেট বিতরণ
                </p>
                <p className="mt-1 font-bangla text-[13px] text-pine-900/70 leading-relaxed">
                  অংশগ্রহণকারীদের মুক্ত প্রশ্নোত্তর, বিশেষজ্ঞ পরামর্শ এবং অফিশিয়াল পার্টিসিপেশন সার্টিফিকেট প্রদান।
                </p>
              </div>
            </div>
          </div>

          {/* Perks & Features */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-subtle p-3.5">
              <Award className="size-5 text-[#03EF62] shrink-0" />
              <div>
                <p className="font-bangla text-[13px] font-bold text-pine-900">সার্টিফিকেট প্রদান</p>
                <p className="font-bangla text-[11.5px] text-pine-900/70">অংশগ্রহণকারীদের সনদপত্র</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-subtle p-3.5">
              <BookOpen className="size-5 text-[#03EF62] shrink-0" />
              <div>
                <p className="font-bangla text-[13px] font-bold text-pine-900">রিসার্চ কিট ও হ্যান্ডআউট</p>
                <p className="font-bangla text-[11.5px] text-pine-900/70">গবেষণা পুস্তিকা ও গাইড</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-canvas-border bg-canvas-subtle p-3.5">
              <Coffee className="size-5 text-[#03EF62] shrink-0" />
              <div>
                <p className="font-bangla text-[13px] font-bold text-pine-900">রিফ্রেশমেন্ট ও লাঞ্চ</p>
                <p className="font-bangla text-[11.5px] text-pine-900/70">চা-নাস্তা ও নেটওয়ার্কিং লাঞ্চ</p>
              </div>
            </div>
          </div>

          {/* Venue & Directions */}
          <div className="rounded-xl border border-[#061621] bg-canvas-subtle p-5 font-bangla text-[14px] text-pine-900/80 leading-relaxed">
            <p className="font-bold text-pine-950 mb-1 flex items-center gap-1.5">
              <MapPin className="size-4 text-[#03EF62]" /> ভেন্যু ও আগমন নির্দেশিকা:
            </p>
            <p>
              অনুষ্ঠানের নির্ধারিত সময়ের ১৫ মিনিট আগে ভেন্যুর অভ্যর্থনা ডেস্কে উপস্থিত হয়ে আপনার টিকিটের ডিজিটাল বা প্রিন্ট কপি দেখিয়ে এন্ট্রি ব্যাজ সংগ্রহ করুন। ভেন্যুতে পার্কিং ও ওয়াই-ফাই সুবিধা থাকবে।
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
