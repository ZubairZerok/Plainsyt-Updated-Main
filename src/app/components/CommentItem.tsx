import { useState } from 'react';
import { isZubairIdentifier } from '../lib/auth';
import type { Comment, LinkedInReactionType, UserProfile } from '../types';
import { Avatar } from './Primitives';
import { LinkedInReactionPickerButton } from './LinkedInReactionBar';

interface CommentItemProps {
  comment: Comment;
  currentUser: UserProfile | null;
  onNavigateProfile?: (userId: string) => void;
  onReactComment?: (commentId: string, type: LinkedInReactionType) => void;
  onReply?: (commentId: string, authorName: string) => void;
  onEditComment?: (commentId: string, newText: string) => void;
  onDeleteComment?: (commentId: string) => void;
  isChild?: boolean;
}

export function CommentItem({
  comment,
  currentUser,
  onNavigateProfile,
  onReactComment,
  onReply,
  onEditComment,
  onDeleteComment,
  isChild = false,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const canManage = Boolean(
    currentUser &&
      currentUser.id &&
      comment.authorId &&
      (currentUser.id === comment.authorId ||
        (isZubairIdentifier(currentUser.id) && isZubairIdentifier(comment.authorId))),
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editText.trim();
    if (!clean) return;
    if (clean !== comment.text) {
      onEditComment?.(comment.id, clean);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.text);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteComment?.(comment.id);
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onNavigateProfile?.(comment.authorId)}
        className="shrink-0 cursor-pointer"
        aria-label={comment.author}
      >
        <Avatar
          src={comment.avatar}
          name={comment.author}
          size={isChild ? 'size-7' : 'size-8'}
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-canvas-subtle/90 dark:bg-white/5 px-3 py-2 border border-slate-200/50 dark:border-white/5">
          <button
            type="button"
            onClick={() => onNavigateProfile?.(comment.authorId)}
            className="block font-bangla text-left hover:underline cursor-pointer"
          >
            <span className="text-[12.5px] font-semibold text-slate-900 dark:text-white">
              {comment.author}
            </span>
          </button>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="mt-1.5 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
                rows={2}
                className="w-full rounded-xl border border-emerald-500/50 bg-white dark:bg-canvas-card p-2 font-bangla text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="submit"
                  disabled={!editText.trim()}
                  className="rounded-lg bg-[#03EF62] px-2.5 py-1 font-bangla text-xs font-bold text-[#061621] hover:bg-[#02d857] transition disabled:opacity-40 cursor-pointer"
                >
                  সংরক্ষণ
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-slate-300 dark:border-white/10 px-2.5 py-1 font-bangla text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          ) : (
            <p className="font-bangla text-[13.5px] leading-snug text-slate-800 dark:text-slate-200 break-words mt-0.5">
              {comment.text}
              {comment.isEdited && (
                <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                  (সম্পাদিত)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Comment Action Bar */}
        <div className="ml-2 mt-0.5 flex flex-wrap items-center gap-2.5 font-bangla text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
          <span className="text-slate-400 dark:text-slate-500">{comment.timestamp}</span>

          {onReactComment && (
            <LinkedInReactionPickerButton
              compact
              userReaction={comment.userReaction}
              onSelect={(type) => onReactComment(comment.id, type)}
              countLabel={comment.likes > 0 ? String(comment.likes) : undefined}
            />
          )}

          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.id, comment.author)}
              className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
            >
              উত্তর দিন
            </button>
          )}

          {canManage && (
            <>
              <span className="text-slate-300 dark:text-white/20 select-none">·</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="font-bangla font-semibold text-slate-500 hover:text-emerald-700 dark:hover:text-[#03EF62] transition cursor-pointer"
                title="মন্তব্য সম্পাদনা করুন"
              >
                এডিট
              </button>
              <span className="text-slate-300 dark:text-white/20 select-none">·</span>
              <button
                type="button"
                onClick={handleDelete}
                className="font-bangla font-semibold text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition cursor-pointer"
                title="মন্তব্য মুছে ফেলুন"
              >
                মুছুন
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

