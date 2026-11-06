import { type HTMLAttributes } from 'react';
import { FEED_CARD, CARD, cn } from './Primitives';

/**
 * Base shimmering box with GPU-accelerated gradient wave
 */
export function SkeletonBox({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'skeleton-shimmer bg-slate-200/75 dark:bg-white/5 rounded-md transition-all',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Modern Sleek Page Loading Banner / Bar
 * Shows "কনটেন্ট লোড হচ্ছে..." with glowing lime dot
 */
export function PageLoadingIndicator({ label = 'কনটেন্ট প্রস্তুত হচ্ছে...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-2 px-4 rounded-full bg-white/80 dark:bg-[#071f2d]/80 border border-slate-200/80 dark:border-[#03EF62]/30 shadow-xs backdrop-blur-md mx-auto w-fit mb-3 animate-in fade-in duration-200">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03EF62] opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-[#03EF62]" />
      </span>
      <span className="font-bangla text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide">
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. POST & CARD SKELETONS                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ArticleCard Skeleton (1:1 Dimensional Parity with ArticleCard.tsx)
 */
export function ArticleCardSkeleton({ lead = false }: { lead?: boolean }) {
  return (
    <article
      className={cn(FEED_CARD, 'overflow-hidden skeleton-pulse')}
      aria-hidden="true"
    >
      {/* Cover Image Placeholder */}
      <SkeletonBox
        className={cn(
          'w-full rounded-none',
          lead ? 'aspect-[16/9]' : 'aspect-[2/1]',
        )}
      />

      <div className="px-4 pb-3 pt-4 sm:px-5">
        {/* Meta row: category, read time, date, new tab icon */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-5 w-20 rounded-full" />
          <SkeletonBox className="h-4 w-18 rounded-md" />
          <SkeletonBox className="h-4 w-24 rounded-md" />
          <SkeletonBox className="ml-auto size-7 rounded-full" />
        </div>

        {/* Title Lines */}
        <div className="mt-3.5 space-y-2">
          <SkeletonBox
            className={cn('h-6 sm:h-7 rounded-lg', lead ? 'w-11/12' : 'w-4/5')}
          />
          <SkeletonBox className="h-6 sm:h-7 w-3/5 rounded-lg" />
        </div>

        {/* Subtitle Lines */}
        <div className="mt-2.5 space-y-1.5">
          <SkeletonBox className="h-4 w-full rounded-md" />
          <SkeletonBox className="h-4 w-3/4 rounded-md" />
        </div>

        {/* Author Byline */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-slate-200/60 dark:border-white/10 pt-3">
          <div className="flex items-center gap-2.5">
            <SkeletonBox className="size-9 rounded-full shrink-0" />
            <div className="space-y-1">
              <SkeletonBox className="h-4 w-28 rounded-md" />
              <SkeletonBox className="h-3 w-36 rounded-md" />
            </div>
          </div>
          <SkeletonBox className="hidden sm:block h-8 w-20 rounded-full shrink-0" />
        </div>

        {/* LinkedIn Reaction Summary */}
        <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              <SkeletonBox className="size-4.5 rounded-full" />
              <SkeletonBox className="size-4.5 rounded-full" />
              <SkeletonBox className="size-4.5 rounded-full" />
            </div>
            <SkeletonBox className="h-3.5 w-14 rounded-md ml-1" />
          </div>
          <SkeletonBox className="h-3.5 w-20 rounded-md" />
        </div>
      </div>

      {/* 4-column Action Bar */}
      <div className="grid grid-cols-4 items-center gap-1 border-t border-slate-200/60 dark:border-white/10 px-1.5 py-1 sm:px-3">
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
      </div>
    </article>
  );
}

/**
 * CommunityPost Skeleton (1:1 Dimensional Parity with CommunityPostCard.tsx)
 */
export function CommunityPostSkeleton({ withMedia = false }: { withMedia?: boolean }) {
  return (
    <article
      className={cn(FEED_CARD, 'p-3 sm:p-4 skeleton-pulse')}
      aria-hidden="true"
    >
      {/* Header with Avatar, Name, and Menu */}
      <div className="flex items-start gap-2.5">
        <SkeletonBox className="size-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-32 rounded-md" />
            <SkeletonBox className="size-3.5 rounded-full" />
          </div>
          <SkeletonBox className="h-3 w-44 rounded-md" />
        </div>
        <SkeletonBox className="size-7 rounded-full shrink-0" />
      </div>

      {/* Post Text Body */}
      <div className="mt-3.5 space-y-2">
        <SkeletonBox className="h-4 w-full rounded-md" />
        <SkeletonBox className="h-4 w-11/12 rounded-md" />
        <SkeletonBox className="h-4 w-3/5 rounded-md" />
      </div>

      {/* Optional Media Grid Placeholder */}
      {withMedia && (
        <SkeletonBox className="mt-3 aspect-[16/9] w-full rounded-xl" />
      )}

      {/* LinkedIn Reaction Summary */}
      <div className="mt-3.5 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1">
            <SkeletonBox className="size-4 rounded-full" />
            <SkeletonBox className="size-4 rounded-full" />
          </div>
          <SkeletonBox className="h-3.5 w-16 rounded-md ml-1" />
        </div>
        <SkeletonBox className="h-3.5 w-16 rounded-md" />
      </div>

      {/* 4-column Action Bar */}
      <div className="mt-2 grid grid-cols-4 items-center gap-1 border-t border-slate-200/60 dark:border-white/10 pt-1">
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
      </div>
    </article>
  );
}

/**
 * IntegratedReel Skeleton (1:1 Dimensional Parity with IntegratedReelCard.tsx)
 */
export function IntegratedReelSkeleton() {
  return (
    <article
      className={cn(FEED_CARD, 'overflow-hidden skeleton-pulse')}
      aria-hidden="true"
    >
      {/* Top Bar: Creator Info & Follow Button */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="size-9 rounded-full shrink-0" />
          <div className="space-y-1">
            <SkeletonBox className="h-4 w-28 rounded-md" />
            <SkeletonBox className="h-3 w-16 rounded-md" />
          </div>
        </div>
        <SkeletonBox className="h-7 w-20 rounded-full shrink-0" />
      </div>

      {/* Video Container Area with Centered Play Button */}
      <div className="relative aspect-[4/5] sm:aspect-[16/10] w-full bg-slate-900/10 dark:bg-black/30 flex flex-col items-center justify-center p-4">
        <SkeletonBox className="size-14 rounded-full opacity-70" />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
          <SkeletonBox className="h-4 w-48 rounded-md" />
          <SkeletonBox className="h-4 w-12 rounded-md" />
        </div>
      </div>

      {/* Reaction Action Bar */}
      <div className="grid grid-cols-4 items-center gap-1 border-t border-slate-200/60 dark:border-white/10 px-2 py-1.5 sm:px-3">
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
        <SkeletonBox className="h-8 w-full rounded-lg" />
      </div>
    </article>
  );
}

/**
 * Stories Carousel Skeleton (1:1 Parity with TopicStoriesCarousel.tsx)
 */
export function StoriesCarouselSkeleton() {
  return (
    <div
      className="flex snap-x gap-2 overflow-x-hidden px-3 py-1 sm:px-0.5 md:gap-3 md:pb-2 skeleton-pulse"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="relative h-40 sm:h-44 w-26 sm:w-28 shrink-0 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#071f2d]/70 p-2.5 flex flex-col justify-between overflow-hidden shadow-xs"
        >
          {/* Avatar Ring */}
          <div className="relative">
            <SkeletonBox className="size-9 rounded-full ring-2 ring-[#03EF62]/30 ring-offset-2 ring-offset-white dark:ring-offset-[#071f2d]" />
          </div>
          {/* Bottom Label & Pill */}
          <div className="space-y-1">
            <SkeletonBox className="h-3.5 w-16 rounded-md" />
            <SkeletonBox className="h-2.5 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. FULL PAGE SKELETONS                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Feed Page Skeleton (Home /)
 */
export function FeedPageSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:gap-5 animate-in fade-in duration-200">
      <PageLoadingIndicator label="হোম ফিড ও প্রকাশনাসমূহ প্রস্তুত হচ্ছে..." />
      {/* Stories Carousel */}
      <div className="bg-canvas-card py-2.5 sm:bg-transparent sm:py-0">
        <StoriesCarouselSkeleton />
      </div>

      {/* Interleaved Post Feed Stream */}
      <ArticleCardSkeleton lead={true} />
      <CommunityPostSkeleton withMedia={true} />
      <IntegratedReelSkeleton />
      <CommunityPostSkeleton withMedia={false} />
      <ArticleCardSkeleton lead={false} />
    </div>
  );
}

/**
 * Explore Page Skeleton (/explore)
 */
export function ExplorePageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <PageLoadingIndicator label="এক্সপ্লোর ও বিষয়ভিত্তিক গবেষণা সূচি লোড হচ্ছে..." />

      {/* Header */}
      <div className="px-3 pb-1 pt-2 sm:px-0 space-y-2">
        <SkeletonBox className="h-3 w-28 rounded-md" />
        <SkeletonBox className="h-8 sm:h-10 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Topic Filter Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-[#071f2d]/70">
        <SkeletonBox className="h-10 w-44 rounded-xl" />
        <SkeletonBox className="h-6 w-32 rounded-md" />
      </div>

      {/* Articles List Card */}
      <div className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <SkeletonBox className="h-4 w-36 rounded-md" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <SkeletonBox className="h-18 w-24 shrink-0 rounded-md" />
                <div className="flex-1 space-y-2 min-w-0">
                  <SkeletonBox className="h-3 w-20 rounded-md" />
                  <SkeletonBox className="h-4 w-5/6 rounded-md" />
                  <SkeletonBox className="h-3 w-40 rounded-md" />
                </div>
              </div>
              <SkeletonBox className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Events Page Skeleton (/events)
 */
export function EventsPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <PageLoadingIndicator label="আসন্ন ইভেন্ট ও সম্মেলন তালিকা প্রস্তুত হচ্ছে..." />

      {/* Header */}
      <div className="px-3 pb-1 pt-2 sm:px-0 space-y-2">
        <SkeletonBox className="h-3 w-28 rounded-md" />
        <SkeletonBox className="h-8 sm:h-10 w-72 rounded-xl" />
        <SkeletonBox className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Events Grid */}
      <div className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#071f2d] p-4 space-y-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <SkeletonBox className="size-12 rounded-lg" />
                  <SkeletonBox className="h-5 w-28 rounded-md" />
                </div>
                <div className="mt-3 space-y-2">
                  <SkeletonBox className="h-5 w-11/12 rounded-md" />
                  <SkeletonBox className="h-4 w-3/4 rounded-md" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <SkeletonBox className="h-3.5 w-32 rounded-md" />
                  <SkeletonBox className="h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2.5">
                <SkeletonBox className="h-9 flex-1 rounded-lg" />
                <SkeletonBox className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Store Page Skeleton (/store)
 */
export function StorePageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <PageLoadingIndicator label="এগ্রো শপ ও বই-পুস্তকের সম্ভার লোড হচ্ছে..." />

      {/* Header */}
      <div className="px-3 pb-1 pt-2 sm:px-0 space-y-2">
        <SkeletonBox className="h-3 w-28 rounded-md" />
        <SkeletonBox className="h-8 sm:h-10 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-80 max-w-full rounded-md" />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-3 px-3 sm:gap-4 sm:px-0 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(CARD, 'flex flex-col overflow-hidden border border-slate-200 dark:border-white/10')}
          >
            <SkeletonBox className="aspect-[4/3] w-full rounded-none" />
            <div className="p-3 space-y-2 flex flex-col flex-1">
              <SkeletonBox className="h-4 w-4/5 rounded-md" />
              <SkeletonBox className="h-3 w-full rounded-md" />
              <div className="mt-auto pt-3 flex items-center justify-between">
                <SkeletonBox className="h-5 w-16 rounded-md" />
                <SkeletonBox className="h-7 w-20 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Ideas Page Skeleton (/ideas)
 */
export function IdeasPageSkeleton() {
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <PageLoadingIndicator label="আইডিয়া এক্সচেঞ্জ ও প্রস্তাবনাসমূহ প্রস্তুত হচ্ছে..." />

      {/* Header */}
      <div className="px-3 pb-1 pt-2 sm:px-0 space-y-2">
        <SkeletonBox className="h-3 w-28 rounded-md" />
        <SkeletonBox className="h-8 sm:h-10 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 max-w-full rounded-md" />
      </div>

      {/* Input Form Box */}
      <div className={cn(FEED_CARD, 'p-4 space-y-3')}>
        <SkeletonBox className="h-9 w-full rounded-lg" />
        <div className="flex gap-2">
          <SkeletonBox className="h-9 flex-1 rounded-lg" />
          <SkeletonBox className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Ideas List */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(FEED_CARD, 'flex gap-3.5 p-4')}>
            <SkeletonBox className="w-12 h-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBox className="h-3 w-20 rounded-md" />
              <SkeletonBox className="h-5 w-3/4 rounded-md" />
              <SkeletonBox className="h-3.5 w-full rounded-md" />
              <SkeletonBox className="h-3 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Notifications Page Skeleton (/notifications)
 */
export function NotificationsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <PageLoadingIndicator label="নোটিফিকেশন ও কার্যকলাপ লোড হচ্ছে..." />

      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-0">
        <div className="space-y-1.5">
          <SkeletonBox className="h-3 w-32 rounded-md" />
          <SkeletonBox className="h-8 w-48 rounded-xl" />
          <SkeletonBox className="h-3.5 w-40 rounded-md" />
        </div>
        <SkeletonBox className="h-9 w-36 rounded-lg" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-2 px-3 sm:px-0">
        <SkeletonBox className="h-7 w-20 rounded-lg" />
        <SkeletonBox className="h-7 w-20 rounded-lg" />
        <SkeletonBox className="h-7 w-20 rounded-lg" />
      </div>

      {/* Notifications List */}
      <div className={cn(FEED_CARD, 'divide-y divide-slate-100 dark:divide-white/10')}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 sm:p-4">
            <SkeletonBox className="size-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <SkeletonBox className="h-4 w-4/5 rounded-md" />
              <SkeletonBox className="h-3 w-24 rounded-md" />
            </div>
            <SkeletonBox className="h-8 w-20 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Profile Page Skeleton (/profile & /profile/:userId)
 */
export function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <PageLoadingIndicator label="প্রোফাইল তথ্য ও প্রকাশনাসমূহ প্রস্তুত হচ্ছে..." />

      <section className={cn(FEED_CARD, 'overflow-hidden')}>
        {/* Cover Banner */}
        <SkeletonBox className="h-36 sm:h-52 w-full rounded-none" />

        <div className="-mt-12 px-4 pb-5 sm:px-6">
          {/* Avatar and Buttons */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="relative">
              <SkeletonBox className="size-20 sm:size-24 rounded-full border-4 border-white dark:border-[#071f2d]" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBox className="h-8 w-24 rounded-lg" />
              <SkeletonBox className="h-8 w-20 rounded-lg" />
            </div>
          </div>

          {/* Profile Name & Details */}
          <div className="mt-3.5 space-y-1.5">
            <SkeletonBox className="h-6 w-48 rounded-lg" />
            <SkeletonBox className="h-4 w-36 rounded-md" />
            <SkeletonBox className="h-3.5 w-60 rounded-md" />
            <SkeletonBox className="h-4 w-3/4 rounded-md pt-2" />
          </div>

          {/* Stats Badges Row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex border-t border-slate-200 dark:border-white/10 px-4 py-2.5 gap-4">
          <SkeletonBox className="h-5 w-24 rounded-md" />
          <SkeletonBox className="h-5 w-20 rounded-md" />
          <SkeletonBox className="h-5 w-20 rounded-md" />
        </div>
      </section>

      {/* Tab Content Placeholder Skeletons */}
      <ArticleCardSkeleton lead={false} />
      <CommunityPostSkeleton withMedia={false} />
    </div>
  );
}

/**
 * Researcher Studio Skeleton (/me/publications, etc.)
 */
export function ResearcherStudioSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <PageLoadingIndicator label="রিসার্চার স্টুডিও ডাটা প্রস্তুত হচ্ছে..." />

      {/* Studio Banner */}
      <div className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        <div className="flex items-center gap-3.5">
          <SkeletonBox className="size-14 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <SkeletonBox className="h-3 w-32 rounded-md" />
            <SkeletonBox className="h-6 w-56 rounded-md" />
            <SkeletonBox className="h-3.5 w-80 max-w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(FEED_CARD, 'p-3.5 space-y-2')}>
            <SkeletonBox className="h-3 w-16 rounded-md" />
            <SkeletonBox className="h-7 w-20 rounded-lg" />
            <SkeletonBox className="h-2.5 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {/* List items */}
      <ArticleCardSkeleton lead={false} />
    </div>
  );
}

/**
 * Article Reader Skeleton (Modal and Standalone /article/:id view)
 */
export function ArticleReaderSkeleton() {
  return (
    <article
      className="rounded-t-3xl border border-slate-200/80 dark:border-[#03EF62]/40 bg-canvas-card shadow-2xl sm:rounded-3xl overflow-hidden skeleton-pulse animate-in slide-in-from-bottom-6 duration-200"
      aria-hidden="true"
    >
      {/* Drag handle / Sticky Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-4 py-3 sm:px-6">
        <SkeletonBox className="h-8 w-24 rounded-lg" />
        <SkeletonBox className="h-8 w-8 rounded-full" />
      </div>

      {/* Cover Image */}
      <SkeletonBox className="aspect-[21/9] w-full rounded-none" />

      <div className="p-4 sm:p-8 space-y-5 max-w-3xl mx-auto">
        {/* Meta badges */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-5 w-24 rounded-full" />
          <SkeletonBox className="h-4 w-20 rounded-md" />
          <SkeletonBox className="h-4 w-28 rounded-md" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <SkeletonBox className="h-8 sm:h-10 w-full rounded-xl" />
          <SkeletonBox className="h-8 sm:h-10 w-4/5 rounded-xl" />
        </div>

        {/* Subtitle */}
        <SkeletonBox className="h-5 w-11/12 rounded-md" />

        {/* Author Card Box */}
        <div className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBox className="size-11 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-4 w-32 rounded-md" />
              <SkeletonBox className="h-3 w-44 rounded-md" />
            </div>
          </div>
          <SkeletonBox className="h-8 w-24 rounded-full" />
        </div>

        {/* Content Paragraphs */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/10">
          <SkeletonBox className="h-4 w-full rounded-md" />
          <SkeletonBox className="h-4 w-full rounded-md" />
          <SkeletonBox className="h-4 w-11/12 rounded-md" />
          <SkeletonBox className="h-4 w-4/5 rounded-md" />
        </div>

        <SkeletonBox className="h-20 w-full rounded-xl" />

        <div className="space-y-3">
          <SkeletonBox className="h-4 w-full rounded-md" />
          <SkeletonBox className="h-4 w-full rounded-md" />
          <SkeletonBox className="h-4 w-9/12 rounded-md" />
        </div>
      </div>
    </article>
  );
}

