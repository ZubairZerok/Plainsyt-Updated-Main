import { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Plane, Sprout, CloudSun, Wheat, Home, Landmark, Layers, Cpu, UserRound } from 'lucide-react';
import type { TopicStory, UserProfile } from '../types';
import { canCreateStory } from '../lib/auth';
import { Avatar, Num } from './Primitives';
import { YouTubeMark } from './YouTubeMark';
import { toBengaliNumerals } from '../utils/pureLogic';

const ICONS = {
  drone: Plane,
  seedling: Sprout,
  climate: CloudSun,
  food: Wheat,
  rural: Home,
  policy: Landmark,
  soil: Layers,
  tech: Cpu,
} as const;

export function TopicStoriesCarousel({
  stories,
  currentUser,
  onOpen,
  onCreate,
  onNavigateProfile,
}: {
  stories: TopicStory[];
  currentUser: UserProfile | null;
  onOpen: (storyIdOrIndex: string | number) => void;
  onCreate: () => void;
  onNavigateProfile?: (userId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: 'smooth' });

  // Stories from one account grouped together (Facebook / Instagram stories tray)
  const accountGroups = useMemo(() => {
    const groups: {
      authorId: string;
      authorName: string;
      authorAvatar: string;
      stories: TopicStory[];
      latestStory: TopicStory;
    }[] = [];

    for (const story of stories) {
      const authorId = story.authorId || 'usr-plainsyt-admin';
      let g = groups.find((grp) => grp.authorId === authorId);
      if (!g) {
        g = {
          authorId,
          authorName: story.authorName || 'PLAiNSYT',
          authorAvatar: story.authorAvatar || '/logos/icon.png',
          stories: [],
          latestStory: story,
        };
        groups.push(g);
      }
      g.stories.push(story);
      g.latestStory = story;
    }
    return groups;
  }, [stories]);

  if (stories.length === 0 && !currentUser) {
    return null;
  }

  return (
    <section className="group/car relative" aria-label="Topic stories">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-3 py-1 sm:px-0.5 md:gap-3 md:pb-2"
      >
        {/* Create Story Card (Only available for authorized editorial creators) */}
        {onCreate && canCreateStory(currentUser) && (
          <button
            type="button"
            onClick={onCreate}
            className="relative flex aspect-[9/16] w-[106px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-xs hover:shadow-md transition-all active:scale-[0.98] md:aspect-[3/4.4] md:w-[138px]"
          >
            <div
              style={{
                background:
                  currentUser?.coverGradient ||
                  'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
              }}
              className="flex h-[68%] w-full items-center justify-center relative overflow-hidden"
            >
              {currentUser ? (
                <Avatar src={currentUser.avatar} name={currentUser.name} size="size-12" />
              ) : (
                <span
                  className="flex size-12 items-center justify-center rounded-full border-2 border-white/40 bg-black/35 text-white shadow-md backdrop-blur-sm"
                  aria-hidden
                >
                  <UserRound className="size-6" strokeWidth={2.25} />
                </span>
              )}
            </div>
            <span className="absolute left-1/2 top-[68%] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-canvas-card bg-[#03EF62] text-[#061621] shadow-sm font-bold">
              <Plus className="size-5 stroke-[2.8]" />
            </span>
            <span className="flex flex-1 items-end justify-center pb-2.5 font-bangla text-[12px] font-bold text-slate-800 dark:text-slate-200">
              স্টোরি যোগ করুন
            </span>
          </button>
        )}

        {/* Account Story Cards — Grouped by Account */}
        {accountGroups.map((g) => {
          const s = g.latestStory;
          const Icon = ICONS[s.iconName] ?? Sprout;
          const storyCount = g.stories.length;

          return (
            <div
              key={g.authorId}
              className="group relative aspect-[9/16] w-[106px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#061621] text-left md:aspect-[3/4.4] md:w-[138px] border border-slate-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all"
            >
              <button
                type="button"
                onClick={() => onOpen(s.id)}
                className="absolute inset-0 size-full text-left"
              >
                {s.imageUrl ? (
                  <img
                    src={s.imageUrl}
                    alt={s.title}
                    className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-pine-900 via-pine-700 to-pine-500" />
                )}
                <span className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />

                {/* Multiple stories indicator badge */}
                {storyCount > 1 && (
                  <span className="absolute top-2 right-2 z-10 rounded-full bg-black/60 backdrop-blur-md px-1.5 py-0.5 font-bangla text-[10px] font-bold text-[#03EF62] border border-[#03EF62]/40 shadow-xs">
                    <Num>{toBengaliNumerals(storyCount)}</Num> টি
                  </span>
                )}

                {s.videoUrl && (s.videoUrl.includes('youtube.com') || s.videoUrl.includes('youtu.be')) && storyCount <= 1 && (
                  <span className="absolute top-2 right-2 z-10 rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-xs">
                    <YouTubeMark size="sm" />
                  </span>
                )}

                {/* Category kicker */}
                <span className="absolute inset-x-2 bottom-2">
                  <span className="mb-0.5 hidden truncate font-bangla text-[9.5px] font-semibold text-[#03EF62] drop-shadow md:block">
                    {s.category}
                  </span>
                  <span className="line-clamp-2 font-bangla text-[12px] font-bold leading-tight text-white drop-shadow md:text-[12.5px]">
                    {s.title}
                  </span>
                </span>
              </button>

              {/* Author Avatar with Facebook/IG styled multi-color gradient ring */}
              {g.authorName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (g.authorId && onNavigateProfile) onNavigateProfile(g.authorId);
                  }}
                  className="absolute left-2.5 top-2.5 z-20 rounded-full p-0.5 bg-gradient-to-tr from-[#03EF62] via-[#00b4d8] to-[#f72585] shadow-md transition hover:scale-105"
                  title={g.authorName}
                >
                  <Avatar src={g.authorAvatar} name={g.authorName} size="size-7.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {accountGroups.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="absolute left-1 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1e15]/95 text-slate-800 dark:text-white opacity-0 shadow-md transition group-hover/car:opacity-100 md:flex active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next"
            className="absolute right-1 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1e15]/95 text-slate-800 dark:text-white opacity-0 shadow-md transition group-hover/car:opacity-100 md:flex active:scale-95"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  );
}
