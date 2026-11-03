import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Plane, Sprout, CloudSun, Wheat, Home, Landmark, Layers, Cpu, UserRound } from 'lucide-react';
import type { TopicStory, UserProfile } from '../types';
import { Avatar } from './Primitives';

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
  onOpen: (i: number) => void;
  onCreate: () => void;
  onNavigateProfile?: (userId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: 'smooth' });

  return (
    <section className="group/car relative" aria-label="Topic stories">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-3 py-1 sm:px-0.5 md:gap-3 md:pb-2"
      >
        {/* Create Story Card (always available to add a Story/Reel to Supabase) */}
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="relative flex aspect-[9/16] w-[104px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-sm hover:shadow-md transition-all md:aspect-[3/4.4] md:w-[138px]"
          >
            <div
              style={{
                background:
                  currentUser?.coverGradient ||
                  'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
              }}
              className="flex h-[68%] w-full items-center justify-center"
            >
              {/* Logged-out must NOT fall back to name="User" → Avatar initials "U" */}
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
            <span className="absolute left-1/2 top-[68%] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-canvas-card bg-pine-600 text-white">
              <Plus className="size-5" strokeWidth={3} />
            </span>
            <span className="flex flex-1 items-end justify-center pb-2 text-[12px] font-semibold text-pine-900">
              Create story
            </span>
          </button>
        )}

        {stories.map((s, i) => {
          const Icon = ICONS[s.iconName] ?? Sprout;
          return (
            <div
              key={s.id}
              className="group relative aspect-[9/16] w-[104px] shrink-0 snap-start overflow-hidden rounded-2xl bg-pine-800 text-left md:aspect-[3/4.4] md:w-[138px] md:border md:border-slate-200/80 dark:md:border-white/10 md:shadow-sm md:hover:shadow-md transition-all"
            >
              <button
                type="button"
                onClick={() => onOpen(i)}
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
                <span className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                <span className="absolute left-2 top-2 hidden size-8 items-center justify-center rounded-lg border border-white/50 bg-black/30 text-white backdrop-blur-sm md:flex">
                  <Icon className="size-4" />
                </span>
                <span className="absolute inset-x-2 bottom-2">
                  <span className="mb-1 hidden truncate font-mono text-[9px] uppercase tracking-wider text-[#bbf0d8] md:block">
                    {s.category}
                  </span>
                  <span className="line-clamp-3 text-[12px] font-semibold leading-tight text-white md:text-[12.5px]">
                    {s.title}
                  </span>
                </span>
              </button>
              {s.authorName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.authorId && onNavigateProfile) onNavigateProfile(s.authorId);
                  }}
                  className="absolute left-2 top-2 z-10 md:right-2 md:left-auto"
                  title={s.authorName}
                >
                  <Avatar src={s.authorAvatar ?? 'PS'} name={s.authorName} size="size-8" ring />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {stories.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous"
            className="absolute left-1 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1e15]/95 text-slate-800 dark:text-white opacity-0 shadow-md transition group-hover/car:opacity-100 md:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next"
            className="absolute right-1 top-1/2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1e15]/95 text-slate-800 dark:text-white opacity-0 shadow-md transition group-hover/car:opacity-100 md:flex"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  );
}
