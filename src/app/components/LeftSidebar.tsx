import React from 'react';
import { Newspaper, Settings, Compass, CalendarDays, Plane, Wheat, BookOpenText, CloudSun, Snowflake, Rocket } from 'lucide-react';
import type { Article, StoryReel, UserProfile } from '../types';
import { Avatar, SectionLabel, cn } from './Primitives';
import { toBengaliNumerals } from '../utils/pureLogic';

export const PILLAR_DEFS = [
  { key: 'drone', label: 'Agri-Tech & Drones', bn: 'এগ্রি-টেক ও ড্রোন', cats: ['এগ্রি-টেক ও ড্রোন'], icon: Plane },
  { key: 'crops', label: 'Crops & Agronomy', bn: 'শস্য ও কৃষিবিজ্ঞান', cats: ['শস্য ও কৃষিবিজ্ঞান'], icon: Wheat },
  { key: 'research', label: 'Research Explained', bn: 'গবেষণা সহজ ভাষায়', cats: ['গবেষণা সহজ ভাষায়'], icon: BookOpenText },
  { key: 'climate', label: 'Climate & Salinity', bn: 'জলবায়ু ও স্থায়িত্ব', cats: ['জলবায়ু ও স্থায়িত্ব', 'মৎস্য ও প্রাণিসম্পদ'], icon: CloudSun },
  { key: 'cold', label: 'Food Cold Chain', bn: 'খাদ্য ও কোল্ড চেইন', cats: ['খাদ্য ও কোল্ড চেইন'], icon: Snowflake },
  { key: 'startup', label: 'Startups & IoT', bn: 'স্টার্টআপ ও উদ্ভাবন', cats: ['স্টার্টআপ ও উদ্ভাবন'], icon: Rocket },
] as const;

interface Props {
  currentUser: UserProfile | null;
  articles: Article[];
  reels: StoryReel[];
  savedCount: number;
  onOpenSaved: () => void;
  onOpenReels: () => void;
  onOpenAI?: () => void;
  onOpenProfileSettings: () => void;
  onOpenAuth?: () => void;
  onNavigate: (path: string) => void;
  activePillar: string | null;
  onPillar: (k: string | null) => void;
}

export function LeftSidebar(p: Props) {
  const shortcuts = [
    {
      label: 'নিউজফিড',
      icon: Newspaper,
      onClick: () => p.onNavigate('/'),
      badge: null,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'এক্সপ্লোর',
      icon: Compass,
      onClick: () => p.onNavigate('/explore'),
      badge: null,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'ইভেন্টস',
      icon: CalendarDays,
      onClick: () => p.onNavigate('/events'),
      badge: null,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];

  return (
    <aside
      className="hidden lg:block fixed left-0 top-[60px] md:top-[65px] bottom-0 w-56 xl:w-64 z-20 overflow-y-auto no-scrollbar pl-4 pr-3 pt-3.5 pb-6 border-r border-slate-200/70 dark:border-white/5 bg-background transition-colors"
      style={{ left: 0, marginLeft: 0 }}
    >
      <div className="flex flex-col gap-3.5">
        {p.currentUser ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm">
            <button
              type="button"
              onClick={() => p.onNavigate(`/profile/${p.currentUser!.id}`)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Avatar src={p.currentUser.avatar} name={p.currentUser.name} size="size-8" online />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-slate-900">
                  {p.currentUser.name}
                </span>
                <span className="block truncate font-mono text-[10px] text-slate-500">
                  {p.currentUser.role || 'লেখক'}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={p.onOpenProfileSettings}
              aria-label="Profile settings"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <Settings className="size-3.5" />
            </button>
          </div>
        ) : null}

        <nav className="flex flex-col gap-1">
          {shortcuts.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={s.onClick}
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:bg-slate-100/90 dark:hover:bg-white/5 active:scale-98"
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 dark:border-white/10 transition-all duration-200 group-hover:scale-105 group-hover:bg-[#00ED64] group-hover:bg-[#03EF62] group-hover:border-[#03EF62] group-hover:text-[#061621] group-hover:shadow-sm',
                  s.tone,
                )}
              >
                <s.icon className="size-5 transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="flex-1 font-bangla text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                {s.label}
              </span>
              {s.badge && (
                <span className="rounded-full bg-slate-900 dark:bg-white/10 px-2 py-0.5 font-mono text-[9.5px] font-bold text-white">
                  {s.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Topics */}
        <div className="border-t border-slate-200/80 dark:border-white/10 pt-3">
          <h3 className="mb-2.5 px-1 font-bangla text-[14px] font-bold text-black dark:text-white">
            জনপ্রিয় বিষয়সমূহ
          </h3>
          <div className="flex flex-col gap-1">
            {[
              { name: 'বিজ্ঞান ও প্রযুক্তি', cat: 'টেকনোলজি' },
              { name: 'কৃষি ও খাদ্য নিরাপত্তা', cat: 'কৃষি' },
              { name: 'পরিবেশ ও জলবায়ু', cat: 'পরিবেশ' },
              { name: 'অর্থনীতি ও ব্যবসা', cat: 'অর্থনীতি' },
              { name: 'সাহিত্য ও শিল্প', cat: 'সংস্কৃতি' },
            ].map((topic) => (
              <button
                key={topic.name}
                type="button"
                onClick={() => p.onNavigate('/explore')}
                className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-left font-bangla text-[13px] font-medium text-black dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <span className="truncate group-hover:text-[#008f3c] dark:group-hover:text-[#03EF62] transition-colors">{topic.name}</span>
                <Sparkles className="size-3 text-slate-400 group-hover:text-[#03EF62] transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
