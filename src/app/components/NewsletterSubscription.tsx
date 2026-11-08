import { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { dbSubscribeNewsletter } from '../lib/db';
import { cn } from './Primitives';

interface Props {
  className?: string;
  variant?: 'card' | 'inline' | 'compact';
}

export function NewsletterSubscription({ className, variant = 'card' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setStatus('error');
      setMessage('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন');
      return;
    }

    setStatus('loading');
    try {
      const res = await dbSubscribeNewsletter(cleanEmail);
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    } catch {
      setStatus('error');
      setMessage('দুঃখিত, সংযোগে ত্রুটি ঘটেছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3 font-bangla', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="size-4 text-[#03EF62]" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">সাপ্তাহিক নিউজলেটার</h4>
        </div>
        {status === 'success' ? (
          <p className="text-[11px] text-emerald-600 dark:text-[#03EF62] flex items-center gap-1">
            <CheckCircle2 className="size-3.5 shrink-0" /> {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-1.5">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
              placeholder="আপনার ইমেইল..."
              className="flex-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/30 px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-[#03EF62]"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-lg bg-[#03EF62] px-2.5 py-1 text-xs font-bold text-[#061621] hover:bg-[#02d955] transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {status === 'loading' ? <Loader2 className="size-3.5 animate-spin" /> : 'যুক্ত হোন'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#061621] via-[#092231] to-[#041c14] p-5 sm:p-7 text-white shadow-lg font-bangla',
        className,
      )}
      aria-label="Newsletter Subscription"
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#03EF62]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 max-w-xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#03EF62]/15 border border-[#03EF62]/30 px-3 py-1 text-xs font-semibold text-[#03EF62] mb-3">
          <Sparkles className="size-3.5" />
          <span>PLAiNSYT সরাসরি আপডেট</span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-2 leading-snug">
          কৃষিপ্রযুক্তি ও গবেষণার সেরা প্রতিবেদন সরাসরি আপনার ইনবক্সে
        </h3>

        <p className="text-xs sm:text-[13px] text-white/75 leading-relaxed mb-5 max-w-md mx-auto">
          সাপ্তাহিক নতুন পরমাণু কৃষি গবেষণা, স্মার্ট রোবোটিক্স, ন্যানো টেকনোলজি ও আধুনিক চাষপদ্ধতির বিশ্লেষণমূলক প্রতিবেদন পেতে সাবস্ক্রাইব করুন। কোনো স্প্যাম নেই।
        </p>

        {status === 'success' ? (
          <div className="rounded-xl border border-[#03EF62]/40 bg-[#03EF62]/15 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="size-6 text-[#03EF62] mx-auto mb-1.5" />
            <p className="text-sm font-bold text-white mb-0.5">ধন্যবাদ!</p>
            <p className="text-xs text-white/85">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="আপনার ইমেইল লিখুন (e.g. name@domain.com)"
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-2.5 text-xs sm:text-[13px] text-white placeholder-white/50 backdrop-blur-sm outline-none focus:border-[#03EF62] focus:bg-white/15 transition"
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#03EF62] hover:bg-[#02d955] px-5 py-2.5 text-xs sm:text-[13px] font-bold text-[#061621] shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>যুক্ত হচ্ছে…</span>
                </>
              ) : (
                <>
                  <span>সাবস্ক্রাইব করুন</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-2.5 text-xs text-rose-400 font-medium">{message}</p>
        )}

        <p className="mt-3 font-mono text-[11px] text-white/40">
          যেকোনো সময় এক ক্লিকে আনসাবস্ক্রাইব করা যাবে · 100% Privacy Protected
        </p>
      </div>
    </section>
  );
}

