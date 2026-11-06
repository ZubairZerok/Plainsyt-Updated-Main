import type {
  Article, Comment, CommunityPost, LinkedInReactionType, ReactionCounts, ReactionRecord, UserProfile,
} from '../types';

export interface ReactionDefinition {
  type: LinkedInReactionType;
  label: string;
  labelBn: string;
  desc: string;
  descBn: string;
  color: string;
  bg: string;
  emoji: string;
}

/** Plainsyt SaaS reactions — strictly Like (Heart) and Idea (Light Bulb / নতুন জানলাম) */
export const LINKEDIN_REACTIONS: ReactionDefinition[] = [
  {
    type: 'like',
    label: 'Like',
    labelBn: 'লাইক',
    desc: 'Heart / Like reaction',
    descBn: 'পছন্দ',
    color: '#E5385F',
    bg: '#E5385F',
    emoji: '❤️',
  },
  {
    type: 'insightful',
    label: 'Idea',
    labelBn: 'নতুন জানলাম',
    desc: 'Learned something new / Idea',
    descBn: 'নতুন জানলাম',
    color: '#F2A900',
    bg: '#F2A900',
    emoji: '💡',
  },
];

export const COVER_GRADIENT_PRESETS: { id: string; name: string; css: string }[] = [
  { id: 'pine-gold', name: 'Pine & Harvest Gold', css: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)' },
  { id: 'haor-dawn', name: 'Haor Dawn', css: 'linear-gradient(135deg, #021a11 0%, #0f5e3e 50%, #38b17e 100%)' },
  { id: 'delta-monsoon', name: 'Delta Monsoon', css: 'linear-gradient(135deg, #09203f 0%, #1b5e5a 55%, #537895 100%)' },
  { id: 'terracotta-soil', name: 'Barind Red Clay', css: 'linear-gradient(135deg, #3e1f14 0%, #8c3b2b 55%, #e08a44 100%)' },
  { id: 'biochar-ink', name: 'Biochar Obsidian', css: 'linear-gradient(135deg, #090d0b 0%, #1d2e26 55%, #38b17e 100%)' },
  { id: 'mustard-field', name: 'Chalanbil Mustard', css: 'linear-gradient(135deg, #174c34 0%, #6b8e23 50%, #f5c518 100%)' },
  { id: 'sundarbans-mist', name: 'Sundarbans Mangrove', css: 'linear-gradient(135deg, #07221b 0%, #134e4a 55%, #2dd4bf 100%)' },
  { id: 'crimson-amaranth', name: 'Red Amaranth', css: 'linear-gradient(135deg, #2d0c1e 0%, #881337 55%, #fb7185 100%)' },
  { id: 'indigo-sky', name: 'Drone Telemetry Night', css: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #38bdf8 100%)' },
  { id: 'violet-biotech', name: 'CRISPR Violet', css: 'linear-gradient(135deg, #1e1b4b 0%, #5b21b6 55%, #c084fc 100%)' },
  { id: 'sunset-padma', name: 'Padma Horizon', css: 'linear-gradient(135deg, #1f1135 0%, #9a3412 55%, #facc15 100%)' },
  { id: 'paper-sage', name: 'Editorial Sage', css: 'linear-gradient(135deg, #183a2b 0%, #3d6b56 55%, #bbf0d8 100%)' },
];

export const getReactionMeta = (type?: LinkedInReactionType | null): ReactionDefinition => {
  if (type === 'love') {
    return {
      type: 'love' as LinkedInReactionType,
      label: 'Love',
      labelBn: 'ভালোবাসা',
      desc: 'Appreciation',
      descBn: 'আন্তরিক ভালোবাসা',
      color: '#E11D48',
      bg: '#E11D48',
      emoji: '❤️',
    };
  }
  return LINKEDIN_REACTIONS.find((r) => r.type === type) ?? LINKEDIN_REACTIONS[0];
};

export const totalReactions = (counts?: ReactionCounts, fallback = 0): number => {
  if (!counts) return fallback;
  const sum = Object.values(counts).reduce((acc, v) => acc + (v || 0), 0);
  return sum > 0 ? sum : fallback;
};

export const topReactionTypes = (counts?: ReactionCounts): LinkedInReactionType[] => {
  if (!counts) return ['like'];
  const entries = Object.entries(counts)
    .filter(([, v]) => (v || 0) > 0)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .map(([k]) => k as LinkedInReactionType);
  return entries.length > 0 ? entries.slice(0, 3) : ['like'];
};

export const applyReactionChange = (
  currentCounts: ReactionCounts | undefined,
  prevReaction: LinkedInReactionType | null | undefined,
  nextReaction: LinkedInReactionType | null,
): ReactionCounts => {
  const next: ReactionCounts = { ...(currentCounts ?? {}) };
  if (prevReaction) {
    next[prevReaction] = Math.max(0, (next[prevReaction] || 1) - 1);
    if (next[prevReaction] === 0) delete next[prevReaction];
  }
  if (nextReaction) {
    next[nextReaction] = (next[nextReaction] || 0) + 1;
  }
  return next;
};

export const toBengaliNumerals = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined || num === '') return '০';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return !isNaN(parsed) ? bengaliDigits[parsed] : char;
    })
    .join('');
};

