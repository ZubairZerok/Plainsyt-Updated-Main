import { useMemo, useState } from 'react';
import {
  FileText, BarChart3, History, ShieldCheck, HelpCircle, ArrowUpRight,
  BookOpen, Clock, Download, CheckCircle2, AlertCircle, Laptop, Smartphone,
  Copy, Check, Send, Award, FileCode, Users, Globe2, Sparkles, Filter,
  ExternalLink, RefreshCw, LogOut, ChevronDown, ChevronRight, PenLine,
  Eye, ThumbsUp, BookmarkCheck, Search, Trash2, KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import type { Article, UserProfile } from '../types';
import { CARD, FEED_CARD, SectionLabel, Avatar, VerifiedBadge, cn } from './Primitives';
import { toBengaliNumerals } from '../utils/pureLogic';

/* -------------------------------------------------------------------------- */
/* 1. PUBLICATIONS & DRAFTS STUDIO VIEW (/me/publications)                    */
/* -------------------------------------------------------------------------- */

interface PublicationsStudioProps {
  currentUser: UserProfile | null;
  articles: Article[];
  onOpenWriteArticle: () => void;
  onOpenArticlePopup: (id: string) => void;
  onNavigate: (path: string) => void;
  onNavigateProfile?: (userId: string) => void;
}

export function PublicationsStudioView({
  currentUser,
  articles,
  onOpenWriteArticle,
  onOpenArticlePopup,
  onNavigate,
}: PublicationsStudioProps) {
  const [filter, setFilter] = useState<'all' | 'published' | 'review' | 'draft'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User articles or curated researcher items
  const userArticles = useMemo(() => {
    const list = articles.filter((a) => !currentUser || a.authorId === currentUser.id);
    return list.length > 0 ? list : articles.slice(0, 4);
  }, [articles, currentUser]);

  // Demo review & draft items to give realistic researcher experience
  const reviewItems = useMemo(() => [
    {
      id: 'rev-01',
      title: 'ব্রাহ্মণবাড়িয়ার চরে ন্যানো-ফার্টিলাইজার ও মাটির অনুজীব গতিপ্রকৃতি বিশ্লেষণ',
      category: 'কৃষি ও বায়োটেক',
      status: 'under_review',
      statusLabel: 'ডাবল-ব্লাইন্ড পিয়ার রিভিউ চলছে',
      submittedDate: '২৮ অক্টোবর ২০২৬',
      reviewersAssigned: 2,
      reviewersCompleted: 1,
      estimatedCompletion: '৫ দিন বাকি',
      readTimeMinutes: 12,
      wordCount: 3450,
    },
    {
      id: 'rev-02',
      title: 'বাংলা প্রাকৃতিক ভাষা প্রক্রিয়াকরণে (NLP) নিউরাল টোকেনাইজেশনের কার্যকারিতা',
      category: 'কৃত্রিম বুদ্ধিমত্তা',
      status: 'editorial_screen',
      statusLabel: 'সম্পাদকীয় প্রাথমিক বাছাই',
      submittedDate: '০১ নভেম্বর ২০২৬',
      reviewersAssigned: 1,
      reviewersCompleted: 0,
      estimatedCompletion: '১০ দিন বাকি',
      readTimeMinutes: 16,
      wordCount: 4820,
    },
  ], []);

  const draftItems = useMemo(() => [
    {
      id: 'draft-01',
      title: 'বঙ্গোপসাগরের মাইক্রোপ্লাস্টিক ঘনত্ব ও সামুদ্রিক খাদ্যশৃঙ্খলে সম্ভাব্য প্রভাব',
      category: 'পরিবেশ বিজ্ঞান',
      lastEdited: '২ ঘণ্টা আগে',
      progressPercent: 65,
      wordCount: 2150,
    },
    {
      id: 'draft-02',
      title: 'কোয়ান্টাম ডট সেন্সর প্রযুক্তিতে দেশীয় কৃষিজমির আর্দ্রতা মনিটরিং',
      category: 'পদার্থবিজ্ঞান ও সেন্সর',
      lastEdited: 'গতকাল',
      progressPercent: 40,
      wordCount: 1280,
    },
  ], []);

  const handleCopyCitation = (title: string, id: string) => {
    const citation = `${currentUser?.name || 'Hasan Zubair'} (2026). "${title}". Plainsyt Research Papers, PLAI-${id.slice(0, 6).toUpperCase()}. https://plainsyt.com/article/${id}`;
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    toast.success('উদ্ধৃতি (Citation) কপি করা হয়েছে', {
      description: 'APA ফরম্যাটে ক্লিপবোর্ডে কপি সম্পন্ন হয়েছে।',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalPublished = userArticles.length;
  const totalInReview = reviewItems.length;
  const totalDrafts = draftItems.length;

  return (
    <div className="space-y-4 font-bangla pb-12">
      {/* Studio Banner */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-6 bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 dark:from-[#061621] dark:via-[#072418] dark:to-[#071f2d] border-emerald-500/20')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-13 sm:size-15 rounded-2xl bg-gradient-to-tr from-[#00ED64] to-[#008f3c] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="size-full rounded-[14px] bg-[#061621] flex items-center justify-center text-[#00ED64]">
                <FileText className="size-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold tracking-widest text-[#008f3c] dark:text-[#00ED64] uppercase">
                  RESEARCHER STUDIO
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-[#00ED64]" /> ভেরিফাইড লেখক
                </span>
              </div>
              <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                প্রকাশনা ও গবেষণা স্টুডিও
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                আপনার রচিত গবেষণা প্রবন্ধ, পিয়ার-রিভিউ জমাকৃত প্রিপ্রিন্ট ও খসড়া পরিচালনা করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenWriteArticle}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#061621] dark:bg-[#00ED64] px-4 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-[#061621] shadow-md hover:bg-slate-800 dark:hover:bg-[#00c954] transition active:scale-95 shrink-0"
          >
            <PenLine className="size-4" />
            <span>নতুন গবেষণা লিখুন</span>
          </button>
        </div>

        {/* Fast Snapshot KPI Counter Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-t border-slate-200/80 dark:border-white/10 pt-4">
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">প্রকাশিত প্রবন্ধ</span>
            <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">{toBengaliNumerals(totalPublished)} টি</span>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">পর্যালোচনায় (Review)</span>
            <span className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">{toBengaliNumerals(totalInReview)} টি</span>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">সংরক্ষিত খসড়া</span>
            <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400">{toBengaliNumerals(totalDrafts)} টি</span>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">মোট পাঠক সংখ্যা</span>
            <span className="font-mono text-xl font-bold text-[#008f3c] dark:text-[#00ED64]">২৪,৫৮০</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
        {(
          [
            { key: 'all', label: `সকল আইটেম (${toBengaliNumerals(totalPublished + totalInReview + totalDrafts)})` },
            { key: 'published', label: `প্রকাশিত (${toBengaliNumerals(totalPublished)})` },
            { key: 'review', label: `পর্যালোচনায় (${toBengaliNumerals(totalInReview)})` },
            { key: 'draft', label: `খসড়া (${toBengaliNumerals(totalDrafts)})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap',
              filter === tab.key
                ? 'bg-[#061621] text-white dark:bg-[#00ED64] dark:text-[#061621] shadow-xs'
                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Lists */}
      <div className="space-y-3">
        {/* Review Submissions */}
        {(filter === 'all' || filter === 'review') && reviewItems.map((item) => (
          <div
            key={item.id}
            className={cn(FEED_CARD, 'p-4 border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10')}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
                  {item.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                  <Clock className="size-3" /> {item.statusLabel}
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                জমা: {item.submittedDate}
              </span>
            </div>

            <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white leading-snug">
              {item.title}
            </h3>

            {/* Peer-review stage bar */}
            <div className="mt-3 p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                <span>রিভিউয়ার অগ্রগতি ({toBengaliNumerals(item.reviewersCompleted)}/{toBengaliNumerals(item.reviewersAssigned)} জন পর্যালোচনা সম্পন্ন করেছেন)</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.estimatedCompletion}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(item.reviewersCompleted / item.reviewersAssigned) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/5">
              <span>আনুমানিক পঠন সময়: {toBengaliNumerals(item.readTimeMinutes)} মিনিট · {toBengaliNumerals(item.wordCount)} শব্দ</span>
              <button
                type="button"
                onClick={() => toast.info('রিভিউয়ার ফিডব্যাক', { description: 'রিভিউয়ার ১ পজিটিভ সুপারিশ করেছেন। রিভিউয়ার ২ এর রিপোর্টের অপেক্ষায়।' })}
                className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
              >
                রিভিউ লগ দেখুন →
              </button>
            </div>
          </div>
        ))}

        {/* Draft Items */}
        {(filter === 'all' || filter === 'draft') && draftItems.map((draft) => (
          <div
            key={draft.id}
            className={cn(FEED_CARD, 'p-4 border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10')}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10.5px] font-bold text-blue-800 dark:text-blue-300">
                {draft.category}
              </span>
              <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400">
                সর্বশেষ এডিট: {draft.lastEdited}
              </span>
            </div>
            <h3 className="font-sans text-base font-bold text-slate-900 dark:text-white leading-snug">
              {draft.title}
            </h3>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                  <span>খসড়া সম্পূর্ণতা</span>
                  <span>{toBengaliNumerals(draft.progressPercent)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${draft.progressPercent}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenWriteArticle}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition"
              >
                <PenLine className="size-3.5" />
                <span>লিখুন</span>
              </button>
            </div>
          </div>
        ))}

        {/* Published Articles */}
        {(filter === 'all' || filter === 'published') && userArticles.map((art) => (
          <div key={art.id} className={cn(FEED_CARD, 'p-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition')}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300">
                  {art.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-[#00ED64]">
                  <CheckCircle2 className="size-3.5" /> পিয়ার-রিভিউড ও প্রকাশিত
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-slate-400">
                DOI: 10.5281/plainsyt.{art.id.slice(0, 8)}
              </span>
            </div>

            <h3
              onClick={() => onOpenArticlePopup(art.id)}
              className="font-sans text-base font-bold text-slate-900 dark:text-white leading-snug cursor-pointer hover:text-emerald-600 transition"
            >
              {art.title}
            </h3>

            <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {art.excerpt}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><Eye className="size-3.5 text-slate-400" /> {toBengaliNumerals(art.viewCount || 850)} পাঠক</span>
                <span className="flex items-center gap-1"><ThumbsUp className="size-3.5 text-slate-400" /> {toBengaliNumerals(art.likeCount || 42)} সমর্থন</span>
                <span>{art.publishedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCitation(art.title, art.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  {copiedId === art.id ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  <span>{copiedId === art.id ? 'কপি হয়েছে' : 'উদ্ধৃতি (Citation)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenArticlePopup(art.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold transition"
                >
                  <span>পড়ুন</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. RESEARCHER IMPACT & ANALYTICS VIEW (/me/analytics)                     */
/* -------------------------------------------------------------------------- */

export function ResearcherAnalyticsView({
  currentUser,
}: {
  currentUser: UserProfile | null;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleExportReport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success('অ্যানালিটিক্স রিপোর্ট তৈরি হয়েছে', {
        description: 'Plainsyt-Researcher-Impact-Q4-2026.pdf ডাউনলোড ফোল্ডারে সংরক্ষিত হয়েছে।',
      });
    }, 1200);
  };

  const demographics = [
    { name: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (BUET)', pct: 34, color: 'bg-emerald-500' },
    { name: 'ঢাকা বিশ্ববিদ্যালয় (DU - বিজ্ঞান অনুষদ)', pct: 26, color: 'bg-blue-500' },
    { name: 'আন্তর্জাতিক পাঠক (MIT, Cambridge, TU Munich)', pct: 22, color: 'bg-purple-500' },
    { name: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU)', pct: 18, color: 'bg-amber-500' },
  ];

  const topTopics = [
    { tag: 'কৃত্রিম বুদ্ধিমত্তা ও রোবটিক্স (AI)', views: '১০,৪২০', citationRate: '৪.৮%' },
    { tag: 'জিনোমিক্স ও কৃষি বায়োটেক', views: '৭,৩৫০', citationRate: '৫.১%' },
    { tag: 'সেমিকন্ডাক্টর ও ন্যানোমেটেরিয়ালস', views: '৪,৮১০', citationRate: '৩.৯%' },
    { tag: 'নবায়নযোগ্য শক্তি ও ব্যাটারি প্রযুক্তি', views: '২,০০০', citationRate: '৪.২%' },
  ];

  const monthlyBars = [
    { month: 'মে', count: 1800, height: '40%' },
    { month: 'জুন', count: 2400, height: '52%' },
    { month: 'জুলাই', count: 3100, height: '65%' },
    { month: 'আগস্ট', count: 3900, height: '78%' },
    { month: 'সেপ্টেম্বর', count: 4600, height: '88%' },
    { month: 'অক্টোবর', count: 5800, height: '100%' },
  ];

  return (
    <div className="space-y-4 font-bangla pb-12">
      {/* Analytics Header */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-6 bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 dark:from-[#061621] dark:via-[#072418] dark:to-[#071f2d] border-emerald-500/20')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-13 sm:size-15 rounded-2xl bg-gradient-to-tr from-[#00ED64] to-[#008f3c] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="size-full rounded-[14px] bg-[#061621] flex items-center justify-center text-[#00ED64]">
                <BarChart3 className="size-7" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold tracking-widest text-[#008f3c] dark:text-[#00ED64] uppercase">
                  ACADEMIC ANALYTICS
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                  লাইভ মেট্রিক্স
                </span>
              </div>
              <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                গবেষক অ্যানালিটিক্স ও ইমপ্যাক্ট
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {currentUser?.name || 'গবেষক'} · প্রকাশনা ও গবেষণার বৈজ্ঞানিক প্রভাব এবং পাঠক বিস্তার।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportReport}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/15 transition active:scale-95 shadow-xs shrink-0"
          >
            {downloading ? <RefreshCw className="size-4 animate-spin text-emerald-500" /> : <Download className="size-4" />}
            <span>{downloading ? 'রিপোর্ট প্রস্তুত হচ্ছে...' : 'রিপোর্ট এক্সপোর্ট (PDF)'}</span>
          </button>
        </div>

        {/* 4 Core Impact KPIs */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">মোট পাঠক সংখ্যা</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">২৪,৫৮০</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#00ED64]">+১৮.২%</span>
            </div>
            <span className="text-[10.5px] text-slate-400">বিগত ৩০ দিনে বৃদ্ধি পেয়েছে</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">একাডেমিক উদ্ধৃতি (Citations)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">১৪৭ বার</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#00ED64]">+১২</span>
            </div>
            <span className="text-[10.5px] text-slate-400">Google Scholar ও Plainsyt সূচক</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">গড় পঠন সময়</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">৪:৩৮ মি.</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#00ED64]">৮৯%</span>
            </div>
            <span className="text-[10.5px] text-slate-400">সম্পূর্ণ পাঠের হার উচ্চ</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-2xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">রিসার্চ ইমপ্যাক্ট স্কোর</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">৯৩ / ১০০</span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#00ED64]">Top 5%</span>
            </div>
            <span className="text-[10.5px] text-slate-400">শীর্ষ গবেষকদের সূচকে স্থান</span>
          </div>
        </div>
      </section>

      {/* Monthly Velocity & Demographics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Reader Growth */}
        <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                মাসিক পাঠক বৃদ্ধি ধারা
              </h2>
              <p className="text-xs text-slate-500">বিগত ৬ মাসের পাঠকদের সংখ্যা</p>
            </div>
            <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              +৩২২% বার্ষিক গ্রোথ
            </span>
          </div>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200/70 dark:border-white/10">
            {monthlyBars.map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {toBengaliNumerals(bar.count)}
                </span>
                <div
                  className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-[#00ED64] transition-all duration-300 group-hover:brightness-110 shadow-xs"
                  style={{ height: bar.height }}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
            <span>সর্বোচ্চ বৃদ্ধি: অক্টোবর ২০২৬</span>
            <span className="text-emerald-600 font-semibold">ধারাবাহিক ঊর্ধ্বমুখী</span>
          </div>
        </section>

        {/* Institution & Geographical Reach */}
        <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                পাঠকদের প্রাতিষ্ঠানিক বিস্তার
              </h2>
              <p className="text-xs text-slate-500">শীর্ষ বিশ্ববিদ্যালয় ও গবেষণা প্রতিষ্ঠান</p>
            </div>
            <Globe2 className="size-4 text-emerald-600 dark:text-[#00ED64]" />
          </div>

          <div className="space-y-3.5">
            {demographics.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-200">
                  <span className="truncate pr-2">{item.name}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white shrink-0">{toBengaliNumerals(item.pct)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', item.color)} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Top Performing Research Topics */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white mb-3">
          সর্বোচ্চ প্রভাব সৃষ্টিকারী গবেষণা ক্ষেত্রসমূহ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topTopics.map((topic) => (
            <div key={topic.tag} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="font-sans text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">{topic.tag}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">{topic.views} বার পঠিত</span>
              </div>
              <span className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {topic.citationRate} উদ্ধৃতি
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. READING HISTORY & REFERENCES ARCHIVE VIEW (/me/reading-history)         */
/* -------------------------------------------------------------------------- */

export function ReadingHistoryView({
  articles,
  onOpenArticlePopup,
}: {
  articles: Article[];
  onOpenArticlePopup: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState(() => articles.slice(0, 8));

  const filtered = useMemo(() => {
    return historyList.filter((a) => {
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
      const matchPillar = !selectedPillar || a.category === selectedPillar;
      return matchSearch && matchPillar;
    });
  }, [historyList, search, selectedPillar]);

  const handleClearHistory = () => {
    setHistoryList([]);
    toast.success('পড়ার ইতিহাস সফলভাবে মুছে ফেলা হয়েছে', {
      description: 'আপনার স্থানীয় ব্রাউজার থেকে রিডিং হিস্ট্রি রিসেট করা হয়েছে।',
    });
  };

  const handleCopyCitation = (title: string, author: string, id: string) => {
    const citation = `${author} (2026). "${title}". Plainsyt Scholarly Index. https://plainsyt.com/article/${id}`;
    navigator.clipboard.writeText(citation);
    toast.success('রেফারেন্স উদ্ধৃতি কপি হয়েছে', {
      description: 'APA 7th Edition অনুযায়ী ক্লিপবোর্ডে কপি করা হয়েছে।',
    });
  };

  return (
    <div className="space-y-4 font-bangla pb-12">
      {/* Header */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-13 sm:size-15 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="size-full rounded-[14px] bg-[#061621] flex items-center justify-center text-blue-400">
                <History className="size-7" />
              </div>
            </div>
            <div>
              <span className="font-mono text-[11px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                READING LOG & REFERENCES
              </span>
              <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                পড়ার ইতিহাস ও রেফারেন্স আর্কাইভ
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                আপনার সাম্প্রতিক পঠিত গবেষণা নিবন্ধ, রেফারেন্স টাইমলাইন ও উদ্ধৃতি কপি করার সুবিধা।
              </p>
            </div>
          </div>

          {historyList.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition active:scale-95 shrink-0"
            >
              <Trash2 className="size-3.5" />
              <span>ইতিহাস মুছুন</span>
            </button>
          )}
        </div>

        {/* Stats Summary Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200/70 dark:border-white/10">
          <span>মোট পঠিত: <strong className="font-mono text-slate-900 dark:text-white">{toBengaliNumerals(historyList.length)} টি</strong> গবেষণা নিবন্ধ</span>
          <span>·</span>
          <span>পড়ার সময়: <strong className="font-mono text-slate-900 dark:text-white">৩ ঘণ্টা ২০ মিনিট</strong></span>
          <span>·</span>
          <span>রেফারেন্স সংগৃহীত: <strong className="font-mono text-slate-900 dark:text-white">১২ টি</strong></span>
        </div>
      </section>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="পঠিত নিবন্ধের শিরোনাম বা বিষয় দিয়ে খুঁজুন..."
            className="w-full rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-white/5 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        {selectedPillar && (
          <button
            type="button"
            onClick={() => setSelectedPillar(null)}
            className="rounded-xl bg-slate-200 dark:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            ফিল্টার রিসেট
          </button>
        )}
      </div>

      {/* History Items */}
      {filtered.length === 0 ? (
        <div className={cn(FEED_CARD, 'p-8 text-center')}>
          <BookOpen className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">কোনো পড়ার রেকর্ড পাওয়া যায়নি</p>
          <p className="text-xs text-slate-500">নতুন নিবন্ধ পড়তে নিউজফিড বা এক্সপ্লোরে প্রবেশ করুন।</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              className={cn(FEED_CARD, 'p-3.5 sm:p-4 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3')}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-slate-400">
                    <Clock className="size-3" /> {idx === 0 ? 'আজ দুপুর ২:১৫' : idx === 1 ? 'গতকাল সন্ধ্যা ৭:৩০' : 'বিগত সপ্তাহে'}
                  </span>
                  <span className="hidden sm:inline-block rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 dark:text-emerald-300">
                    ১০০% সমাপ্ত
                  </span>
                </div>

                <h3
                  onClick={() => onOpenArticlePopup(item.id)}
                  className="font-sans text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-emerald-600 transition"
                >
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  লেখক: {item.author.name} · {toBengaliNumerals(item.readTimeMinutes)} মিনিট পড়ার সময়
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyCitation(item.title, item.author.name, item.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <Copy className="size-3.5" />
                  <span>উদ্ধৃতি কপি</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenArticlePopup(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition"
                >
                  <span>পুনরায় পড়ুন</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. ACCOUNT SECURITY & DEVICE MANAGEMENT VIEW (/me/security)               */
/* -------------------------------------------------------------------------- */

export function AccountSecurityView({
  currentUser,
  onLogout,
  onOpenProfileSettings,
}: {
  currentUser: UserProfile | null;
  onLogout?: () => void;
  onOpenProfileSettings?: () => void;
}) {
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Windows 11 PC · Google Chrome 130',
      location: 'ঢাকা, বাংলাদেশ',
      ip: '103.205.134.42',
      isCurrent: true,
      lastActive: 'এখন সক্রিয়',
      type: 'desktop',
    },
    {
      id: 'sess-2',
      device: 'Apple iPhone 15 Pro · Safari Mobile',
      location: 'চট্টগ্রাম, বাংলাদেশ',
      ip: '103.205.135.18',
      isCurrent: false,
      lastActive: '২ ঘণ্টা আগে',
      type: 'mobile',
    },
  ]);

  const handleTerminateOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success('অন্যান্য সকল সেশন বন্ধ করা হয়েছে', {
      description: 'আপনার এই ডিভাইস ছাড়া অন্য সকল লগইন ডিভাইস থেকে নিরাপদভাবে লগআউট সম্পন্ন হয়েছে।',
    });
  };

  const handleDownloadPersonalData = () => {
    toast.promise(
      new Promise((res) => setTimeout(res, 1200)),
      {
        loading: 'আপনার ব্যক্তিগত ডাটা আর্কাইভ সংকলন হচ্ছে...',
        success: 'plainsyt-account-export-2026.json সফলভাবে ডাউনলোড হয়েছে!',
        error: 'ডাটা ডাউনলোডে সমস্যা হয়েছে।',
      }
    );
  };

  return (
    <div className="space-y-4 font-bangla pb-12">
      {/* Header */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        <div className="flex items-center gap-3.5">
          <div className="size-13 sm:size-15 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="size-full rounded-[14px] bg-[#061621] flex items-center justify-center text-[#00ED64]">
              <ShieldCheck className="size-7" />
            </div>
          </div>
          <div>
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#008f3c] dark:text-[#00ED64] uppercase">
              SECURITY & VERIFICATION
            </span>
            <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              অ্যাকাউন্ট সিকিউরিটি ও ডিভাইস
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              আপনার গবেষক পরিচয়পত্র যাচাই, সক্রিয় লগইন ডিভাইস ও ডাটা গোপনীয়তা নিয়ন্ত্রণ।
            </p>
          </div>
        </div>
      </section>

      {/* Verified Researcher Identity Card */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5 border-l-4 border-l-[#00ED64]')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-[#00ED64] flex items-center justify-center shrink-0">
              <Award className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-sans text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ভেরিফাইড গবেষক স্ট্যাটাস (Verified Researcher)
                </h2>
                <VerifiedBadge />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ORCID ও প্রাতিষ্ঠানিক পরিচয়পত্র দিয়ে সংযুক্ত ও সত্যায়িত অ্যাকাউন্ট।
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0 self-start sm:self-auto">
            STATUS: VERIFIED
          </span>
        </div>
      </section>

      {/* Active Login Devices & Sessions */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">
              সক্রিয় ডিভাইস ও সেশন
            </h2>
            <p className="text-xs text-slate-500">যেসব ডিভাইসে আপনার অ্যাকাউন্ট বর্তমানে লগইন অবস্থায় রয়েছে</p>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              onClick={handleTerminateOtherSessions}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition active:scale-95"
            >
              <LogOut className="size-3.5" />
              <span>অন্যান্য সকল ডিভাইস থেকে লগআউট</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-slate-200/80 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                  {sess.type === 'desktop' ? <Laptop className="size-5" /> : <Smartphone className="size-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {sess.device}
                    </span>
                    {sess.isCurrent && (
                      <span className="rounded bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-[#00ED64]">
                        এই ডিভাইস
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {sess.location} · {sess.ip} · {sess.lastActive}
                  </p>
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => {
                    setSessions((p) => p.filter((x) => x.id !== sess.id));
                    toast.success('ডিভাইস বিচ্ছিন্ন করা হয়েছে');
                  }}
                  className="text-xs text-rose-600 hover:underline shrink-0 ml-2"
                >
                  লগআউট
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Security Actions & Data Export */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white mb-3">
          পাসওয়ার্ড ও ডাটা সুরক্ষা
        </h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <div>
              <span className="font-sans text-sm font-bold text-slate-900 dark:text-white">টু-ফ্যাক্টর অথেনটিকেশন (2FA)</span>
              <p className="text-xs text-slate-500">লগইনের সময় অতিরিক্ত নিরাপত্তা কোড নিশ্চিত করে</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-[#00ED64]">
              <CheckCircle2 className="size-4" /> সক্রিয় (সুরক্ষিত)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
            <div>
              <span className="font-sans text-sm font-bold text-slate-900 dark:text-white">ব্যক্তিগত ডাটা সংরক্ষণ ও ডাউনলোড</span>
              <p className="text-xs text-slate-500">আপনার সমস্ত প্রবন্ধ, খসড়া ও কমেন্টের সম্পূর্ণ JSON আর্কাইভ</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPersonalData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 transition shadow-2xs shrink-0 self-start sm:self-auto"
            >
              <Download className="size-3.5" />
              <span>ডাটা ডাউনলোড</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. EDITORIAL STANDARDS & AUTHOR GUIDELINES VIEW (/help)                    */
/* -------------------------------------------------------------------------- */

export function EditorialHelpView({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketTopic, setTicketTopic] = useState('review_inquiry');
  const [ticketMessage, setTicketMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) {
      toast.error('দয়া করে বার্তার বিবরণ লিখুন');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setTicketMessage('');
      const ticketId = `PLAI-TICK-${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success('সম্পাদকীয় বার্তা গৃহীত হয়েছে!', {
        description: `আপনার টিকেট নম্বর: ${ticketId}। ২৪ ঘণ্টার মধ্যে সম্পাদকীয় বোর্ড যোগাযোগ করবে।`,
        duration: 5000,
      });
    }, 1000);
  };

  const steps = [
    {
      step: '১',
      title: 'পাণ্ডুলিপি জমা ও প্রাথমিক স্ক্রিনিং',
      desc: 'লেখক কর্তৃক গবেষণাপত্র জমার পর সম্পাদকীয় বোর্ড বিষয়বস্তুর মৌলিকতা ও প্লেজিয়ারিজম (<১০%) পরীক্ষা করে।',
    },
    {
      step: '২',
      title: 'ডাবল-ব্লাইন্ড পিয়ার রিভিউ',
      desc: 'স্বনামধন্য বিশ্ববিদ্যালয়ের সংশ্লিষ্ট বিষয়ের ২ জন বিশেষজ্ঞ গবেষক কর্তৃক অজ্ঞাতনামা পর্যালোচনা সম্পন্ন হয়।',
    },
    {
      step: '৩',
      title: 'লেখক রিভিশন ও সংশোধন',
      desc: 'পর্যালোচকদের মন্তব্য ও প্রস্তাবনার আলোকে লেখক পাণ্ডুলিপি পরিমার্জন করে চূড়ান্ত ড্রাফট প্রদান করেন।',
    },
    {
      step: '৪',
      title: 'আন্তর্জাতিক ডিওআই ও ডিজিটাল প্রকাশ',
      desc: 'চূড়ান্ত যাচাইয়ের পর Plainsyt ডিজিটাল আর্কাইভে স্থায়ী DOI লিংকসহ ওপেন এক্সেস নিবন্ধ হিসেবে প্রকাশিত হয়।',
    },
  ];

  const faqs = [
    {
      q: 'Plainsyt-এ গবেষণাপত্র প্রকাশের জন্য কোনো ফি লাগে?',
      a: 'না, Plainsyt সম্পূর্ণ ওপেন-এক্সেস এবং নন-প্রফিট গবেষণা দর্শন ধারণ করে। লেখক বা পাঠকের কাছ থেকে কোনো প্রকার প্রকাশনা বা সাবস্ক্রিপশন ফি নেওয়া হয় না।',
    },
    {
      q: 'পিয়ার-রিভিউ সম্পন্ন হতে সাধারণত কত দিন সময় লাগে?',
      a: 'প্রাথমিক স্ক্রিনিং ৭২ ঘণ্টার মধ্যে সম্পন্ন হয়। এরপর ডাবল-ব্লাইন্ড পিয়ার রিভিউতে সাধারণত ২ থেকে ৩ সপ্তাহ সময় লাগে।',
    },
    {
      q: 'গবেষণায় এআই (AI/LLM) ব্যবহারের নীতিমালা কী?',
      a: 'ভাষা সংশোধন বা অনুবাদে এআই সহায়ক হিসেবে ব্যবহৃত হলে তা মেথডোলজি বা পাদটীকায় স্পষ্ট উল্লেখ করতে হবে। এআই-কে সহ-লেখক হিসেবে গণ্য করা যায় না।',
    },
    {
      q: 'প্রকাশিত আর্টিকেলের কপিরাইট কার কাছে সংরক্ষিত থাকে?',
      a: 'কপিরাইট সর্বদা মূল লেখকের কাছে সংরক্ষিত থাকে (Creative Commons CC-BY 4.0 লাইসেন্স অনুযায়ী)। লেখক যেকোনো আন্তর্জাতিক জার্নালে পরবর্তীতে এর সম্প্রসারিত সংস্করণ প্রকাশ করতে পারবেন।',
    },
  ];

  return (
    <div className="space-y-4 font-bangla pb-12">
      {/* Header */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-6 bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 dark:from-[#061621] dark:via-[#072418] dark:to-[#071f2d] border-emerald-500/20')}>
        <div className="flex items-center gap-3.5">
          <div className="size-13 sm:size-15 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="size-full rounded-[14px] bg-[#061621] flex items-center justify-center text-[#00ED64]">
              <HelpCircle className="size-7" />
            </div>
          </div>
          <div>
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#008f3c] dark:text-[#00ED64] uppercase">
              EDITORIAL DESK & SUPPORT
            </span>
            <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              সম্পাদকীয় গাইডলাইন ও হেল্প ডেস্ক
            </h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Plainsyt গবেষণা প্রকাশনা নীতি, পিয়ার-রিভিউ মানদণ্ড ও সম্পাদকীয় দলের সরাসরি সহায়তা।
            </p>
          </div>
        </div>
      </section>

      {/* 4-Step Peer Review Process */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <div className="mb-4">
          <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">
            পিয়ার-রিভিউ ও প্রকাশনা পরিক্রমা
          </h2>
          <p className="text-xs text-slate-500">গবেষণার বৈজ্ঞানিক গ্রহণযোগ্যতা নিশ্চিত করার ৪টি পর্যায়</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((st) => (
            <div key={st.step} className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 relative">
              <span className="size-6 rounded-full bg-[#061621] dark:bg-[#00ED64] text-white dark:text-[#061621] font-mono text-xs font-black flex items-center justify-center mb-2 shadow-xs">
                {st.step}
              </span>
              <h3 className="font-sans text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                {st.title}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Policy & FAQs */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white mb-3">
          সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
        </h2>

        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-slate-200/70 dark:border-white/10 overflow-hidden bg-white dark:bg-white/5"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn('size-4 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Editorial Team Form */}
      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <div className="mb-3">
          <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">
            সম্পাদকীয় বোর্ডের সাথে সরাসরি যোগাযোগ
          </h2>
          <p className="text-xs text-slate-500">পাণ্ডুলিপি সংক্রান্ত প্রশ্ন বা পর্যালোচনায় সহায়তার জন্য বার্তা পাঠান</p>
        </div>

        <form onSubmit={handleSubmitTicket} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              বার্তার বিষয় নির্বাচন করুন
            </label>
            <select
              value={ticketTopic}
              onChange={(e) => setTicketTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="review_inquiry">পিয়ার-রিভিউ অগ্রগতি যাচাই</option>
              <option value="manuscript_submission">নতুন পাণ্ডুলিপি জমা বা আপিল</option>
              <option value="doi_citation">ডিওআই (DOI) ও সাইটেশন সংশোধন</option>
              <option value="reviewer_application">পর্যালোচক (Reviewer) হিসেবে যোগদানের আবেদন</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              বিস্তারিত বার্তা
            </label>
            <textarea
              rows={3}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="আপনার প্রশ্ন, প্রবন্ধের নাম বা আইডি এবং বিস্তারিত বার্তা লিখুন..."
              className="w-full rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800 p-3 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#061621] dark:bg-[#00ED64] px-5 py-2.5 text-xs sm:text-sm font-bold text-white dark:text-[#061621] shadow-md hover:bg-slate-800 dark:hover:bg-[#00c954] transition active:scale-95"
          >
            {sending ? <RefreshCw className="size-4 animate-spin" /> : <Send className="size-4" />}
            <span>{sending ? 'বার্তা পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
