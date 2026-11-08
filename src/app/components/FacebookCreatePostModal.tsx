import { useRef, useState } from 'react';
import { X, Globe2, Upload, Video, Clapperboard, Link as LinkIcon } from 'lucide-react';
import type { ArticleCategory, CommunityPost, StoryReel, TopicStory, UserProfile } from '../types';
import { Avatar, Modal, SectionLabel, cn } from './Primitives';
import { canCreateStory } from '../lib/auth';
import { uploadImage } from '../lib/media';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSubmitReel: (reel: StoryReel, story?: TopicStory, feedPost?: CommunityPost) => void;
}

const CATEGORIES: ArticleCategory[] = [
  'এগ্রি-টেক ও ড্রোন',
  'শস্য ও কৃষিবিজ্ঞান',
  'গবেষণা সহজ ভাষায়',
  'খাদ্য ও কোল্ড চেইন',
  'জলবায়ু ও স্থায়িত্ব',
  'স্টার্টআপ ও উদ্ভাবন',
  'মৎস্য ও প্রাণিসম্পদ',
];

export function FacebookCreatePostModal({ open, onClose, currentUser, onSubmitReel }: Props) {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location] = useState(currentUser?.location || 'ময়মনসিংহ');
  const [duration, setDuration] = useState('1:15');
  const [category, setCategory] = useState<ArticleCategory>('এগ্রি-টেক ও ড্রোন');
  const [mediaUrl, setMediaUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [alsoShareToStories, setAlsoShareToStories] = useState(true);
  const [alsoShareToFeed, setAlsoShareToFeed] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!currentUser?.id) {
      toast.error('ছবি আপলোড করতে অনুগ্রহ করে লগইন করুন।');
      return;
    }
    setUploading(true);
    const res = await uploadImage(f, currentUser.id);
    setUploading(false);
    if (res.ok) setMediaUrl(res.url);
    else toast.error(res.error);
  };

  const canSubmit = title.trim().length > 2 && (mediaUrl.trim().length > 0 || caption.trim().length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!currentUser?.id) {
      toast.error('পোস্ট বা স্টোরি তৈরি করতে অনুগ্রহ করে আগে আপনার অ্যাকাউন্টে লগইন করুন।');
      return;
    }
    const authorId = currentUser.id;
    const authorName = currentUser.nameBn || currentUser.name || 'গবেষক';
    const authorAvatar = currentUser.avatar || 'PS';
    const nowIso = new Date().toISOString();

    const reel: StoryReel = {
      id: `reel-${crypto.randomUUID()}`,
      title: title.trim(),
      creatorId: authorId,
      creator: authorName,
      creatorAvatar: authorAvatar,
      location: location.trim() || 'Bangladesh',
      duration: duration.trim() || '1:00',
      views: 1,
      gradientTheme: 'from-emerald-900 to-lime-700',
      videoType: 'greenhouse-iot',
      mediaUrl: mediaUrl.trim(),
      likes: 0,
      reactionCounts: {},
      userReaction: null,
      createdAt: nowIso,
    };

    const allowedStory = canCreateStory(currentUser);
    const story: TopicStory | undefined = (allowedStory && alsoShareToStories)
      ? {
          id: `st-${crypto.randomUUID()}`,
          title: title.trim(),
          category,
          imageUrl: mediaUrl.trim(),
          iconName: 'drone',
          readsCount: '1',
          authorId,
          authorName,
          authorAvatar,
          createdAt: nowIso,
        }
      : undefined;

    const feedPost: CommunityPost | undefined = alsoShareToFeed
      ? {
          id: `post-${crypto.randomUUID()}`,
          authorId,
          author: {
            id: authorId,
            name: authorName,
            avatar: authorAvatar,
            role: `${currentUser?.role || 'Researcher'}${currentUser?.organization ? ` · ${currentUser.organization}` : ''}`,
            isVerified: true,
          },
          timestamp: 'এইমাত্র',
          createdAt: nowIso,
          content: `${title.trim()}${caption.trim() ? `\n\n${caption.trim()}` : ''}`,
          images: mediaUrl.trim() ? [mediaUrl.trim()] : [],
          externalLink: externalLink.trim() || undefined,
          stats: { likes: 0, commentsCount: 0, shares: 0 },
          reactionCounts: {},
          userReaction: null,
          comments: [],
        }
      : undefined;

    onSubmitReel(reel, story, feedPost);
    setTitle('');
    setCaption('');
    setMediaUrl('');
    setExternalLink('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-[640px]" labelledBy="upload-reel-title">
      <div className="overflow-hidden rounded-t-3xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Clapperboard className="size-5 text-emerald-400" />
            </div>
            <div>
              <h2 id="upload-reel-title" className="font-display text-[19px] font-semibold">
                Upload Video Reel / Field Story
              </h2>
              <p className="text-[12px] text-slate-400">
                কমিউনিটির সাথে ভিডিও বা ফিল্ড স্টোরি শেয়ার করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={submit} className="max-h-[78vh] space-y-4 overflow-y-auto p-5">
          <div className="flex items-center gap-2.5">
            <Avatar src={currentUser?.avatar || 'PS'} name={currentUser?.name || 'User'} size="size-10" />
            <div>
              <p className="text-[14.5px] font-semibold text-pine-900">
                {currentUser?.name || 'Agri Researcher'}
              </p>
              <p className="flex items-center gap-1 font-mono text-[11px] text-accent-fg">
                Public <Globe2 className="size-3" />
              </p>
            </div>
          </div>

          <div>
            <SectionLabel className="mb-1">Reel / Story Headline *</SectionLabel>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৩ মিনিটে মাটির pH মাপার সহজ পদ্ধতি"
              className="w-full rounded-lg border border-pine-900/25 bg-canvas-card px-3 py-2 font-bangla text-[15px] text-pine-900 outline-none focus:border-pine-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <SectionLabel className="mb-1">Category</SectionLabel>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                className="w-full rounded-lg border border-pine-900/25 bg-canvas-card px-2.5 py-2 font-bangla text-[13px] text-pine-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <SectionLabel className="mb-1">Duration</SectionLabel>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1:15"
                className="w-full rounded-lg border border-pine-900/25 bg-canvas-card px-3 py-2 font-mono text-[13px] text-pine-900 outline-none"
              />
            </div>
          </div>

          <div>
            <SectionLabel className="mb-1">Visual Media (Upload Photo/Cover or Paste URL)</SectionLabel>
            <div className="flex gap-2">
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://..."
                maxLength={2000}
                className="flex-1 rounded-lg border border-pine-900/25 bg-canvas-card px-3 py-2 text-[13.5px] text-pine-900 outline-none"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-pine-900 bg-canvas-subtle px-3 text-[12.5px] font-semibold text-pine-900 hover:bg-pine-100"
              >
                <Upload className="size-4" /> {uploading ? 'Uploading…' : 'Upload File'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
              />
            </div>
            {mediaUrl && (
              <div className="relative mt-2">
                <img src={mediaUrl} alt="Reel preview" className="h-44 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaUrl('')}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <SectionLabel className="mb-1">Field Notes / Description</SectionLabel>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="মাঠ পর্যায়ের পর্যবেক্ষণ বা বিস্তারিত বিবরণ লিখুন…"
              className="w-full rounded-lg border border-pine-900/25 bg-canvas-card px-3 py-2 font-bangla text-[14.5px] text-pine-900 outline-none focus:border-pine-900"
            />
          </div>

          <div>
            <SectionLabel className="mb-1">External Video / Study Link (Optional)</SectionLabel>
            <div className="flex items-center rounded-lg border border-pine-900/25 bg-canvas-card px-3">
              <LinkIcon className="size-4 text-accent-fg" />
              <input
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-transparent px-2 py-2 font-mono text-[12.5px] text-pine-900 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 rounded-xl border border-canvas-border bg-canvas-subtle p-3 text-[13px] font-semibold text-pine-900">
            {canCreateStory(currentUser) && (
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={alsoShareToStories}
                  onChange={(e) => setAlsoShareToStories(e.target.checked)}
                  className="size-4 accent-pine-900"
                />
                Include in Topic Stories Carousel
              </label>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={alsoShareToFeed}
                onChange={(e) => setAlsoShareToFeed(e.target.checked)}
                className="size-4 accent-pine-900"
              />
              Also publish as Feed Update
            </label>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-5 text-[13.5px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'inline-flex h-11 items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 text-[14px] font-bold text-white shadow-md disabled:opacity-40 transition',
              )}
            >
              <Video className="size-4" /> প্রকাশ করুন
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
