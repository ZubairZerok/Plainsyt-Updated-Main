import React from 'react';
import { MapPin, Users, Check, MessageCircle, Eye, ExternalLink, Calendar } from 'lucide-react';
import type { Article, UpcomingEvent, UserProfile } from '../types';
import { Avatar, CARD, FollowIconButton, Num, SectionLabel, cn } from './Primitives';
import { SeeAllLink } from './Header';
import { formatBengaliNumberCompact, toBengaliNumerals, totalReactions } from '../utils/pureLogic';

interface Props {
  articles: Article[];
  events: UpcomingEvent[];
  profiles: UserProfile[];
  currentUserId: string;
  followingIds: string[];
  onToggleEvent: (id: string) => void;
  onOpenRegister?: (event: UpcomingEvent) => void;
  onToggleFollow: (id: string) => void;
  onOpenArticlePopup: (id: string) => void;
  onNavigateProfile: (userId: string) => void;
  onNavigate: (path: string) => void;
  onOpenPhoto?: (src: string, title?: string, authorName?: string, authorId?: string) => void;
}

export function TrendingList({
  articles,
  onOpenPopup,
  onOpenPhoto,
}: {
  articles: Article[];
  onOpenPopup: (id: string) => void;
  onOpenPhoto?: (src: string, title?: string, authorName?: string, authorId?: string) => void;
}) {
  const ranked = [...articles]
    .sort(
      (a, b) =>
        b.stats.views +
        totalReactions(b.reactionCounts, b.stats.likes) * 5 -
        (a.stats.views + totalReactions(a.reactionCounts, a.stats.likes) * 5),
    )
    .slice(0, 4);

  if (ranked.length === 0) {
    return (
      <p className="py-4 text-center font-sans text-xs text-slate-400">
        কোনো ট্রেন্ডিং প্রতিবেদন পাওয়া যায়নি।
      </p>
    );
  }

  return (
    <ol className="divide-y divide-slate-100 dark:divide-white/10">
      {ranked.map((a, idx) => (
        <li key={a.id} className="group flex items-start gap-2 py-2.5">
          <button
            type="button"
            onClick={() => onOpenPopup(a.id)}
            className="flex min-w-0 flex-1 items-start gap-2 text-left"
          >
            <span className="w-5 shrink-0 font-display text-lg font-bold text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-[#03EF62] transition-colors">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-bangla text-xs font-semibold leading-snug text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-[#03EF62]">
                {a.title}
              </span>
              <span className="mt-1 flex items-center gap-2 font-bangla text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="size-2.5 text-[#03EF62]" />
                  {a.publishedAt}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="size-2.5 text-slate-400 dark:text-[#03EF62]" />
                  <Num>{toBengaliNumerals(a.stats.commentsCount)}</Num>
                </span>
              </span>
            </span>
          </button>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <a
              href={`/article/${a.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="নতুন ট্যাবে পড়ুন"
              aria-label="নতুন ট্যাবে পড়ুন"
              className="inline-flex size-7 items-center justify-center rounded-lg border border-slate-200/80 dark:border-[#03EF62]/40 bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-[#03EF62] hover:bg-slate-100 dark:hover:bg-[#03EF62]/10 transition shadow-2xs hover:scale-105 active:scale-95"
            >
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EventRow({
  e,
  onNavigate,
  onOpenRegister,
}: {
  e: UpcomingEvent;
  onNavigate: (path: string) => void;
  onOpenRegister?: (event: UpcomingEvent) => void;
}) {
  return (
    <li className="flex gap-2.5 py-2.5">
      <button
        type="button"
        onClick={() => onNavigate(`/events/${e.id}`)}
        className="flex w-10 shrink-0 self-start flex-col items-center overflow-hidden rounded-md border border-slate-200 bg-white text-center shadow-xs hover:border-[#03EF62] transition"
      >
        <span className="w-full bg-[#061621] py-0.5 font-mono text-[8.5px] font-bold text-[#03EF62]">
          {e.dateMonth}
        </span>
        <span className="py-0.5 font-display text-base font-bold leading-none text-slate-800">
          {e.dateDay}
        </span>
      </button>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onNavigate(`/events/${e.id}`)}
          className="block text-left text-xs font-semibold leading-snug text-slate-900 hover:text-emerald-700 hover:underline"
        >
          {e.title}
        </button>
        <span className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-500">
          <MapPin className="size-2.5 shrink-0" />
          <span className="truncate">{e.location}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1 font-bangla text-[11px] text-slate-400"><Users className="size-2.5" /><strong className="font-bold">{e.attendeesCount}</strong> নিবন্ধিত</span>
        <div className="mt-1.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenRegister ? onOpenRegister(e) : onNavigate(`/events/${e.id}`)}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition',
              e.isRegistered
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-[#03EF62] text-[#061621] hover:bg-[#02d955] font-bold',
            )}
          >
            {e.isRegistered ? (
              <>
                <Check className="size-3" />
                নিবন্ধিত
              </>
            ) : (
              'নিবন্ধন করুন'
            )}
          </button>
          <button
            type="button"
            onClick={() => onNavigate(`/events/${e.id}`)}
            className="text-[10px] text-slate-500 hover:text-slate-900 hover:underline px-1"
          >
            বিস্তারিত
          </button>
        </div>
      </span>
    </li>
  );
}

export function RightSidebar(p: Props) {
  // Only display real backend profiles if available; do not show fake mock users
  const otherProfiles = p.profiles.filter((u) => u.id !== p.currentUserId && !u.id.startsWith('mock_')).slice(0, 4);

  return (
    <aside
      className="hidden lg:block fixed right-0 top-[60px] md:top-[65px] bottom-0 w-68 xl:w-76 z-20 overflow-y-auto no-scrollbar pr-4 pl-3 pt-3.5 pb-6 border-l border-slate-200/70 dark:border-white/5 bg-background transition-colors"
      style={{ right: 0, marginRight: 0 }}
    >
      <div className="flex flex-col gap-3.5">
        <section className={cn(CARD, 'p-3')}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bangla text-[15px] font-bold text-black dark:text-white">ট্রেন্ডিং</h3>
          </div>
          <TrendingList
            articles={p.articles}
            onOpenPopup={p.onOpenArticlePopup}
            onOpenPhoto={p.onOpenPhoto}
          />
        </section>

        {p.events.length > 0 && (
          <section className={cn(CARD, 'p-3')}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bangla text-[15px] font-bold text-black dark:text-white">আসন্ন ইভেন্ট</h3>
              <SeeAllLink onClick={() => p.onNavigate('/events')}>সব দেখুন</SeeAllLink>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {p.events.slice(0, 3).map((e) => (
                <EventRow
                  key={e.id}
                  e={e}
                  onNavigate={p.onNavigate}
                  onOpenRegister={p.onOpenRegister}
                />
              ))}
            </ul>
          </section>
        )}

        <section className={cn(CARD, 'p-3')}>
          <h3 className="font-bangla text-[15px] font-bold text-black dark:text-white mb-2.5">অনুসরণ করুন</h3>

          {/* Official Plainsyt Facebook Page Card */}
          <div className="mb-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 transition">
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.facebook.com/profile.php?id=61563107955120"
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 group"
                title="PLAiNSYT Facebook Page"
              >
                <img
                  src="https://scontent.fdac181-1.fna.fbcdn.net/v/t39.30808-6/868869490_122115169682436931_6504382327291511656_n.jpg?stp=dst-jpg_tt6&cstp=mx1254x1254&ctp=s1254x1254&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGyFWAf6sNLe-0gQyPSceASMNxdebSY-u4w3F15tJj67lo6571TJcvvKbUYKo02FW6fr-aTcub2GPDiS2H_GU1n&_nc_ohc=NHKvXJuoNL8Q7kNvwEo6mYW&_nc_oc=AdpUqiVQ1_ksWUoIL1PsToHbR6vvmCkW6dInyT0jnGuPJ7tD5S9as2xr81h48Jq_2cU&_nc_zt=23&_nc_ht=scontent.fdac181-1.fna&_nc_gid=YzL8dL2FWkyI6zcoEygoGg&_nc_ss=7b2a8&oh=00_AQRL-c7zWElbtAHUl8yM6pbw-NdAenccSqpRb0PNo2R14w&oe=6AEE126F"
                  alt="PLAiNSYT"
                  className="size-9 rounded-full object-cover ring-2 ring-[#1877F2]/40 group-hover:ring-[#1877F2] transition"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#1877F2] text-white ring-1 ring-white dark:ring-[#061621]">
                  <svg className="size-2.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </span>
              </a>
              <div className="min-w-0 flex-1">
                <a
                  href="https://www.facebook.com/profile.php?id=61563107955120"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs font-bold text-slate-900 dark:text-white hover:text-[#1877F2] transition"
                >
                  PLAiNSYT
                </a>
                <span className="inline-flex items-center gap-1 font-bangla text-[10.5px] font-medium text-[#1877F2] dark:text-blue-400">
                  <span>অফিসিয়াল ফেসবুক পেজ</span>
                </span>
              </div>
              <a
                href="https://www.facebook.com/profile.php?id=61563107955120"
                target="_blank"
                rel="noopener noreferrer"
                title="ফেসবুকে ফলো করুন"
                className="h-6.5 shrink-0 inline-flex items-center gap-1 rounded-full px-3 text-[11px] font-bold bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-xs active:scale-95 transition"
              >
                ফলো
              </a>
            </div>
          </div>

          {/* User Profiles to follow */}
          {otherProfiles.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 px-0.5">গবেষক ও লেখক</p>
              <ul className="divide-y divide-slate-100 dark:divide-white/5">
                {otherProfiles.map((s) => {
                  const isFollowing = (p.followingIds ?? []).includes(s.id);
                  return (
                    <li key={s.id} className="flex items-center gap-2 py-2">
                      <button
                        type="button"
                        onClick={() => p.onNavigateProfile(s.id)}
                        className="shrink-0"
                      >
                        <Avatar src={s.avatar || 'PS'} name={s.name} size="size-7" />
                      </button>
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => p.onNavigateProfile(s.id)}
                          className="block truncate text-left text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                        >
                          {s.name}
                        </button>
                        <span className="block truncate text-[10px] text-slate-400">
                          {s.focusArea || s.role || 'লেখক'}
                        </span>
                      </span>
                      <FollowIconButton
                        isFollowing={isFollowing}
                        onClick={() => p.onToggleFollow(s.id)}
                        className="size-6 shrink-0"
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
