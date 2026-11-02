import { Play, Bookmark, Share2, Clapperboard, MapPin, Volume2 } from 'lucide-react';
import type { LinkedInReactionType, StoryReel } from '../types';
import { Avatar, FEED_CARD, VerifiedBadge, cn } from './Primitives';
import { LinkedInReactionBadge, LinkedInReactionPickerButton } from './LinkedInReactionBar';
import { formatBengaliNumberCompact, totalReactions } from '../utils/pureLogic';

interface Props {
  reel: StoryReel;
  saved: boolean;
  following: boolean;
  isOwnCreator?: boolean;
  onPlay: () => void;
  onReact: (type: LinkedInReactionType) => void;
  onSave: () => void;
  onShare: () => void;
  onFollow: () => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto?: (src: string, title?: string, authorName?: string, authorId?: string) => void;
}

export function IntegratedReelCard({
  reel,
  saved,
  following,
  isOwnCreator,
  onPlay,
  onReact,
  onSave,
  onShare,
  onFollow,
  onNavigateProfile,
}: Props) {
  const photo = reel.mediaUrl;
  const rxTotal = totalReactions(reel.reactionCounts, reel.likes);

  return (
    <article className={cn(FEED_CARD, 'overflow-hidden')}>
      <header className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
        <button type="button" onClick={() => onNavigateProfile(reel.creatorId)} className="shrink-0">
          <Avatar src={reel.creatorAvatar} name={reel.creator} size="size-10" online />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[14.5px] font-semibold text-pine-900">
            <button
              type="button"
              onClick={() => onNavigateProfile(reel.creatorId)}
              className="truncate hover:underline"
            >
              {reel.creator}
            </button>
            <VerifiedBadge />
            {!isOwnCreator && (
              <>
                <span className="text-pine-900/40">·</span>
                <button
                  type="button"
                  onClick={onFollow}
                  className={cn(
                    'text-[13.5px] font-semibold',
                    following ? 'text-pine-900/50' : 'text-pine-600 hover:underline',
                  )}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </p>
          <p className="flex items-center gap-1 text-[12px] text-pine-900/55">
            <Clapperboard className="size-3" />
            Reel · {reel.duration}
          </p>
        </div>
      </header>

      <div className="relative bg-[#021a11]">
        {photo && (
          <img
            src={photo}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
          />
        )}
        <div className="relative mx-auto aspect-[9/16] max-h-[600px] w-full max-w-[330px] overflow-hidden">
          <button
            type="button"
            onClick={onPlay}
            className="group absolute inset-0"
            aria-label={`Play ${reel.title}`}
          >
            {photo ? (
              <img src={photo} alt={reel.title} className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gradient-to-br from-pine-900 via-pine-700 to-pine-500" />
            )}
            <span className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/85" />
            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-black/30 text-white backdrop-blur-sm transition group-hover:scale-110">
              <Play className="ml-1 size-7 fill-white" />
            </span>
            <span className="absolute left-3 top-3 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10.5px] text-white">
              {reel.duration}
            </span>
            <Volume2 className="absolute right-3 top-3 size-5 text-white/80" />
            <span className="absolute bottom-4 left-3 right-16 text-left">
              <span className="block font-display text-[19px] font-semibold leading-tight text-white">
                {reel.title}
              </span>
            </span>
          </button>

          <div className="absolute bottom-4 right-2 flex flex-col items-center gap-3.5">
            <button
              type="button"
              onClick={() => onReact(reel.userReaction ?? 'like')}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition hover:bg-black/65">
                <LinkedInReactionBadge type={reel.userReaction ?? 'like'} size="size-6" />
              </span>
              <span className="font-mono text-[10.5px] font-medium">
                {formatBengaliNumberCompact(rxTotal)}
              </span>
            </button>

            <button
              type="button"
              onClick={onSave}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55">
                <Bookmark className={cn('size-[22px]', saved && 'fill-current text-[#bbf0d8]')} />
              </span>
              <span className="font-mono text-[10.5px] font-medium">{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={onShare}
              className="flex flex-col items-center gap-0.5 text-white"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm transition hover:bg-black/55">
                <Share2 className="size-[22px]" />
              </span>
              <span className="font-mono text-[10.5px] font-medium">Share</span>
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
            <div className="h-full w-1/3 bg-[#38b17e]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-canvas-border px-3 py-1.5 sm:px-4">
        <LinkedInReactionPickerButton
          userReaction={reel.userReaction}
          onSelect={onReact}
          countLabel={rxTotal > 0 ? formatBengaliNumberCompact(rxTotal) : undefined}
        />
        <span className="font-mono text-[11px] text-pine-600">Stored in Supabase · public.reels</span>
      </div>
    </article>
  );
}
