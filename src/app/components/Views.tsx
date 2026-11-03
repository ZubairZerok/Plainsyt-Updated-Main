import { useMemo, useState } from 'react';
import {
  ArrowBigUp, ShoppingBag, Lightbulb, Plus, Bell, Settings, ExternalLink, MapPin, Globe2,
  UserPlus, Check, Camera, Palette, Sparkles, Calendar, Users, Trash2, PenLine, Clapperboard,
  CheckCheck, Clock, ArrowRight, ArrowUpRight, MessageSquare, AlertTriangle, Filter, LogIn, LogOut,
} from 'lucide-react';
import type {
  Article, BkashOrder, CartItem, CommunityIdea, CommunityPost, LinkedInReactionType,
  NotificationItem, ReactionTargetType, StoreProduct, TopicStory, UpcomingEvent, UserProfile,
} from '../types';
import { CARD, FEED_CARD, SectionLabel, Avatar, VerifiedBadge, cn } from './Primitives';
import { PILLAR_DEFS } from './LeftSidebar';
import { TrendingList } from './RightSidebar';
import { ImageGraphic } from './ImageGraphic';
import { SavedList } from './SavedArticlesModal';
import { ArticleCard } from './ArticleCard';
import { CommunityPostCard } from './CommunityPostCard';
import { toBengaliNumerals } from '../utils/pureLogic';

