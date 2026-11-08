import type {
  Article, Comment, CommunityPost, LinkedInReactionType, NotificationItem, ReactionCounts,
  ReactionRecord, ReactionTargetType, StoryReel, TopicStory, UpcomingEvent, UserProfile,
} from '../types';

type Row = Record<string, unknown>;

export const PROFILE_COLS =
  'id,name,name_bn,handle,role,organization,location,bio,avatar,cover_gradient,is_verified,focus_area,website,publications_count,followers_count,following_count,created_at';

const DEFAULT_COVER = 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)';

/** Only http(s) URLs are allowed anywhere a user-controlled link is rendered. */
export function safeUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u, typeof window !== 'undefined' ? window.location.origin : 'https://example.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const totalOf = (counts?: ReactionCounts): number =>
  Object.values(counts ?? {}).reduce((s: number, v) => s + (Number(v) || 0), 0);

export function fromProfileRow(r: Row): UserProfile {
  return {
    id: String(r.id),
    name: String(r.name ?? ''),
    nameBn: String(r.name_bn || r.name || ''),
    handle: String(r.handle ?? ''),
    role: String(r.role ?? ''),
    organization: String(r.organization ?? ''),
    location: String(r.location ?? ''),
    bio: String(r.bio ?? ''),
    avatar: String(r.avatar ?? ''),
    coverGradient: String(r.cover_gradient || DEFAULT_COVER),
    isVerified: Boolean(r.is_verified),
    focusArea: String(r.focus_area ?? ''),
    website: r.website ? String(r.website) : undefined,
    email: r.email ? String(r.email) : undefined,
    publicationsCount: Number(r.publications_count ?? 0),
    followersCount: Number(r.followers_count ?? 0),
    followingCount: Number(r.following_count ?? 0),
    createdAt: String(r.created_at ?? ''),
  };
}

/** Only the columns a user may edit about themselves. Privileged columns are server-controlled. */
export const toProfileUpdate = (p: UserProfile) => ({
  name: p.name,
  name_bn: p.nameBn || p.name,
  handle: p.handle,
  role: p.role,
  organization: p.organization,
  location: p.location,
  bio: p.bio,
  avatar: p.avatar,
  cover_gradient: p.coverGradient,
  focus_area: p.focusArea,
  website: safeUrl(p.website) ?? '',
});

export const toArticleRow = (a: Article) => ({
  id: a.id,
  title: a.title,
  subtitle: a.subtitle,
  slug: a.slug ?? a.id,
  category: a.category,
  category_en: a.categoryEn,
  image_type: a.imageType,
  cover_image_url: a.coverImageUrl ?? '',
  image_caption: a.imageCaption ?? '',
  author_id: a.authorId,
  author_json: a.author,
  published_at: a.publishedAt,
  read_time_minutes: a.readTimeMinutes,
  featured: Boolean(a.featured),
  content: a.content,
  takeaways: a.takeaways,
  external_link: safeUrl(a.externalLink) ?? '',
  research_basis: a.researchBasis ?? null,
});

export function fromArticleRow(r: Row, comments: Comment[], myReactions: Map<string, LinkedInReactionType>): Article {
  const id = String(r.id);
  const counts = (r.reaction_counts as ReactionCounts) ?? {};
  const rawStats = (r.stats as Partial<Article['stats']>) ?? {};
  const authorObj = (r.author_json as Article['author']) ?? { name: 'Author', designation: '', organization: '', avatar: '' };
  const mine = myReactions.get(`article:${id}`) ?? null;
  const artComments = comments.filter((c) => c.targetType === 'article' && c.targetId === id);
  return {
    id,
    slug: r.slug ? String(r.slug) : id,
    title: String(r.title ?? ''),
    subtitle: String(r.subtitle ?? ''),
    category: (r.category as Article['category']) ?? 'সকল',
    categoryEn: String(r.category_en ?? ''),
    imageType: (r.image_type as Article['imageType']) ?? 'floating',
    coverImageUrl: r.cover_image_url ? String(r.cover_image_url) : undefined,
    imageCaption: r.image_caption ? String(r.image_caption) : undefined,
    authorId: String(r.author_id ?? authorObj.id ?? ''),
    author: { ...authorObj, id: String(r.author_id ?? authorObj.id ?? '') },
    publishedAt: String(r.published_at ?? ''),
    createdAt: String(r.created_at ?? ''),
    readTimeMinutes: Number(r.read_time_minutes ?? 5),
    featured: Boolean(r.featured),
    content: Array.isArray(r.content) ? (r.content as string[]) : [],
    takeaways: Array.isArray(r.takeaways) ? (r.takeaways as string[]) : [],
    externalLink: r.external_link ? String(r.external_link) : undefined,
    researchBasis: (r.research_basis as Article['researchBasis']) ?? undefined,
    stats: {
      views: Number(rawStats.views ?? 0),
      likes: totalOf(counts),
      commentsCount: artComments.length,
      shares: Number(rawStats.shares ?? 0),
    },
    reactionCounts: counts,
    userReaction: mine,
    userLiked: !!mine,
    comments: artComments,
  };
}

