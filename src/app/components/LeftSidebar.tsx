import React from 'react';
import {
  Newspaper, Settings, Compass, CalendarDays, Bookmark, Film,
  Plane, Wheat, BookOpenText, CloudSun, Snowflake, Rocket, Sparkles,
} from 'lucide-react';
import type { Article, StoryReel, UserProfile } from '../types';
import { Avatar, VerifiedBadge, cn } from './Primitives';
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
      onClick: () => {
        p.onPillar(null);
        p.onNavigate('/');
      },
      badge: null,
      tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#03EF62]',
    },
    {
      label: 'এক্সপ্লোর',
      icon: Compass,
      onClick: () => p.onNavigate('/explore'),
      badge: null,
      tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      label: 'ইভেন্টস',
      icon: CalendarDays,
      onClick: () => p.onNavigate('/events'),
      badge: null,
      tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      label: 'সংরক্ষিত পোস্ট',
      icon: Bookmark,
      onClick: p.onOpenSaved,
      badge: p.savedCount > 0 ? toBengaliNumerals(p.savedCount) : null,
      tone: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
    },
    {
      label: 'কৃষি রিলস',
      icon: Film,
      onClick: p.onOpenReels,
      badge: null,
      tone: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    },
  ];

  return (
    <aside
      className="hidden lg:block shrink-0 w-56 xl:w-64 sticky top-[65px] md:top-[72px] h-[calc(100vh-75px)] overflow-y-auto no-scrollbar pl-2 pr-3 pt-3.5 pb-8 border-r border-slate-200/70 dark:border-white/5 bg-background transition-colors z-10"
      aria-label="Platform Navigation"
    >
      <div className="flex flex-col gap-3.5">
        {p.currentUser ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-white/5 p-2 shadow-xs">
            <button
              type="button"
              onClick={() => p.onNavigate(`/profile/${p.currentUser!.id}`)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <Avatar src={p.currentUser.avatar} name={p.currentUser.name} size="size-8" online />
              <span className="min-w-0">
                <span className="flex items-center gap-1">
                  <span className="block truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {p.currentUser.name}
                  </span>
                  {p.currentUser.isVerified && <VerifiedBadge />}
                </span>
                <span className="block truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {p.currentUser.role || 'লেখক'}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={p.onOpenProfileSettings}
              aria-label="Profile settings"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition"
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
              className="group flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-150 hover:bg-slate-100/90 dark:hover:bg-white/5 active:scale-98 cursor-pointer"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/70 dark:border-white/10 transition-all duration-200 group-hover:scale-105 group-hover:bg-[#00ED64] group-hover:bg-[#03EF62] group-hover:border-[#03EF62] group-hover:text-[#061621] group-hover:shadow-sm',
                  s.tone,
                )}
              >
                <s.icon className="size-4 transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span className="flex-1 font-bangla text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-black dark:group-hover:text-white transition-colors">
                {s.label}
              </span>
              {s.badge && (
                <span className="rounded-full bg-slate-900 dark:bg-white/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-white">
                  {s.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick Topics & Research Pillars */}
        <div className="border-t border-slate-200/80 dark:border-white/10 pt-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="font-bangla text-[13px] font-bold text-black dark:text-white">
              কৃষি গবেষণা স্তম্ভ
            </h3>
            {p.activePillar && (
              <button
                type="button"
                onClick={() => p.onPillar(null)}
                className="text-[10px] text-[#03EF62] hover:underline font-mono"
              >
                রিসেট
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {PILLAR_DEFS.map((pillar) => {
              const isActive = p.activePillar === pillar.key;
              const Icon = pillar.icon;
              return (
                <button
                  key={pillar.key}
                  type="button"
                  onClick={() => p.onPillar(isActive ? null : pillar.key)}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-bangla text-[12.5px] font-medium transition cursor-pointer',
                    isActive
                      ? 'bg-[#03EF62]/15 text-[#006f30] dark:text-[#03EF62] font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10',
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-[#03EF62]' : 'text-slate-400 group-hover:text-[#03EF62] transition-colors')} />
                    <span className="truncate">{pillar.bn}</span>
                  </span>
                  <Sparkles className="size-3 text-slate-400 group-hover:text-[#03EF62] transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
