import type { Comment, LinkedInReactionType, ReactionTargetType } from '../types';
import type { DatabaseSnapshot } from './db';
import { applyReactionChange } from '../utils/pureLogic';
import { totalOf } from './mappers';

/**
 * Pure optimistic update for a single reaction toggle. Returns the next snapshot and the
 * reaction the user ends up with (null = removed). Counts shown here are replaced by the
 * database-maintained counts on the next refresh.
 */
export function applyReactionToSnapshot(
  snap: DatabaseSnapshot,
  targetType: ReactionTargetType,
  targetId: string,
  chosen: LinkedInReactionType,
): { next: DatabaseSnapshot; final: LinkedInReactionType | null } {
  let final: LinkedInReactionType | null = null;
  let resolved = false;

  const patch = <T extends { reactionCounts?: Partial<Record<LinkedInReactionType, number>>; userReaction?: LinkedInReactionType | null }>(
    item: T,
  ): T & { reactionCounts: Partial<Record<LinkedInReactionType, number>>; userReaction: LinkedInReactionType | null } => {
    const prev = item.userReaction ?? null;
    const f = prev === chosen ? null : chosen;
    if (!resolved) {
      final = f;
      resolved = true;
    }
    return { ...item, reactionCounts: applyReactionChange(item.reactionCounts, prev, f), userReaction: f };
  };

  const patchComments = (list: Comment[]): Comment[] =>
    list.map((c) => {
      if (c.id !== targetId) return c;
      const p = patch(c);
      return { ...p, likes: totalOf(p.reactionCounts) };
    });

  const next: DatabaseSnapshot = {
    ...snap,
    comments: targetType === 'comment' ? patchComments(snap.comments) : snap.comments,
    articles: snap.articles.map((a) => {
      if (targetType === 'article' && a.id === targetId) {
        const p = patch(a);
        return { ...p, userLiked: !!p.userReaction, stats: { ...a.stats, likes: totalOf(p.reactionCounts) } };
      }
      return targetType === 'comment' ? { ...a, comments: patchComments(a.comments) } : a;
    }),
    posts: snap.posts.map((po) => {
      if (targetType === 'post' && po.id === targetId) {
        const p = patch(po);
        return { ...p, userLiked: !!p.userReaction, stats: { ...po.stats, likes: totalOf(p.reactionCounts) } };
      }
      return targetType === 'comment' ? { ...po, comments: patchComments(po.comments) } : po;
    }),
    reels: snap.reels.map((r) => {
      if (targetType !== 'reel' || r.id !== targetId) return r;
      const p = patch(r);
      return { ...p, likes: totalOf(p.reactionCounts) };
    }),
  };
  return { next, final };
}