export const toPostRow = (p: CommunityPost) => ({
  id: p.id,
  author_id: p.authorId,
  author_json: p.author,
  timestamp_label: p.timestamp,
  content: p.content,
  images: p.images ?? [],
  external_link: safeUrl(p.externalLink) ?? '',
  shared_post: p.sharedPost ?? null,
  text_theme: p.textTheme ?? '',
  ai_label: Boolean(p.aiLabel),
});

export function fromPostRow(
  r: Row,
  comments: Comment[],
  myReactions: Map<string, LinkedInReactionType>,
  savedPostIds: Set<string>,
): CommunityPost {
  const id = String(r.id);
  const counts = (r.reaction_counts as ReactionCounts) ?? {};
  const rawStats = (r.stats as Partial<CommunityPost['stats']>) ?? {};
  const authorObj = (r.author_json as CommunityPost['author']) ?? { name: 'Author', avatar: '', role: '' };
  const mine = myReactions.get(`post:${id}`) ?? null;
  const postComments = comments.filter((c) => c.targetType === 'post' && c.targetId === id);
  return {
    id,
    authorId: String(r.author_id ?? authorObj.id ?? ''),
    author: { ...authorObj, id: String(r.author_id ?? authorObj.id ?? '') },
    timestamp: formatRelativeBn(String(r.created_at ?? '')) || String(r.timestamp_label ?? ''),
    createdAt: String(r.created_at ?? ''),
    content: String(r.content ?? ''),
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    externalLink: safeUrl(r.external_link as string),
    sharedPost: (r.shared_post as CommunityPost['sharedPost']) ?? undefined,
    stats: { likes: totalOf(counts), commentsCount: postComments.length, shares: Number(rawStats.shares ?? 0) },
    reactionCounts: counts,
    userReaction: mine,
    userLiked: !!mine,
    userSaved: savedPostIds.has(id),
    comments: postComments,
    textTheme: r.text_theme ? String(r.text_theme) : undefined,
    aiLabel: Boolean(r.ai_label),
  };
}

export function fromCommentRows(rows: Row[], myReactions: Map<string, LinkedInReactionType>): Comment[] {
  const byId = new Map<string, Row>(rows.map((r) => [String(r.id), r]));
  return rows.map((r) => {
    const parentId = r.parent_id ? String(r.parent_id) : null;
    const parent = parentId ? byId.get(parentId) : undefined;
    const id = String(r.id);
    const counts = (r.reaction_counts as ReactionCounts) ?? {};
    return {
      id,
      targetType: (r.target_type as Comment['targetType']) ?? 'article',
      targetId: String(r.target_id ?? ''),
      authorId: String(r.author_id ?? ''),
      author: String(r.author ?? ''),
      avatar: String(r.avatar ?? ''),
      role: String(r.role ?? ''),
      text: String(r.text ?? ''),
      timestamp: formatRelativeBn(String(r.created_at ?? '')),
      likes: totalOf(counts),
      reactionCounts: counts,
      userReaction: myReactions.get(`comment:${id}`) ?? null,
      parentId,
      replyToAuthor: parent ? String(parent.author ?? '') : undefined,
    };
  });
}

export const fromReelRow = (r: Row, myReactions: Map<string, LinkedInReactionType>): StoryReel => {
  const counts = (r.reaction_counts as ReactionCounts) ?? {};
  return {
    id: String(r.id),
    title: String(r.title ?? ''),
    creatorId: String(r.creator_id ?? ''),
    creator: String(r.creator ?? ''),
    creatorAvatar: String(r.creator_avatar ?? ''),
    location: String(r.location ?? ''),
    duration: String(r.duration ?? '1:00'),
    views: Number(r.views ?? 0),
    gradientTheme: String(r.gradient_theme ?? 'from-emerald-900 to-lime-700'),
    videoType: (r.video_type as StoryReel['videoType']) ?? 'greenhouse-iot',
    mediaUrl: String(r.media_url ?? ''),
    videoUrl: r.video_url ? String(r.video_url) : undefined,
    likes: totalOf(counts),
    reactionCounts: counts,
    userReaction: myReactions.get(`reel:${String(r.id)}`) ?? null,
    createdAt: String(r.created_at ?? ''),
  };
};

