import { Image as ImageIcon, PenLine, Video } from 'lucide-react';
import type { UserProfile } from '../types';
import { Avatar, CARD, cn } from './Primitives';

interface Props {
  currentUser: UserProfile | null;
  onWriteArticle: () => void;
  onUploadVideo: () => void;
  onAskAI?: () => void;
  onNavigateProfile: () => void;
}

export function PostCreatorBar(p: Props) {
  const firstName = p.currentUser ? p.currentUser.name.split(' ')[0] : 'Researcher';
  const actions = [
    { label: 'Write Article', icon: PenLine, onClick: p.onWriteArticle, tone: 'text-accent-fg' },
    { label: 'Upload Video', icon: Video, onClick: p.onUploadVideo, tone: 'text-[#e41e3f]' },
  ];
  return (
    <section className={cn(CARD, 'rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden')}>
      <div className="flex items-center gap-2.5 px-3.5 pb-2.5 pt-3 sm:px-4">
        <button type="button" onClick={p.onNavigateProfile} aria-label="Go to your profile">
          <Avatar
            src={p.currentUser?.avatar || 'PS'}
            name={p.currentUser?.name || 'User'}
            size="size-10"
            online
          />
        </button>
        <button
          type="button"
          onClick={p.onWriteArticle}
          className="flex h-10 flex-1 items-center rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 text-left text-[14px] text-slate-500 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-white/10"
        >
          What&apos;s on your mind, {firstName}?
        </button>
        <button
          type="button"
          onClick={p.onWriteArticle}
          aria-label="Add photo to article"
          className="flex size-10 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
        >
          <ImageIcon className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 border-t border-slate-100 dark:border-white/10 px-1.5 py-1">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-200 transition hover:bg-slate-100/70 dark:hover:bg-white/5 sm:flex-row sm:gap-2 sm:py-2 sm:text-[13px]"
          >
            <a.icon className={cn('size-4 shrink-0', a.tone)} />
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
