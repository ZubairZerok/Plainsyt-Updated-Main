import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Eye, FileText, Mail, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Article, UserProfile } from '../types';
import { isEditorialAuthorized } from '../lib/auth';
import { dbGetNewsletterSubscribers } from '../lib/db';
import { csvCell } from '../lib/csv';
import { Num } from './Primitives';
import { toBengaliNumerals } from '../utils/pureLogic';

interface Props {
  currentUser: UserProfile | null;
  articles: Article[];
  onNavigate: (path: string) => void;
}

export function EditorialDashboard({ currentUser, articles, onNavigate }: Props) {
  const [subscribers, setSubscribers] = useState<Array<{ email: string; createdAt: string }>>([]);
  const isAuthorized = isEditorialAuthorized(currentUser);

  useEffect(() => {
    if (isAuthorized) dbGetNewsletterSubscribers().then(setSubscribers);
  }, [isAuthorized]);

  const totalViews = useMemo(() => articles.reduce((sum, a) => sum + (a.stats?.views || 0), 0), [articles]);
  const topArticles = useMemo(
    () => [...articles].sort((a, b) => (b.stats?.views || 0) - (a.stats?.views || 0)).slice(0, 10),
    [articles],
  );

  const exportSubscribers = () => {
    if (subscribers.length === 0) {
      toast.error('রপ্তানি করার জন্য কোনো সাবস্ক্রাইবার পাওয়া যায়নি');
      return;
    }
    const csv = 'Email,SubscribedAt\n' + subscribers.map((s) => `${csvCell(s.email)},${csvCell(s.createdAt)}`).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `plainsyt_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('সাবস্ক্রাইবার তালিকা CSV হিসেবে ডাউনলোড হয়েছে');
  };

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center font-bangla">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-xl dark:border-rose-900/40 dark:bg-[#071f2d]">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <ShieldAlert className="size-7" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">প্রবেশাধিকার সংরক্ষিত · Access Restricted</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            এই সম্পাদকীয় ড্যাশবোর্ডটি শুধুমাত্র অনুমোদিত সম্পাদকীয় দলের জন্য।
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center justify-center rounded-xl bg-[#03EF62] px-6 py-2.5 text-xs font-bold text-[#061621] shadow-md transition hover:bg-[#02d955] active:scale-95"
          >
            হোমপেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const card = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#071f2d]';
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-6 font-bangla sm:px-6">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-white/10">
        <span className="flex size-7 items-center justify-center rounded-lg bg-[#03EF62]/20 text-[#006f30] dark:text-[#03EF62]">
          <BarChart3 className="size-4" />
        </span>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">সম্পাদকীয় ড্যাশবোর্ড</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={card}>
          <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">মোট ভিউ</span>
            <Eye className="size-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><Num>{toBengaliNumerals(totalViews)}</Num> বার</p>
        </div>
        <div className={card}>
          <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">প্রকাশিত প্রতিবেদন</span>
            <FileText className="size-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><Num>{toBengaliNumerals(articles.length)}</Num> টি</p>
        </div>
        <div className={card}>
          <div className="mb-2 flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">নিউজলেটার সাবস্ক্রাইবার</span>
            <Mail className="size-4" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><Num>{toBengaliNumerals(subscribers.length)}</Num> জন</p>
          <button type="button" onClick={exportSubscribers} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline dark:text-[#03EF62]">
            <Download className="size-3.5" /> CSV ডাউনলোড
          </button>
        </div>
      </div>

      <section className={card}>
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">সর্বাধিক পঠিত প্রতিবেদন</h2>
        {topArticles.length === 0 ? (
          <p className="text-sm text-slate-500">এখনও কোনো প্রতিবেদন নেই।</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/10">
            {topArticles.map((art, idx) => (
              <li key={art.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <span className="font-mono text-[11px] font-bold text-slate-500">#{idx + 1} · {art.category}</span>
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{art.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
                  <span>ভিউ: <strong className="text-slate-900 dark:text-white"><Num>{toBengaliNumerals(art.stats?.views || 0)}</Num></strong></span>
                  <span>লাইক: <strong className="text-slate-900 dark:text-white"><Num>{toBengaliNumerals(art.stats?.likes || 0)}</Num></strong></span>
                  <button type="button" onClick={() => onNavigate(`/article/${art.slug || art.id}`)} className="flex items-center gap-0.5 text-emerald-700 hover:underline dark:text-[#03EF62]">
                    দেখুন <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