export const fromStoryRow = (r: Row): TopicStory => ({
  id: String(r.id),
  title: String(r.title ?? ''),
  category: (r.category as TopicStory['category']) ?? 'সকল',
  imageUrl: String(r.image_url ?? ''),
  iconName: (r.icon_name as TopicStory['iconName']) ?? 'seedling',
  readsCount: String(r.reads_count ?? '0'),
  authorId: String(r.author_id ?? ''),
  authorName: String(r.author_name ?? ''),
  authorAvatar: String(r.author_avatar ?? ''),
  articleId: r.article_id ? String(r.article_id) : undefined,
  createdAt: String(r.created_at ?? ''),
});

export const fromEventRow = (r: Row, registered: Set<string>): UpcomingEvent => ({
  id: String(r.id),
  title: String(r.title ?? ''),
  dateMonth: String(r.date_month ?? ''),
  dateDay: String(r.date_day ?? ''),
  location: String(r.location ?? ''),
  attendeesCount: String(r.attendees_count ?? '0'),
  organizerId: String(r.organizer_id ?? ''),
  organizerName: String(r.organizer_name ?? ''),
  description: String(r.description ?? ''),
  externalLink: safeUrl(r.external_link as string),
  isRegistered: registered.has(String(r.id)),
});

export const fromNotificationRow = (r: Row): NotificationItem => {
  const isRead = Boolean(r.is_read);
  const message = String(r.message ?? '');
  const created = r.created_at ? new Date(String(r.created_at)) : null;
  return {
    id: String(r.id),
    userId: String(r.recipient_id ?? ''),
    recipientId: String(r.recipient_id ?? ''),
    actorId: String(r.actor_id ?? ''),
    actorName: String(r.actor_name ?? ''),
    actorAvatar: String(r.actor_avatar ?? ''),
    type: (r.type as NotificationItem['type']) ?? 'system',
    entityType: (r.entity_type as NotificationItem['entityType']) ?? 'article',
    entityId: String(r.entity_id ?? ''),
    targetUrl: String(r.target_url ?? '/'),
    targetRoute: String(r.target_url ?? '/'),
    message,
    title: message,
    source: String(r.actor_name ?? ''),
    time: formatRelativeBn(String(r.updated_at ?? r.created_at ?? '')) || (created ? formatRelativeBn(created) : ''),
    isRead,
    unread: !isRead,
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? r.created_at ?? ''),
    actors: Array.isArray(r.actors)
      ? (r.actors as Row[]).map((a) => ({ id: String(a.id ?? ''), name: String(a.name ?? ''), avatar: String(a.avatar ?? '') }))
      : r.actor_id
        ? [{ id: String(r.actor_id), name: String(r.actor_name ?? ''), avatar: String(r.actor_avatar ?? '') }]
        : [],
    actorCount: Number(r.actor_count ?? 1) || 1,
    entityLabel: String(r.entity_label ?? ''),
    snippet: String(r.snippet ?? ''),
  };
};

export const fromReactionRow = (r: Row): ReactionRecord => ({
  id: String(r.id),
  targetType: r.target_type as ReactionTargetType,
  targetId: String(r.target_id ?? ''),
  userId: String(r.user_id ?? ''),
  userName: String(r.user_name ?? ''),
  userAvatar: String(r.user_avatar ?? ''),
  userRole: String(r.user_role ?? ''),
  type: (r.type as LinkedInReactionType) ?? 'like',
  createdAt: String(r.created_at ?? ''),
});

/** "৩ দিন আগে" style relative time, with the date for anything older than a week. */
export function formatRelativeBn(input: Date | string | undefined | null, now: Date = new Date()): string {
  if (!input) return '';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return typeof input === 'string' ? input : '';
  const sec = Math.round((now.getTime() - d.getTime()) / 1000);
  const bn = (n: number) => n.toLocaleString('bn-BD');
  if (sec < 45) return 'এইমাত্র';
  if (sec < 3600) return `${bn(Math.max(1, Math.round(sec / 60)))} মিনিট আগে`;
  if (sec < 86400) return `${bn(Math.round(sec / 3600))} ঘণ্টা আগে`;
  if (sec < 7 * 86400) return `${bn(Math.round(sec / 86400))} দিন আগে`;
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}
