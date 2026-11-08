import { BookmarkX, Bookmark } from 'lucide-react';
import type { Article, CommunityPost } from '../types';
import { Modal, CloseButton, Avatar, SectionLabel } from './Primitives';
import { ImageGraphic } from './ImageGraphic';
import { toBengaliNumerals } from '../utils/pureLogic';

interface Props {
  open: boolean;
  onClose: () => void;
  articles: Article[];
  posts: CommunityPost[];
  onOpenArticle: (id: string) => void;
  onRemoveArticle: (id: string) => void;
  onRemovePost: (id: string) => void;
}

export function SavedList({ articles, posts, onOpenArticle, onRemoveArticle, onRemovePost }: Omit<Props, 'open' | 'onClose'>) {
  if (!articles.length && !posts.length)
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-pine-900/40 text-accent-fg"><Bookmark className="size-6" /></span>
        <p className="font-display text-[19px] font-semibold text-pine-900">এখনো কিছু সংরক্ষণ করেননি</p>
        <p className="max-w-[280px] font-bangla text-[13.5px] text-pine-900/60">যেকোনো প্রতিবেদন বা পোস্টের বুকমার্ক চিহ্নে চাপ দিন — পরে পড়ার জন্য এখানে জমা থাকবে।</p>
      </div>
    );
  return (
    <div className="space-y-5">
      {articles.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Articles · {toBengaliNumerals(articles.length)}</SectionLabel>
          <ul className="space-y-2.5">
            {articles.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card p-3 shadow-xs">
                <button onClick={() => onOpenArticle(a.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ImageGraphic type={a.imageType} className="size-16 shrink-0 rounded-xl [&_span]:hidden" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-bangla text-[14px] font-semibold leading-snug text-slate-900 dark:text-white">{a.title}</span>
                    <span className="font-bangla font-bold text-[11px] text-emerald-600 dark:text-emerald-400">{a.categoryEn} · {a.readTimeMinutes} min</span>
                  </span>
                </button>
                <button onClick={() => onRemoveArticle(a.id)} aria-label="Remove" className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition"><BookmarkX className="size-[18px]" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {posts.length > 0 && (
        <div>
          <SectionLabel className="mb-2">Posts · {toBengaliNumerals(posts.length)}</SectionLabel>
          <ul className="space-y-2.5">
            {posts.map((p) => (
              <li key={p.id} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-canvas-card p-3 shadow-xs">
                <Avatar src={p.author.avatar} name={p.author.name} size="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-slate-900 dark:text-white">{p.author.name}</span>
                  <span className="line-clamp-2 font-bangla text-[13px] text-slate-600 dark:text-slate-300">{p.content}</span>
                </span>
                <button onClick={() => onRemovePost(p.id)} aria-label="Remove" className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition"><BookmarkX className="size-[18px]" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function SavedArticlesModal(p: Props) {
  return (
    <Modal open={p.open} onClose={p.onClose} className="max-w-[560px]" labelledBy="saved-title">
      <div className="rounded-t-3xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 px-6 py-4">
          <div>
            <h2 id="saved-title" className="font-display text-[22px] font-semibold text-slate-900 dark:text-white">সংরক্ষিত তালিকা</h2>
            <p className="font-bangla font-bold text-[11px] tracking-wide text-emerald-600 dark:text-emerald-400">Reading list · {toBengaliNumerals(p.articles.length + p.posts.length)} items</p>
          </div>
          <CloseButton onClick={p.onClose} />
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <SavedList {...p} onOpenArticle={(id) => { p.onClose(); p.onOpenArticle(id); }} />
        </div>
      </div>
    </Modal>
  );
}
