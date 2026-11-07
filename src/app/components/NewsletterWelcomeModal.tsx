import { useState } from 'react';
import { X, Mail, Check, ExternalLink, Sparkles, Send, ShieldCheck, Flame } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subscriberEmail: string;
}

export function NewsletterWelcomeModal({ isOpen, onClose, subscriberEmail }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(window.location.origin);
    setCopied(true);
    toast('Copied', { duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome Newsletter Dispatch"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl border border-[#03EF62]/30 bg-[#061621] text-slate-100 shadow-2xl font-bangla"
      >
        {/* Email Client Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#092231]/95 px-4 sm:px-6 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="size-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="size-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <Mail className="size-4 text-[#03EF62]" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#03EF62]">
              PLAiNSYT Dispatch Preview
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition active:scale-95"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Mail Metadata Header */}
        <div className="border-b border-white/10 bg-[#071a26] px-4 sm:px-6 py-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">From:</span>
              <span className="font-semibold text-white">PLAiNSYT Editorial</span>
              <span className="text-slate-400 font-mono text-[11px]">&lt;dispatch@plainsyt.bd&gt;</span>
            </div>
            <span className="font-mono text-[11px] text-[#03EF62] bg-[#03EF62]/10 border border-[#03EF62]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="size-3" /> Verified Dispatch
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono">To:</span>
            <span className="font-medium text-[#03EF62] font-mono break-all">{subscriberEmail || 'subscriber@domain.com'}</span>
          </div>
          <div className="mt-2 text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>🌾 [PLAiNSYT] স্বাগতম! পরমাণু কৃষি ও স্মার্ট এগ্রোনমি সাপ্তাহিক বিশেষ ডিসপ্যাচ</span>
          </div>
        </div>

        {/* Email Content Body */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* Brand Banner */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-r from-[#03EF62]/20 via-emerald-950/40 to-transparent p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#03EF62] uppercase tracking-wider font-mono mb-1">
              <Sparkles className="size-3.5" />
              <span>Volume 01 · Inaugural Research Briefing</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              স্বাগতম PLAiNSYT এগ্রোনমি নেটওয়ার্কে!
            </h2>
            <p className="mt-2 text-xs sm:text-[13.5px] text-slate-300 leading-relaxed">
              প্রিয় গবেষক ও কৃষিচিন্তক, আপনি এখন যুক্ত হলেন দেশের শীর্ষ কৃষিবিজ্ঞানী, পরমাণু প্রযুক্তিবিদ এবং এগ্রি-টেক গবেষকদের কেন্দ্রীয় প্ল্যাটফর্মে। প্রতি সপ্তাহে সর্বাধিক গুরুত্বপূর্ণ গবেষণাপত্র, মাঠভিত্তিক ফিল্ড ট্রায়াল ও আধুনিক চাষপদ্ধতির বিশ্লেষণ আপনার ঠিকানায় সরাসরি পৌঁছাবে।
            </p>
          </div>

          {/* Featured Article Spotlight */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame className="size-4 text-[#03EF62]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Featured Lead Report · প্রধান প্রতিবেদন
              </h3>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#081d2b] p-4 hover:border-[#03EF62]/50 transition group">
              <div className="flex flex-col sm:flex-row gap-4">
                <img
                  src="https://media.prothomalo.com/prothomalo-bangla%2F2026-10-31%2Fos27skm2%2FBINA.jpeg?rect=1%2C0%2C1599%2C1066&w=622&auto=format%2Ccompress&fmt=avif"
                  alt="BINA Center"
                  className="w-full sm:w-44 h-28 object-cover rounded-lg border border-white/10 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#03EF62]/15 text-[#03EF62] border border-[#03EF62]/30 mb-1.5">
                      পরমাণু কৃষি বিজ্ঞান
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-[#03EF62] transition leading-snug">
                      বিনার গামা রশ্মি বিকিরণ কেন্দ্র উদ্বোধন, কৃষিপণ্যের সংরক্ষণকাল বাড়বে ১২ মাস পর্যন্ত
                    </h4>
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      বাংলাদেশ পরমাণু কৃষি গবেষণা ইনস্টিটিউটের (বিনা) আঞ্চলিক গবেষণাকেন্দ্রে ৫০০ কেসিআই সক্ষমতার গামা ইরেডিয়েশন সেন্টার চালু।
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-white/5">
                    <span className="text-[#03EF62] font-semibold font-mono">৫০০ কেসিআই ক্ষমতা</span>
                    <span className="text-slate-400">৭ মিনিট পাঠ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Quick Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-[#081d2b]/70 p-3.5">
              <div className="text-[11px] font-semibold text-[#03EF62] mb-1">স্মার্ট এগ্রি রোবোটিক্স</div>
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1">
                জাপানের এআই কিউকাম্বার হার্ভেস্টিং রোবট
              </h5>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                রাতে অপ্রয়োজনীয় পাতা ছাঁটাই এবং দিনে স্বয়ংক্রিয়ভাবে পাকা ফসল তোলার মেকাট্রনিক্স ফিল্ড টেস্ট।
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#081d2b]/70 p-3.5">
              <div className="text-[11px] font-semibold text-[#03EF62] mb-1">ডিজিটাল এগ্রোনমি</div>
              <h5 className="text-xs sm:text-sm font-bold text-white mb-1">
                আইওটি মৃত্তিকা সেন্সর ও স্যাটেলাইট স্পেকট্রাল ম্যাপিং
              </h5>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                মাটির পিএইচ ও পানির আর্দ্রতা সরাসরি ক্লাউডে পর্যবেক্ষণ করে সেচের অপচয় ৪০% কমানোর দেশীয় পদ্ধতি।
              </p>
            </div>
          </div>

          {/* Editorial Sign-off */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-white">হাসান জুবায়ের ও PLAiNSYT সম্পাদকীয় দল</p>
              <p className="text-[11px] text-slate-400">বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (বাকৃবি) &amp; গবেষণা সংযোগ</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition active:scale-95 cursor-pointer"
              >
                {copied ? <Check className="size-3.5 text-[#03EF62]" /> : <ExternalLink className="size-3.5" />}
                <span>ওয়েব লিংক কপি</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#03EF62] text-[#061621] font-bold hover:bg-[#02d857] transition active:scale-95 cursor-pointer"
              >
                <Check className="size-3.5" />
                <span>বুঝেছি</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