function ViewHeader({
  kicker,
  title,
  sub,
  action,
}: {
  kicker: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-3 pb-1 pt-2 sm:px-0">
      <div>
        <SectionLabel>{kicker}</SectionLabel>
        <h1 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-[-0.01em] text-slate-900 sm:text-[36px]">
          {title}
        </h1>
        {sub && <p className="mt-1 font-sans text-sm text-slate-600">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function ExploreView({
  articles,
  pillar,
  onPillar,
  onOpenArticlePopup,
  onOpenPhoto,
}: {
  articles: Article[];
  currentUser: UserProfile | null;
  pillar: string | null;
  onPillar: (k: string | null) => void;
  onOpenArticlePopup: (id: string) => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (src: string, title?: string, authorName?: string, authorId?: string) => void;
}) {
  const list = useMemo(() => {
    if (!pillar) return articles;
    const def = PILLAR_DEFS.find((d) => d.key === pillar);
    if (!def) return articles;
    return articles.filter((a) => (def.cats as readonly string[]).includes(a.category));
  }, [articles, pillar]);

  return (
    <div className="flex flex-col gap-5">
      <ViewHeader
        kicker="বিষয়ভিত্তিক অন্বেষণ"
        title="এক্সপ্লোর ও অনুসন্ধান"
        sub="ছয়টি প্রধান বিষয়ে সাজানো চিন্তাশীল প্রবন্ধ, বিশ্লেষণ ও নিবন্ধের সংগ্রহশালা।"
      />

      {/* Ultra-Modern Compact Category Options */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 -mx-2 sm:mx-0 sm:flex-wrap sm:overflow-visible">
        <button
          type="button"
          onClick={() => onPillar(null)}
          aria-pressed={pillar === null}
          className={cn(
            'inline-flex items-center gap-1.5 sm:gap-2 rounded-full sm:rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[12px] sm:text-xs font-semibold shrink-0 transition-all duration-200 active:scale-95 border shadow-xs',
            pillar === null
              ? 'bg-[#061621] text-white border-[#03EF62] ring-1 ring-[#03EF62]/50 shadow-sm'
              : 'bg-white dark:bg-[#071f2d] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#03EF62]/60 hover:text-black dark:hover:text-white',
          )}
        >
          <Sparkles className={cn('size-3 sm:size-3.5 shrink-0', pillar === null ? 'text-[#03EF62]' : 'text-slate-500')} />
          <span className="font-bangla font-semibold whitespace-nowrap">সকল বিষয়</span>
          <span
            className={cn(
              'font-mono text-[9.5px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold',
              pillar === null
                ? 'bg-[#03EF62] text-[#061621]'
                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
            )}
          >
            {toBengaliNumerals(articles.length)}
          </span>
        </button>

        {PILLAR_DEFS.map((p) => {
          const Icon = p.icon;
          const active = pillar === p.key;
          const count = articles.filter((a) => (p.cats as readonly string[]).includes(a.category)).length;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onPillar(active ? null : p.key)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 sm:gap-2 rounded-full sm:rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-[12px] sm:text-xs font-semibold shrink-0 transition-all duration-200 active:scale-95 border shadow-xs',
                active
                  ? 'bg-[#061621] text-white border-[#03EF62] ring-1 ring-[#03EF62]/50 shadow-sm'
                  : 'bg-white dark:bg-[#071f2d] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:border-[#03EF62]/60 hover:text-black dark:hover:text-white',
              )}
            >
              <Icon className={cn('size-3 sm:size-3.5 shrink-0', active ? 'text-[#03EF62]' : 'text-slate-500')} />
              <span className="font-bangla font-semibold whitespace-nowrap">{p.bn}</span>
              <span
                className={cn(
                  'font-mono text-[9.5px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  active
                    ? 'bg-[#03EF62] text-[#061621]'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300',
                )}
              >
                {toBengaliNumerals(count)}
              </span>
            </button>
          );
        })}
      </div>

      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <SectionLabel className="mb-3">
          {pillar ? 'ফিল্টার করা প্রবন্ধসমূহ' : 'সকল প্রতিবেদন'} · {toBengaliNumerals(list.length)}
        </SectionLabel>
        {list.length === 0 ? (
          <p className="py-8 text-center font-sans text-sm text-slate-500">
            এই বিষয়ে এখনো কোনো প্রতিবেদন প্রকাশিত হয়নি।
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() => onOpenArticlePopup(a.id)}
                  className="group flex min-w-0 flex-1 gap-3.5 text-left"
                >
                  <ImageGraphic
                    type={a.imageType}
                    coverImageUrl={a.coverImageUrl}
                    className="h-18 w-24 shrink-0 rounded-md [&_span]:hidden object-cover"
                  />
                  <span className="min-w-0">
                    <span className="font-sans text-xs font-semibold text-emerald-600">{a.category}</span>
                    <span className="line-clamp-2 font-sans text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-700">
                      {a.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {a.author.name} · {a.readTimeMinutes} মিনিট পড়ার সময়
                    </span>
                  </span>
                </button>
                <a
                  href={`/article/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="নতুন ট্যাবে নিবন্ধটি পড়ুন"
                  aria-label="Open article in new tab"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 py-1.5 font-mono text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-[#03EF62] hover:border-emerald-300 dark:hover:border-emerald-500/30 shadow-2xs transition-all group/tab"
                >
                  <span className="hidden sm:inline">নতুন ট্যাব</span>
                  <ArrowUpRight className="size-3.5 text-slate-400 group-hover/tab:text-emerald-600 dark:group-hover/tab:text-[#03EF62] transition-transform group-hover/tab:-translate-y-0.5 group-hover/tab:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cn(FEED_CARD, 'px-4 pb-2 pt-4 lg:hidden')}>
        <h3 className="font-sans text-base font-bold text-slate-900 mb-2">ট্রেন্ডিং প্রতিবেদন</h3>
        <TrendingList
          articles={articles}
          onOpenPopup={onOpenArticlePopup}
          onOpenPhoto={onOpenPhoto}
        />
      </section>
    </div>
  );
}

export function EventsView({
  events,
  onNavigate,
  onOpenRegister,
}: {
  events: UpcomingEvent[];
  onNavigate: (path: string) => void;
  onOpenRegister: (ev: UpcomingEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ViewHeader
        kicker="ইভেন্ট ও সম্মেলন"
        title="আসন্ন ইভেন্ট ও সেমিনার"
        sub="আলোচনা সভা, কর্মশালা ও চিন্তাশীল সমাবেশ — বিস্তারিত দেখুন ও আসন নিশ্চিত করতে নিবন্ধন করুন।"
      />

      <section className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        {events.length === 0 ? (
          <p className="py-12 text-center font-sans text-sm text-slate-500">
            বর্তমানে কোনো আসন্ন ইভেন্ট তালিকাভুক্ত নেই। নতুন ইভেন্টের ঘোষণা শীঘ্রই আসবে।
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs hover:border-[#03EF62] transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex flex-col items-center justify-center rounded-lg bg-[#061621] px-2.5 py-1.5 text-center text-white">
                        <span className="font-mono text-[9px] font-bold text-[#03EF62]">{e.dateMonth}</span>
                        <span className="font-display text-lg font-bold leading-tight">{e.dateDay}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        <Calendar className="size-3" />
                        {e.dateMonth} {e.dateDay}, ২০২৬
                      </span>
                    </div>
                    {e.isRegistered && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        <Check className="size-3" /> নিবন্ধিত
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onNavigate(`/events/${e.id}`)}
                    className="mt-3 font-sans text-base font-bold text-slate-900 cursor-pointer hover:text-emerald-700 hover:underline leading-snug"
                  >
                    {e.title}
                  </h3>

                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3.5 shrink-0 text-slate-400" />
                    <span>{e.location}</span>
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <Users className="size-3.5" />
                    <span>{e.attendeesCount} জন অংশ নিচ্ছেন</span>
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenRegister(e)}
                    className={cn(
                      'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold transition shadow-xs flex-1',
                      e.isRegistered
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d955]',
                    )}
                  >
                    {e.isRegistered ? 'টিকিট ও তথ্য দেখুন' : 'নিবন্ধন করুন'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/events/${e.id}`)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    বিস্তারিত বিবরণ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function StoreView({
  products,
  cart,
  ordersCount,
  onAddToCart,
  onOpenCheckout,
  onOpenCreateProduct,
  onNavigateProfile,
  onOpenPhoto,
}: {
  products: StoreProduct[];
  cart: CartItem[];
  ordersCount: number;
  onAddToCart: (product: StoreProduct) => void;
  onOpenCheckout: () => void;
  onOpenCreateProduct: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (src: string, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
}) {
  const totalCartQty = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="flex flex-col gap-5">
      <ViewHeader
        kicker="বই ও প্রকাশনা"
        title="প্লেইনসাইট প্রকাশনী ও স্টোর"
        sub="বিশেষ মুদ্রিত বই, জার্নাল, গবেষণাপত্র ও সংকলন — সহজ অর্ডারে ঘরে বসেই সংগ্রহ করুন।"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#03EF62] px-4 text-xs font-bold text-[#061621] hover:bg-[#02d955] shadow-xs transition"
            >
              <ShoppingBag className="size-4" />
              কার্ট ({toBengaliNumerals(totalCartQty)})
            </button>
          </div>
        }
      />

      {products.length === 0 ? (
        <section className={cn(FEED_CARD, 'p-8 text-center')}>
          <ShoppingBag className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-3 font-sans text-lg font-bold text-slate-900">
            স্টোরে বর্তমানে কোনো পণ্য তালিকাভুক্ত নেই
          </h2>
          <p className="mx-auto mt-1 max-w-md font-sans text-xs text-slate-500">
            নতুন বই ও প্রকাশনা শীঘ্রই স্টোরে যুক্ত করা হবে।
          </p>
          {ordersCount > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onOpenCheckout}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                পূর্ববর্তী অর্ডার রশিদ ({ordersCount})
              </button>
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 sm:gap-4 sm:px-0 md:grid-cols-3">
          {products.map((s) => {
            const inCartQty = cart.find((c) => c.productId === s.id)?.quantity ?? 0;
            return (
              <div key={s.id} className={cn(CARD, 'flex flex-col overflow-hidden border border-slate-200')}>
                <div className="relative bg-slate-100">
                  {s.image ? (
                    <button
                      type="button"
                      onClick={() => onOpenPhoto(s.image, s.name, s.description, s.seller, s.sellerId)}
                      className="block w-full cursor-zoom-in"
                    >
                      <img src={s.image} alt={s.name} className="aspect-[4/3] w-full object-cover" />
                    </button>
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#061621] to-slate-800 font-display text-lg font-bold text-white">
                      {s.name.slice(0, 10)}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-800">
                    {s.tag}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-sans text-sm font-semibold leading-snug text-slate-900">{s.name}</p>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 font-sans text-xs text-slate-500">
                      {s.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <p className="font-sans text-base font-bold text-slate-900">
                      ৳{toBengaliNumerals(s.price.toLocaleString('en-IN'))}
                    </p>
                    <button
                      type="button"
                      onClick={() => onAddToCart(s)}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition shadow-xs',
                        inCartQty > 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d955]',
                      )}
                    >
                      <Plus className="size-3" />
                      {inCartQty > 0 ? `কার্টে (${inCartQty})` : 'যোগ করুন'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function IdeasView({
  ideas,
  onSubmitIdea,
  onToggleVote,
  onNavigateProfile,
}: {
  ideas: CommunityIdea[];
  onSubmitIdea: (title: string, body: string, tag: string) => void;
  onToggleVote: (id: string) => void;
  onNavigateProfile: (userId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('সাধারণ');
  const sorted = [...ideas].sort((a, b) => b.votes - a.votes);

  return (
    <div className="flex flex-col gap-5">
      <ViewHeader
        kicker="কমিউনিটি আইডিয়া বোর্ড"
        title="ভাবনার খাতা"
        sub="নতুন আইডিয়া, গবেষণার প্রস্তাবনা বা বিষয়ের পরামর্শ দিন এবং সবার মতামত জানুন।"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmitIdea(title.trim(), body.trim() || title.trim(), tag.trim() || 'সাধারণ');
          setTitle('');
          setBody('');
        }}
        className={cn(FEED_CARD, 'space-y-2.5 p-4')}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="ml-1 size-5 shrink-0 text-amber-500" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="আপনার আইডিয়ার শিরোনাম…"
            className="h-9 flex-1 bg-transparent font-sans text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="ট্যাগ"
            className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 font-sans text-xs text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="সংক্ষেপে বিস্তারিত পরিকল্পনা লিখুন…"
            className="h-9 flex-1 rounded-lg bg-slate-50 px-3 font-sans text-xs text-slate-800 outline-none placeholder:text-slate-400 border border-slate-200"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="h-9 rounded-md bg-[#03EF62] px-4 text-xs font-bold text-[#061621] hover:bg-[#02d955] disabled:opacity-40 transition"
          >
            আইডিয়া প্রকাশ করুন
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <section className={cn(FEED_CARD, 'p-8 text-center font-sans text-sm text-slate-500')}>
          এখনো কোনো আইডিয়া জমা পড়েনি — আপনার আইডিয়াটি উপরে লিখে প্রথম জমা দিন।
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((i) => (
            <li key={i.id} className={cn(FEED_CARD, 'flex gap-3.5 p-4')}>
              <button
                type="button"
                onClick={() => onToggleVote(i.id)}
                aria-pressed={i.voted}
                className={cn(
                  'flex w-12 shrink-0 flex-col items-center rounded-lg border py-1.5 shadow-xs transition',
                  i.voted
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                <ArrowBigUp className={cn('size-5', i.voted && 'fill-current text-emerald-600')} />
                <span className="font-mono text-xs font-semibold">{i.votes}</span>
              </button>
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{i.tag}</span>
                <p className="font-sans text-base font-semibold leading-snug text-slate-900">{i.title}</p>
                <p className="mt-0.5 font-sans text-xs text-slate-600">{i.body}</p>
                <button
                  type="button"
                  onClick={() => onNavigateProfile(i.authorId)}
                  className="mt-1.5 text-[11px] font-semibold text-slate-500 hover:underline"
                >
                  লেখক: {i.author}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NotificationsView({
  items,
  onRead,
  onToggleRead,
  onDelete,
  onNavigate,
  onOpenArticle,
  onNavigateProfile,
}: {
  items: NotificationItem[];
  onRead: () => void;
  onToggleRead?: (id: string, isRead: boolean) => void;
  onDelete?: (id: string) => void;
  onNavigate: (path: string) => void;
  onOpenArticle?: (id: string) => void;
  onNavigateProfile?: (userId: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = useMemo(() => {
    return items.filter((n) => {
      const isUnread = n.isRead !== undefined ? !n.isRead : n.unread;
      if (filter === 'unread') return isUnread;
      if (filter === 'read') return !isUnread;
      return true;
    });
  }, [items, filter]);

  const unreadCount = items.filter((n) => (n.isRead !== undefined ? !n.isRead : n.unread)).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-3 sm:px-0">
        <div>
          <SectionLabel>রিয়েলটাইম বিজ্ঞপ্তি ও কার্যকলাপ</SectionLabel>
          <h1 className="mt-1 font-display text-[28px] font-bold leading-tight tracking-[-0.01em] text-slate-900 sm:text-[36px]">
            সকল নোটিফিকেশন
          </h1>
          <p className="mt-1 font-sans text-sm text-slate-600">
            মোট {toBengaliNumerals(items.length)}টি বিজ্ঞপ্তি · {toBengaliNumerals(unreadCount)}টি অপঠিত
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onRead}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition"
          >
            <CheckCheck className="size-4 text-emerald-600" /> সব পড়া হয়েছে চিহ্নিত করুন
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 px-3 sm:px-0 pb-1">
        {[
          { key: 'all', label: `সকল (${toBengaliNumerals(items.length)})` },
          { key: 'unread', label: `অপঠিত (${toBengaliNumerals(unreadCount)})` },
          { key: 'read', label: `পড়া হয়েছে (${toBengaliNumerals(items.length - unreadCount)})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key as typeof filter)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold transition',
              filter === t.key
                ? 'bg-[#061621] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <section className={cn(FEED_CARD, 'p-12 text-center')}>
          <Bell className="mx-auto size-10 text-slate-300" />
          <h2 className="mt-3 font-sans text-base font-bold text-slate-800">
            {filter === 'unread' ? 'কোনো অপঠিত বিজ্ঞপ্তি নেই' : 'কোনো বিজ্ঞপ্তি পাওয়া যায়নি'}
          </h2>
          <p className="mt-1 font-sans text-xs text-slate-500">
            আপনার নিবন্ধ বা পোস্টে নতুন প্রতিক্রিয়া বা মন্তব্য এলে এখানে দেখতে পাবেন।
          </p>
        </section>
      ) : (
        <ul className={cn(FEED_CARD, 'divide-y divide-slate-100')}>
          {filtered.map((n) => {
            const isUnread = n.isRead !== undefined ? !n.isRead : n.unread;
            const dest = n.targetUrl || n.targetRoute || '/';
            return (
              <li
                key={n.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors',
                  isUnread ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70',
                )}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => n.actorId && onNavigateProfile?.(n.actorId)}
                    className="shrink-0 mt-0.5"
                    title={n.actorName || n.source}
                  >
                    <Avatar
                      src={n.actorAvatar || ''}
                      name={n.actorName || n.source || 'PS'}
                      size="size-10"
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-semibold text-slate-900 leading-snug">
                      {n.message || n.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500">
                      <span>{n.time}</span>
                      <span>·</span>
                      <span className="font-sans font-semibold text-emerald-700">
                        {n.actorName || n.source}
                      </span>
                      <span>·</span>
                      <span className="uppercase text-[9.5px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {n.type || 'system'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleRead && isUnread) {
                        onToggleRead(n.id, true);
                      }
                      if (dest.startsWith('/article/')) {
                        const artId = dest.replace('/article/', '');
                        onOpenArticle ? onOpenArticle(artId) : onNavigate(dest);
                      } else {
                        onNavigate(dest);
                      }
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    গন্তব্যে যান <ArrowRight className="size-3" />
                  </button>

                  {onToggleRead && (
                    <button
                      type="button"
                      onClick={() => onToggleRead(n.id, !isUnread)}
                      aria-label={isUnread ? 'Mark read' : 'Mark unread'}
                      title={isUnread ? 'পড়া হয়েছে হিসেবে চিহ্নিত করুন' : 'অপঠিত হিসেবে চিহ্নিত করুন'}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {isUnread ? 'পড়া হয়েছে' : 'অপঠিত করুন'}
                    </button>
                  )}

                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(n.id)}
                      aria-label="Delete notification"
                      title="বিজ্ঞপ্তি মুছে ফেলুন"
                      className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ProfileView({
  profile,
  isOwnProfile,
  isFollowing,
  currentUser,
  authorArticles,
  authorPosts,
  authorStories = [],
  savedArticles,
  savedPosts,
  orders,
  bookmarkIds,
  dark,
  onToggleDark,
  onToggleFollow,
  onOpenProfileSettings,
  onOpenAuth,
  onLogout,
  onOpenArticlePopup,
  onOpenCreatePost,
  onOpenCreateStory,
  onOpenWriteArticle,
  onDeletePost,
  onDeleteStory,
  onDeleteArticle,
  onReact,
  onOpenReactionsBreakdown,
  onBookmarkArticle,
  onCommentArticle,
  onSavePost,
  onCommentPost,
  onShare,
  onRemoveSavedArticle,
  onRemoveSavedPost,
  onNavigateProfile,
  onOpenPhoto,
}: {
  profile: UserProfile | null;
  isOwnProfile: boolean;
  isFollowing: boolean;
  currentUser: UserProfile | null;
  authorArticles: Article[];
  authorPosts: CommunityPost[];
  authorStories?: TopicStory[];
  savedArticles: Article[];
  savedPosts: CommunityPost[];
  orders: BkashOrder[];
  bookmarkIds: string[];
  dark: boolean;
  onToggleDark: () => void;
  onToggleFollow: () => void;
  onOpenProfileSettings: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenArticlePopup: (id: string) => void;
  onOpenCreatePost?: () => void;
  onOpenCreateStory?: () => void;
  onOpenWriteArticle?: () => void;
  onDeletePost?: (id: string) => void;
  onDeleteStory?: (id: string) => void;
  onDeleteArticle?: (id: string) => void;
  onReact: (targetType: ReactionTargetType, targetId: string, type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: (targetType: ReactionTargetType, targetId: string) => void;
  onBookmarkArticle: (id: string) => void;
  onCommentArticle: (id: string, text: string) => void;
  onSavePost: (id: string) => void;
  onCommentPost: (id: string, text: string) => void;
  onShare: (label: string) => void;
  onRemoveSavedArticle: (id: string) => void;
  onRemoveSavedPost: (id: string) => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (images: string[], index: number, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
}) {
  const [tab, setTab] = useState<'articles' | 'posts' | 'stories' | 'saved' | 'orders'>('articles');
  const isSelf = isOwnProfile || (Boolean(currentUser?.id) && currentUser?.id === profile.id);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'post' | 'story' | 'article';
    id: string;
    title: string;
  } | null>(null);

  if (!profile) {
    return (
      <section className={cn(FEED_CARD, 'p-8 text-center')}>
        <UserPlus className="mx-auto size-10 text-slate-400" />
        <h1 className="mt-3 font-sans text-xl font-bold text-slate-900">
          আপনার প্রোফাইল সেট আপ করুন
        </h1>
        <p className="mx-auto mt-1 max-w-md font-sans text-xs text-slate-500">
          আপনার নাম, ছবি ও বিবরণ যুক্ত করে পাঠকদের সাথে যুক্ত হোন।
        </p>
        <button
          type="button"
          onClick={onOpenProfileSettings}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#03EF62] px-4 text-xs font-bold text-[#061621] hover:bg-[#02d955]"
        >
          <Sparkles className="size-3.5" /> প্রোফাইল তৈরি করুন
        </button>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={cn(FEED_CARD, 'overflow-hidden')}>
        {/* Custom Cover Background Gradient */}
        <div
          style={{
            background:
              profile.coverGradient ||
              'linear-gradient(135deg, #061621 0%, #0d2b3e 55%, #03EF62 100%)',
          }}
          className="relative h-32 w-full sm:h-40"
        >
          {isOwnProfile && (
            <button
              type="button"
              onClick={onOpenProfileSettings}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-black/60"
            >
              <Palette className="size-3" /> কভার পরিবর্তন
            </button>
          )}
        </div>

        <div className="-mt-12 px-4 pb-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (profile.avatar.startsWith('http') || profile.avatar.startsWith('data:')) {
                    onOpenPhoto([profile.avatar], 0, profile.name, `${profile.role} · ${profile.organization}`, profile.name, profile.id);
                  } else if (isOwnProfile) {
                    onOpenProfileSettings();
                  }
                }}
                className="group relative block rounded-full"
                title="প্রোফাইল ছবি"
              >
                <Avatar
                  src={profile.avatar}
                  name={profile.name}
                  size="size-20 sm:size-24"
                  online={isSelf}
                  className="rounded-full border-4 border-white shadow-sm"
                />
              </button>
              {isSelf && (
                <button
                  type="button"
                  onClick={onOpenProfileSettings}
                  aria-label="Change profile picture"
                  className="absolute bottom-1 right-1 flex size-7 items-center justify-center rounded-full bg-[#061621] text-white shadow hover:bg-slate-800"
                >
                  <Camera className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSelf ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenProfileSettings}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Settings className="size-3.5" /> সেটিংস
                  </button>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/50 dark:bg-white dark:border-white dark:text-rose-600 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-100 shadow-xs transition"
                      title="সাইন আউট করুন"
                    >
                      <LogOut className="size-3.5 text-rose-600" /> সাইন আউট
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onToggleDark}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {dark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onToggleFollow}
                  aria-pressed={isFollowing}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-xs font-bold transition shadow-xs',
                    isFollowing
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d955]',
                  )}
                >
                  {isFollowing ? (
                    <>
                      <Check className="size-3.5" /> ফলো করছেন
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-3.5" /> ফলো করুন
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <h1 className="flex items-center gap-1.5 font-sans text-xl font-bold text-slate-900">
              {profile.name}
              {profile.isVerified && <VerifiedBadge />}
            </h1>
            {profile.nameBn && profile.nameBn !== profile.name && (
              <p className="font-sans text-sm font-medium text-slate-600">{profile.nameBn}</p>
            )}
            <p className="mt-0.5 font-sans text-xs text-slate-500">
              {profile.role} {profile.organization ? `· ${profile.organization}` : ''}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10.5px] text-slate-400">
              <span>@{profile.handle}</span>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <Globe2 className="size-2.5" /> Website ↗
                </a>
              )}
            </div>
            {profile.bio && (
              <p className="mt-2.5 font-sans text-sm leading-relaxed text-slate-700">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Compact Modern Single-line Stats: hidden on mobile */}
          <div className="mt-3.5 hidden sm:flex flex-wrap items-center gap-2 sm:gap-2.5">
            {[
              ['প্রতিবেদন', authorArticles.length],
              ['পোস্ট', authorPosts.length],
              ['স্টোরি', authorStories.length],
              ['অনুসারী', profile.followersCount + (isFollowing ? 1 : 0)],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-white/5 px-3 py-1 font-bangla text-xs transition hover:bg-slate-100 dark:hover:bg-white/10 shadow-2xs"
              >
                <span className="font-bold text-black dark:text-white font-mono text-[13px]">
                  {toBengaliNumerals(Number(v))}
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-[12px] font-medium">
                  {k}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="flex border-t border-slate-200 px-4">
          {(
            [
              { key: 'articles', label: `প্রতিবেদন (${authorArticles.length})` },
              { key: 'posts', label: `পোস্ট (${authorPosts.length})` },
              { key: 'stories', label: `স্টোরি (${authorStories.length})` },
              ...(isSelf
                ? [
                    { key: 'saved', label: `সংরক্ষিত (${savedArticles.length + savedPosts.length})` },
                    { key: 'orders', label: `অর্ডারসমূহ (${orders.length})` },
                  ]
                : []),
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                'relative py-2.5 px-3 text-xs font-semibold transition',
                tab === t.key ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t-full bg-[#03EF62]" />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Profile Content Management Options for Authenticated Author */}
      {isSelf && (
        <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
            <div>
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">
                কন্টেন্ট প্রকাশনা ও ব্যবস্থাপনা · Content Management
              </p>
              <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white mt-0.5">
                নতুন কন্টেন্ট প্রকাশ করুন
              </h2>
            </div>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              {profile.role || 'Member'}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-left hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#03EF62]/15 border border-[#03EF62]/30 text-[#03EF62]">
                <PenLine className="size-4.5 text-[#03EF62]" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-sans text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#03EF62]">
                  পোস্ট তৈরি করুন
                </p>
                <p className="font-sans text-[11px] text-slate-500">
                  মতামত ও প্রযুক্তি আপডেট শেয়ার
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenCreateStory}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-left hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#03EF62]/15 border border-[#03EF62]/30 text-[#03EF62]">
                <Clapperboard className="size-4.5 text-[#03EF62]" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-sans text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#03EF62]">
                  স্টোরি তৈরি করুন
                </p>
                <p className="font-sans text-[11px] text-slate-500">
                  ২৪ ঘণ্টার ভিজ্যুয়াল স্টোরি
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenWriteArticle}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-left hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#03EF62]/15 border border-[#03EF62]/30 text-[#03EF62]">
                <Plus className="size-4.5 text-[#03EF62]" strokeWidth={2.5} />
              </span>
              <div>
                <p className="font-sans text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#03EF62]">
                  প্রতিবেদন লিখুন
                </p>
                <p className="font-sans text-[11px] text-slate-500">
                  সম্পাদকীয় ও গবেষণা প্রবন্ধ
                </p>
              </div>
            </button>
          </div>
        </section>
      )}

      {tab === 'articles' && (
        <div className="space-y-4">
          {authorArticles.length === 0 ? (
            <section className={cn(FEED_CARD, 'p-8 text-center font-sans text-sm text-slate-500')}>
              এই লেখকের এখনো কোনো প্রকাশিত প্রতিবেদন নেই।
            </section>
          ) : (
            authorArticles.map((a) => (
              <div key={a.id} className="relative group">
                <ArticleCard
                  article={a}
                  bookmarked={(bookmarkIds ?? []).includes(a.id)}
                  currentUser={currentUser}
                  onOpenPopup={() => onOpenArticlePopup(a.id)}
                  onReact={(type) => onReact('article', a.id, type)}
                  onOpenReactionsBreakdown={() => onOpenReactionsBreakdown('article', a.id)}
                  onBookmark={() => onBookmarkArticle(a.id)}
                  onComment={(t) => onCommentArticle(a.id, t)}
                  onReactComment={(cid, type) => onReact('comment', cid, type)}
                  onShare={() => onShare(a.title)}
                  onNavigateProfile={onNavigateProfile}
                  onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
                    onOpenPhoto([src], 0, title, subtitle, authorName, authorId)
                  }
                />
                {isOwnProfile && onDeleteArticle && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: 'article', id: a.id, title: a.title })}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-lg bg-rose-600 text-white px-2.5 py-1 text-xs font-bold shadow-md hover:bg-rose-700 transition"
                  >
                    <Trash2 className="size-3" /> মুছুন
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-4">
          {authorPosts.length === 0 ? (
            <section className={cn(FEED_CARD, 'p-8 text-center font-sans text-sm text-slate-500')}>
              এখনো কোনো কমিউনিটি পোস্ট নেই।
            </section>
          ) : (
            authorPosts.map((p) => (
              <div key={p.id} className="relative group">
                <CommunityPostCard
                  post={p}
                  currentUser={currentUser}
                  onReact={(type) => onReact('post', p.id, type)}
                  onOpenReactionsBreakdown={() => onOpenReactionsBreakdown('post', p.id)}
                  onSave={() => onSavePost(p.id)}
                  onComment={(t) => onCommentPost(p.id, t)}
                  onReactComment={(cid, type) => onReact('comment', cid, type)}
                  onShare={() => onShare(p.author.name)}
                  onNavigateProfile={onNavigateProfile}
                  onOpenPhoto={(imgs, idx, title, authorName, authorId) =>
                    onOpenPhoto(imgs, idx, title, undefined, authorName, authorId)
                  }
                />
                {isOwnProfile && onDeletePost && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: 'post', id: p.id, title: p.content.slice(0, 30) })}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-lg bg-rose-600 text-white px-2.5 py-1 text-xs font-bold shadow-md hover:bg-rose-700 transition z-10"
                  >
                    <Trash2 className="size-3" /> মুছুন
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'stories' && (
        <div className="space-y-4">
          {authorStories.length === 0 ? (
            <section className={cn(FEED_CARD, 'p-8 text-center font-sans text-sm text-slate-500')}>
              এখনো কোনো সক্রিয় স্টোরি প্রকাশিত হয়নি।
              {isOwnProfile && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={onOpenCreateStory}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#03EF62] px-4 py-1.5 text-xs font-bold text-[#061621]"
                  >
                    <Plus className="size-3.5" /> নতুন স্টোরি যোগ করুন
                  </button>
                </div>
              )}
            </section>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {authorStories.map((s) => (
                <div key={s.id} className={cn(FEED_CARD, 'overflow-hidden group relative flex flex-col')}>
                  <div className="relative aspect-[9/14] w-full overflow-hidden bg-slate-900">
                    <img
                      src={s.imageUrl}
                      alt={s.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      <Clock className="size-2.5" /> ২৪ ঘণ্টা সক্রিয়
                    </div>
                    {isOwnProfile && onDeleteStory && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm({ type: 'story', id: s.id, title: s.title })}
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 flex size-7 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 transition"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    <div className="absolute bottom-3 inset-x-3 text-white">
                      <span className="font-mono text-[10px] uppercase text-[#03EF62]">
                        {s.category}
                      </span>
                      <p className="mt-1 font-sans text-xs font-bold leading-snug line-clamp-2">
                        {s.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && isOwnProfile && (
        <section className={cn(FEED_CARD, 'p-4')}>
          <SavedList
            articles={savedArticles}
            posts={savedPosts}
            onOpenArticle={onOpenArticlePopup}
            onRemoveArticle={onRemoveSavedArticle}
            onRemovePost={onRemoveSavedPost}
          />
        </section>
      )}

      {tab === 'orders' && isOwnProfile && (
        <section className={cn(FEED_CARD, 'space-y-3 p-4')}>
          <SectionLabel>আপনার পূর্ববর্তী বিকাশ অর্ডারসমূহ</SectionLabel>
          {orders.length === 0 ? (
            <p className="py-6 text-center font-sans text-sm text-slate-500">
              আপনার এখনো কোনো বিকাশ অর্ডার নেই।
            </p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">#{o.orderNumber}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700">
                    TrxID: {o.trxId}
                  </span>
                </div>
                <p className="mt-1 font-sans text-xs text-slate-700">
                  {o.deliveryAddress}, {o.district} · ৳{toBengaliNumerals(o.totalBdt)}
                </p>
              </div>
            ))
          )}
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#061621] border border-slate-200 dark:border-white/10 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle className="size-5" />
              <h3 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                কন্টেন্ট মুছে ফেলার নিশ্চিতকরণ
              </h3>
            </div>
            <p className="font-sans text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              আপনি কি নিশ্চিতভাবে এই {deleteConfirm.type === 'post' ? 'পোস্টটি' : deleteConfirm.type === 'story' ? 'স্টোরিটি' : 'প্রতিবেদনটি'} মুছে ফেলতে চান? এটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে যাবে।
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'post' && onDeletePost) {
                    onDeletePost(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'story' && onDeleteStory) {
                    onDeleteStory(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'article' && onDeleteArticle) {
                    onDeleteArticle(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }}
                className="h-8 px-3 rounded-lg bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                স্থায়ীভাবে মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
