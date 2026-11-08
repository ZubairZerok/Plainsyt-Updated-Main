import { describe, expect, it } from 'vitest';
import type { NotificationItem } from '../types';
import {
  actionText, actorsText, bucketOf, contextText, groupByTime, matchesFilter, notificationSentence, parseTarget, upsertNotification,
} from './notifications';

const base = (x: Partial<NotificationItem>): NotificationItem => ({
  id: 'n', title: '', source: '', time: '', unread: true, isRead: false, type: 'reaction', entityType: 'post', ...x,
});

describe('actorsText', () => {
  it('single actor', () => expect(actorsText(base({ actors: [{ id: '1', name: 'Rafi', avatar: '' }], actorCount: 1 }))).toBe('Rafi'));
  it('two actors', () =>
    expect(actorsText(base({ actors: [{ id: '1', name: 'Rafi', avatar: '' }, { id: '2', name: 'Pia', avatar: '' }], actorCount: 2 }))).toBe('Rafi ও Pia'));
  it('many actors uses Bangla numerals', () =>
    expect(actorsText(base({ actors: [{ id: '1', name: 'Rafi', avatar: '' }, { id: '2', name: 'Pia', avatar: '' }], actorCount: 5 }))).toBe('Rafi, Pia ও আরও ৩ জন'));
  it('falls back to actorName for v1 rows', () => expect(actorsText(base({ actorName: 'Old' }))).toBe('Old'));
});

describe('sentences', () => {
  it('reaction on article', () => expect(actionText(base({ type: 'reaction', entityType: 'article' }))).toBe('আপনার প্রতিবেদনে প্রতিক্রিয়া জানিয়েছেন'));
  it('reply uses snippet as context', () => expect(contextText(base({ type: 'reply', snippet: 'ধন্যবাদ' }))).toBe('ধন্যবাদ'));
  it('system falls back to stored message', () => expect(notificationSentence(base({ type: 'system', message: 'hello' }))).toBe('hello'));
});

describe('time buckets', () => {
  const now = new Date('2026-11-08T15:00:00');
  it('today', () => expect(bucketOf('2026-11-08T01:00:00', now)).toBe('today'));
  it('yesterday', () => expect(bucketOf('2026-11-07T23:00:00', now)).toBe('yesterday'));
  it('this week', () => expect(bucketOf('2026-11-04T10:00:00', now)).toBe('week'));
  it('earlier', () => expect(bucketOf('2026-10-01T10:00:00', now)).toBe('earlier'));
  it('groups in order and drops empty sections', () => {
    const g = groupByTime([base({ id: 'a', updatedAt: '2026-10-01T00:00:00' }), base({ id: 'b', updatedAt: '2026-11-08T09:00:00' })], now);
    expect(g.map((s) => s.bucket)).toEqual(['today', 'earlier']);
  });
});

describe('targets and filters', () => {
  it('parses comment deep links', () => expect(parseTarget('/post/p1?c=cm-9')).toEqual({ path: '/post/p1', commentId: 'cm-9', articleId: undefined }));
  it('parses article ids', () => expect(parseTarget('/article/rice-trial?c=x').articleId).toBe('rice-trial'));
  it('conversation filter covers comments and replies', () => {
    expect(matchesFilter(base({ type: 'reply' }), 'conversation')).toBe(true);
    expect(matchesFilter(base({ type: 'reaction' }), 'conversation')).toBe(false);
  });
  it('upsert replaces and keeps newest first', () => {
    const list = [base({ id: 'a', updatedAt: '2026-11-01' }), base({ id: 'b', updatedAt: '2026-11-02' })];
    const out = upsertNotification(list, base({ id: 'a', updatedAt: '2026-11-05', actorCount: 4 }));
    expect(out.map((n) => n.id)).toEqual(['a', 'b']);
    expect(out[0].actorCount).toBe(4);
  });
});