export const formatBengaliNumberCompact = (num: number | undefined | null): string => {
  const n = Number(num);
  if (isNaN(n) || n <= 0) return '০';
  if (n >= 1000000) {
    return `${toBengaliNumerals((n / 1000000).toFixed(1))}M`;
  }
  if (n >= 1000) {
    return `${toBengaliNumerals((n / 1000).toFixed(1))}k`;
  }
  return toBengaliNumerals(n);
};

export const toggleBookmarkId = (existingIds: string[] = [], targetId: string): string[] => {
  const ids = existingIds ?? [];
  return ids.includes(targetId)
    ? ids.filter((id) => id !== targetId)
    : [...ids, targetId];
};

export const setArticleLinkedInReaction = (
  article: Article,
  reaction: LinkedInReactionType | null,
): Article => {
  const prev = article.userReaction ?? (article.userLiked ? 'like' : null);
  const nextReaction = prev === reaction ? null : reaction;
  const counts = applyReactionChange(article.reactionCounts, prev, nextReaction);
  const delta = (nextReaction ? 1 : 0) - (prev ? 1 : 0);
  return {
    ...article,
    userReaction: nextReaction,
    userLiked: !!nextReaction,
    reactionCounts: counts,
    stats: {
      ...article.stats,
      likes: Math.max(0, article.stats.likes + delta),
    },
  };
};

export const setPostLinkedInReaction = (
  post: CommunityPost,
  reaction: LinkedInReactionType | null,
): CommunityPost => {
  const prev = post.userReaction ?? (post.userLiked ? 'like' : null);
  const nextReaction = prev === reaction ? null : reaction;
  const counts = applyReactionChange(post.reactionCounts, prev, nextReaction);
  const delta = (nextReaction ? 1 : 0) - (prev ? 1 : 0);
  return {
    ...post,
    userReaction: nextReaction,
    userLiked: !!nextReaction,
    reactionCounts: counts,
    stats: {
      ...post.stats,
      likes: Math.max(0, post.stats.likes + delta),
    },
  };
};

export const appendArticleComment = (article: Article, newComment: Comment): Article => {
  const nextComments = [newComment, ...article.comments.filter((c) => c.id !== newComment.id)];
  return {
    ...article,
    comments: nextComments,
    stats: {
      ...article.stats,
      commentsCount: nextComments.length,
    },
  };
};

export const appendPostComment = (post: CommunityPost, c: Comment): CommunityPost => {
  const nextComments = [...post.comments.filter((item) => item.id !== c.id), c];
  return {
    ...post,
    comments: nextComments,
    stats: {
      ...post.stats,
      commentsCount: nextComments.length,
    },
  };
};

export const makeComment = (
  text: string,
  user: UserProfile,
  targetType?: 'article' | 'post' | 'reel',
  targetId?: string,
  parentId?: string | null,
  replyToAuthor?: string,
): Comment => ({
  id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  targetType,
  targetId,
  authorId: user.id,
  author: user.name,
  avatar: user.avatar,
  role: `${user.role}${user.organization ? ` · ${user.organization}` : ''}`,
  text,
  timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
  likes: 0,
  reactionCounts: {},
  userReaction: null,
  parentId: parentId || null,
  replyToAuthor: replyToAuthor || undefined,
});

export const aggregateReactions = (records: ReactionRecord[], targetType: string, targetId: string, currentUserId: string) => {
  const matching = records.filter((r) => r.targetType === targetType && r.targetId === targetId);
  const counts: ReactionCounts = {};
  let userReaction: LinkedInReactionType | null = null;
  for (const r of matching) {
    counts[r.type] = (counts[r.type] || 0) + 1;
    if (r.userId === currentUserId) userReaction = r.type;
  }
  return { counts, userReaction, total: matching.length, records: matching };
};
