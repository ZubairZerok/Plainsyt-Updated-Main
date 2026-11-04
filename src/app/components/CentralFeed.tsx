import { useMemo, type ReactElement } from 'react';
import { PenLine, Video, UserPlus, FileText } from 'lucide-react';
import type {
  Article, CommunityPost, LinkedInReactionType, ReactionTargetType, StoryReel, TopicStory, UserProfile,
} from '../types';
import { PostCreatorBar } from './PostCreatorBar';
import { TopicStoriesCarousel } from './TopicStoriesCarousel';
import { ArticleCard } from './ArticleCard';
import { CommunityPostCard } from './CommunityPostCard';
import { IntegratedReelCard } from './IntegratedReelCard';
import { FEED_CARD, cn } from './Primitives';

export interface FeedApi {
  currentUser: UserProfile | null;
  articles: Article[];
  posts: CommunityPost[];
  stories: TopicStory[];
  reels: StoryReel[];
  savedReelIds?: string[];
  followingIds?: string[];
  bookmarkIds?: string[];
  onWriteArticle: () => void;
  onUploadVideo: () => void;
  onAskAI: () => void;
  onOpenProfileSettings: () => void;
  onOpenStory: (storyIdOrIndex: string | number) => void;
  onCreateStory: () => void;
  onOpenArticlePopup: (id: string) => void;
  onReact: (targetType: ReactionTargetType, targetId: string, type: LinkedInReactionType) => void;
  onOpenReactionsBreakdown: (targetType: ReactionTargetType, targetId: string) => void;
  onBookmarkArticle: (id: string) => void;
  onCommentArticle: (id: string, text: string) => void;
  onSavePost: (id: string) => void;
  onCommentPost: (id: string, text: string) => void;
  onShare: (label: string) => void;
  onPlayReel: (index: number) => void;
  onSaveReel: (id: string) => void;
  onToggleFollow: (userId: string) => void;
  onNavigateProfile: (userId: string) => void;
  onOpenPhoto: (images: string[], index: number, title?: string, subtitle?: string, authorName?: string, authorId?: string) => void;
}

