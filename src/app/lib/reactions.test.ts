import { describe, expect, it } from 'vitest';
import { EMPTY_SNAPSHOT, type DatabaseSnapshot } from './db';
import { applyReactionToSnapshot } from './reactions';
import { makeComment, toBengaliNumerals } from '../utils/pureLogic';
import type { Article, Comment, CommunityPost, UserProfile } from '../types';

const comment = (over: Partial<Comment> = {}): Comment => ({
  id: 'c1', targetType: 'post', targetId: 'p1', authorId: 'u9', author: 'X', avatar: '', role: '', text: 't',
  timestamp: '', likes: 0, reactionCounts: {}, userReaction: null, ...over,
});
const post = (): CommunityPost => ({
  id: 'p1', authorId: 'u9', author: { name: 'X', avatar: '', role: '' }, timestamp: '', content: 'c',
  stats: { likes: 0, commentsCount: 1, shares: 0 }, reactionCounts: {}, comments: [comment()],
});
const article = (): Article => ({
  id: 'a1', title: 't', subtitle: '', category: 'সকল', categoryEn: '', imageType: 'lab', authorId: 'u9',
  author: { name: 'X', designation: '', organization: '', avatar: '' }, publishedAt: '', readTimeMinutes: 1,
  content: [], takeaways: [], stats: { views: 0, likes: 0, commentsCount: 0, shares: 0 }, reactionCounts: {}, comments: [],
});
const snap = (): DatabaseSnapshot => ({ ...EMPTY_SNAPSHOT, posts: [post()], articles: [article()], comments: [comment()] });

describe('applyReactionToSnapshot', () => {
  it('adds, switches and removes a post reaction', () => {
    const a = applyReactionToSnapshot(snap(), 'post', 'p1', 'like');
    expect(a.final).toBe('like');
    expect(a.next.posts[0].reactionCounts).toEqual({ like: 1 });
    expect(a.next.posts[0].stats.likes).toBe(1);

    const b = applyReactionToSnapshot(a.next, 'post', 'p1', 'insightful');
    expect(b.final).toBe('insightful');
    expect(b.next.posts[0].reactionCounts).toEqual({ insightful: 1 });

    const c = applyReactionToSnapshot(b.next, 'post', 'p1', 'insightful');
    expect(c.final).toBeNull();
    expect(c.next.posts[0].reactionCounts).toEqual({});
    expect(c.next.posts[0].userLiked).toBe(false);
  });

  it('1,000 rapid toggles return to the exact starting state', () => {
    let s = snap();
    for (let i = 0; i < 1000; i++) s = applyReactionToSnapshot(s, 'article', 'a1', 'like').next;
    expect(s.articles[0].reactionCounts).toEqual({});
    expect(s.articles[0].stats.likes).toBe(0);
  });

  it('reacting to a comment updates it everywhere it is stored, once', () => {
    const { next } = applyReactionToSnapshot(snap(), 'comment', 'c1', 'like');
    expect(next.comments[0].likes).toBe(1);
    expect(next.posts[0].comments[0].likes).toBe(1);
    expect(next.posts[0].comments[0].reactionCounts).toEqual({ like: 1 });
  });

  it('does not touch unrelated items and never mutates its input', () => {
    const before = snap();
    const frozen = JSON.stringify(before);
    const { next } = applyReactionToSnapshot(before, 'post', 'p1', 'like');
    expect(JSON.stringify(before)).toBe(frozen);
    expect(next.articles[0]).toBe(before.articles[0]);
  });
});

describe('pureLogic', () => {
  it('converts numerals', () => expect(toBengaliNumerals(2026)).toBe('২০২৬'));
  it('creates unique comment ids', () => {
    const u = { id: 'u', name: 'N', role: 'r', organization: '', avatar: '' } as UserProfile;
    const ids = new Set(Array.from({ length: 500 }, () => makeComment('x', u, 'post', 'p').id));
    expect(ids.size).toBe(500);
  });
});
