import type { NotificationItem } from '../types';

export type NotificationKind = NonNullable<NotificationItem['type']>;

const bn = (n: number) => n.toLocaleString('bn-BD');

const NOUN_LOC: Record<string, string> = {
  post: 'পোস্টে',
  article: 'প্রতিবেদনে',
  reel: 'রিলে',
  comment: 'মন্তব্যে',
};

/** "Rafi", "Rafi ও Qadir", "Rafi, Qadir ও আরও ৩ জন" */
export function actorsText(n: Pick<NotificationItem, 'actors' | 'actorCount' | 'actorName' | 'source'>): string {
  const names = (n.actors ?? []).map((a) => a.name).filter(Boolean);
  if (!names.length) names.push(n.actorName || n.source || 'একজন সদস্য');
  const count = Math.max(n.actorCount ?? 1, names.length);
  if (count <= 1) return names[0];
  if (count === 2) return `${names[0]} ও ${names[1] ?? 'আরও ১ জন'}`;
  return `${names[0]}, ${names[1] ?? ''} ও আরও ${bn(count - 2)} জন`.replace(', ও', ' ও');
}

/** The verb phrase after the actor names. */
export function actionText(n: Pick<NotificationItem, 'type' | 'entityType' | 'entityLabel'>): string {
  const where = NOUN_LOC[n.entityType ?? ''] ?? 'কনটেন্টে';
  switch (n.type) {
    case 'reaction':
      return `আপনার ${where} প্রতিক্রিয়া জানিয়েছেন`;
    case 'comment':
      return `আপনার ${where} মন্তব্য করেছেন`;
    case 'reply':
      return 'আপনার মন্তব্যের উত্তর দিয়েছেন';
    case 'mention':
      return 'একটি আলোচনায় আপনাকে উল্লেখ করেছেন';
    case 'follow':
      return 'আপনাকে ফলো করতে শুরু করেছেন';
    case 'new_article':
      return 'নতুন প্রতিবেদন প্রকাশ করেছেন';
    default:
      return '';
  }
}

/** Short quoted context line under the sentence (comment text or content title). */
export function contextText(n: Pick<NotificationItem, 'type' | 'snippet' | 'entityLabel'>): string {
  if (n.type === 'comment' || n.type === 'reply' || n.type === 'mention') return n.snippet || '';
  if (n.type === 'reaction' || n.type === 'new_article') return n.entityLabel || '';
  return '';
}

/** Plain one-line sentence (used for toasts, aria-labels, document title). */
export function notificationSentence(n: NotificationItem): string {
  const action = actionText(n);
  if (!action) return n.message || n.title || '';
  return `${actorsText(n)} ${action}`;
}

export type TimeBucket = 'today' | 'yesterday' | 'week' | 'earlier';
export const BUCKET_LABEL: Record<TimeBucket, string> = {
  today: 'আজ',
  yesterday: 'গতকাল',
  week: 'এই সপ্তাহে',
  earlier: 'আগের',
};

export function bucketOf(iso: string | undefined, now: Date = new Date()): TimeBucket {
  if (!iso) return 'earlier';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'earlier';
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return 'today';
  if (t >= startToday - 86400000) return 'yesterday';
  if (t >= startToday - 6 * 86400000) return 'week';
  return 'earlier';
}

/** Split into ordered sections; empty sections are dropped. */
export function groupByTime(items: NotificationItem[], now: Date = new Date()) {
  const order: TimeBucket[] = ['today', 'yesterday', 'week', 'earlier'];
  const map = new Map<TimeBucket, NotificationItem[]>();
  for (const n of items) {
    const b = bucketOf(n.updatedAt || n.createdAt, now);
    const list = map.get(b) ?? [];
    list.push(n);
    map.set(b, list);
  }
  return order.filter((b) => map.has(b)).map((b) => ({ bucket: b, label: BUCKET_LABEL[b], items: map.get(b)! }));
}

/** Newest activity first. */
export function sortNotifications(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
}

/** Insert or replace by id, keep newest first. */
export function upsertNotification(items: NotificationItem[], n: NotificationItem): NotificationItem[] {
  return sortNotifications([n, ...items.filter((x) => x.id !== n.id)]);
}

export const isUnread = (n: NotificationItem) => (n.isRead !== undefined ? !n.isRead : n.unread);

/** "/post/abc?c=cm-1" -> { path: "/post/abc", commentId: "cm-1", articleId?: "abc" } */
export function parseTarget(url: string | undefined): { path: string; commentId?: string; articleId?: string } {
  const raw = url || '/';
  const [path, query = ''] = raw.split('?');
  const commentId = new URLSearchParams(query).get('c') || undefined;
  const articleId = path.startsWith('/article/') ? decodeURIComponent(path.slice('/article/'.length)) : undefined;
  return { path: path || '/', commentId, articleId };
}

export type NotificationFilter = 'all' | 'unread' | 'conversation' | 'reaction' | 'follow' | 'mention';
export const FILTERS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'unread', label: 'অপঠিত' },
  { key: 'conversation', label: 'মন্তব্য ও উত্তর' },
  { key: 'reaction', label: 'প্রতিক্রিয়া' },
  { key: 'mention', label: 'উল্লেখ' },
  { key: 'follow', label: 'ফলো' },
];

export function matchesFilter(n: NotificationItem, f: NotificationFilter): boolean {
  switch (f) {
    case 'all':
      return true;
    case 'unread':
      return isUnread(n);
    case 'conversation':
      return n.type === 'comment' || n.type === 'reply';
    case 'reaction':
      return n.type === 'reaction';
    case 'mention':
      return n.type === 'mention';
    case 'follow':
      return n.type === 'follow' || n.type === 'new_article';
  }
}

/** The comment id a page should scroll to, from ?c= in the current URL. */
export function deepLinkCommentId(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('c');
}