export function CentralFeed(f: FeedApi) {
  const bookmarkIds = f.bookmarkIds ?? [];
  const savedReelIds = f.savedReelIds ?? [];
  const followingIds = f.followingIds ?? [];

  const storyAuthorIds = useMemo(
    () => new Set((f.stories || []).map((s) => s.authorId).filter(Boolean)),
    [f.stories],
  );

  const renderArticle = (a: Article, lead = false) => {
    const authorId = a.authorId || a.author.id;
    const authorStory = storyAuthorIds.has(authorId) ? f.stories.find((s) => s.authorId === authorId) : null;

    return (
      <ArticleCard
        key={a.id}
        article={a}
        lead={lead}
        bookmarked={bookmarkIds.includes(a.id)}
        currentUser={f.currentUser}
        hasStory={storyAuthorIds.has(authorId)}
        onOpenStory={authorStory ? () => f.onOpenStory(authorStory.id) : undefined}
        onOpenPopup={() => f.onOpenArticlePopup(a.id)}
        onReact={(type) => f.onReact('article', a.id, type)}
        onOpenReactionsBreakdown={() => f.onOpenReactionsBreakdown('article', a.id)}
        onBookmark={() => f.onBookmarkArticle(a.id)}
        onComment={(t) => f.onCommentArticle(a.id, t)}
        onReactComment={(cid, type) => f.onReact('comment', cid, type)}
        onShare={() => f.onShare(a.title)}
        onNavigateProfile={f.onNavigateProfile}
        onOpenPhoto={(src, title, subtitle, authorName, authorId) =>
          f.onOpenPhoto([src], 0, title, subtitle, authorName, authorId)
        }
      />
    );
  };

  const renderPost = (p: CommunityPost) => {
    const authorStory = storyAuthorIds.has(p.authorId) ? f.stories.find((s) => s.authorId === p.authorId) : null;

    return (
      <CommunityPostCard
        key={p.id}
        post={p}
        currentUser={f.currentUser}
        hasStory={storyAuthorIds.has(p.authorId)}
        onOpenStory={authorStory ? () => f.onOpenStory(authorStory.id) : undefined}
        onReact={(type) => f.onReact('post', p.id, type)}
        onOpenReactionsBreakdown={() => f.onOpenReactionsBreakdown('post', p.id)}
        onSave={() => f.onSavePost(p.id)}
        onComment={(t) => f.onCommentPost(p.id, t)}
        onReactComment={(cid, type) => f.onReact('comment', cid, type)}
        onShare={() => f.onShare(p.author.name)}
        onNavigateProfile={f.onNavigateProfile}
        onOpenPhoto={(imgs, idx, title, authorName, authorId) =>
          f.onOpenPhoto(imgs, idx, title, undefined, authorName, authorId)
        }
      />
    );
  };

  const [leadArticle, ...restArticles] = f.articles;
  const firstReel = f.reels[0];

  // Interleave articles and community posts cleanly
  const stream: ReactElement[] = [];
  if (leadArticle) stream.push(renderArticle(leadArticle, true));
  if (f.posts[0]) stream.push(renderPost(f.posts[0]));
  if (firstReel) {
    stream.push(
      <IntegratedReelCard
        key={firstReel.id}
        reel={firstReel}
        saved={savedReelIds.includes(firstReel.id)}
        following={followingIds.includes(firstReel.creatorId)}
        isOwnCreator={Boolean(f.currentUser?.id) && firstReel.creatorId === f.currentUser?.id}
        hasPrev={false}
        hasNext={f.reels.length > 1}
        onPlay={() => f.onPlayReel(0)}
        onPrev={() => f.onPlayReel(0)}
        onNext={() => f.onPlayReel(1)}
        onReact={(type) => f.onReact('reel', firstReel.id, type)}
        onSave={() => f.onSaveReel(firstReel.id)}
        onShare={() => f.onShare(firstReel.title)}
        onFollow={() => f.onToggleFollow(firstReel.creatorId)}
        onNavigateProfile={f.onNavigateProfile}
      />,
    );
  }
  const remainingPosts = f.posts.slice(1);
  const maxLen = Math.max(restArticles.length, remainingPosts.length, f.reels.length - 1);
  for (let i = 0; i < maxLen; i++) {
    if (remainingPosts[i]) stream.push(renderPost(remainingPosts[i]));
    if (f.reels[i + 1]) {
      const extraReel = f.reels[i + 1];
      const reelIdx = i + 1;
      stream.push(
        <IntegratedReelCard
          key={extraReel.id}
          reel={extraReel}
          saved={savedReelIds.includes(extraReel.id)}
          following={followingIds.includes(extraReel.creatorId)}
          isOwnCreator={Boolean(f.currentUser?.id) && extraReel.creatorId === f.currentUser?.id}
          hasPrev={reelIdx > 0}
          hasNext={reelIdx < f.reels.length - 1}
          onPlay={() => f.onPlayReel(reelIdx)}
          onPrev={() => f.onPlayReel(Math.max(0, reelIdx - 1))}
          onNext={() => f.onPlayReel(Math.min(f.reels.length - 1, reelIdx + 1))}
          onReact={(type) => f.onReact('reel', extraReel.id, type)}
          onSave={() => f.onSaveReel(extraReel.id)}
          onShare={() => f.onShare(extraReel.title)}
          onFollow={() => f.onToggleFollow(extraReel.creatorId)}
          onNavigateProfile={f.onNavigateProfile}
        />,
      );
    }
    if (restArticles[i]) stream.push(renderArticle(restArticles[i], false));
  }

  const isEmpty = f.articles.length === 0 && f.posts.length === 0 && f.reels.length === 0;

  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      <div className="bg-canvas-card py-2.5 sm:bg-transparent sm:py-0">
        <TopicStoriesCarousel
          stories={f.stories ?? []}
          currentUser={f.currentUser}
          onOpen={f.onOpenStory}
          onCreate={f.onCreateStory}
          onNavigateProfile={f.onNavigateProfile}
        />
      </div>

      {isEmpty ? (
        <section className={cn(FEED_CARD, 'p-6 text-center sm:p-10')}>
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#03EF62]/15 text-[#061621] border border-[#03EF62]/30">
            <FileText className="size-6 text-[#061621]" />
          </span>
          <h2 className="mt-4 font-sans text-xl font-bold text-slate-900">
            এখনো কোনো প্রকাশনা নেই
          </h2>
          <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-relaxed text-slate-600">
            আপনার চিন্তাভাবনা, গবেষণা বা অভিজ্ঞতা তুলে ধরে প্রথম প্রতিবেদনটি লিখুন অথবা কমিউনিটিতে নতুন পোস্ট দিন।
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!f.currentUser && (
              <button
                type="button"
                onClick={f.onOpenProfileSettings}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#03EF62] px-4 text-xs font-bold text-[#061621] hover:bg-[#02d955] transition shadow-xs"
              >
                <UserPlus className="size-3.5" /> প্রোফাইল তৈরি করুন
              </button>
            )}
            <button
              type="button"
              onClick={f.onWriteArticle}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
            >
              <PenLine className="size-3.5 text-slate-500" /> নতুন প্রতিবেদন লিখুন
            </button>
            <button
              type="button"
              onClick={f.onUploadVideo}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-xs"
            >
              <Video className="size-3.5 text-rose-500" /> রিলস আপলোড
            </button>
          </div>
        </section>
      ) : (
        stream
      )}

      {!isEmpty && (
        <div className="flex flex-col items-center gap-1 py-8 text-center text-slate-400">
          <span className="font-sans text-xs italic tracking-wider">— সব আপডেট দেখা শেষ —</span>
        </div>
      )}
    </div>
  );
}
