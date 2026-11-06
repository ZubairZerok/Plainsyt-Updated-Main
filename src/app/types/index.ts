export type ArticleCategory =
  | 'সকল'
  | 'শস্য ও কৃষিবিজ্ঞান'
  | 'এগ্রি-টেক ও ড্রোন'
  | 'গবেষণা সহজ ভাষায়'
  | 'খাদ্য ও কোল্ড চেইন'
  | 'জলবায়ু ও স্থায়িত্ব'
  | 'স্টার্টআপ ও উদ্ভাবন'
  | 'মৎস্য ও প্রাণিসম্পদ';

export type LinkedInReactionType =
  | 'like'
  | 'celebrate'
  | 'support'
  | 'love'
  | 'insightful'
  | 'curious';

export type ReactionTargetType = 'article' | 'post' | 'comment' | 'reel';

export interface ReactionRecord {
  id: string;
  targetType: ReactionTargetType;
  targetId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  type: LinkedInReactionType;
  createdAt: string;
}

export type ReactionCounts = Partial<Record<LinkedInReactionType, number>>;

export interface UserProfile {
  id: string;
  name: string;
  nameBn: string;
  handle: string;
  role: string;
  organization: string;
  location: string;
  bio: string;
  avatar: string;
  coverGradient: string;
  isVerified: boolean;
  focusArea: string;
  website?: string;
  email?: string;
  publicationsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  targetType?: 'article' | 'post' | 'reel';
  targetId?: string;
  authorId: string;
  author: string;
  avatar: string;
  role: string;
  text: string;
  timestamp: string;
  likes: number;
  reactionCounts?: ReactionCounts;
  userReaction?: LinkedInReactionType | null;
  parentId?: string | null;
  replyToAuthor?: string;
}

export interface Article {
  id: string;
  slug?: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  categoryEn: string;
  imageType: 'drone' | 'lab' | 'solar' | 'floating' | 'biotech' | 'sensor' | 'water' | 'fisheries';
  coverImageUrl?: string;
  imageCaption?: string;
  authorId: string;
  author: {
    id?: string;
    name: string;
    nameBn?: string;
    designation: string;
    organization: string;
    avatar: string;
    isVerified?: boolean;
  };
  publishedAt: string;
  createdAt?: string;
  readTimeMinutes: number;
  featured?: boolean;
  content: string[];
  takeaways: string[];
  externalLink?: string;
  researchBasis?: {
    journalOrInst: string;
    doiOrSource: string;
    keyMetric: string;
    sourceUrl?: string;
  };
  stats: {
    views: number;
    likes: number;
    commentsCount: number;
    shares: number;
  };
  reactionCounts?: ReactionCounts;
  userReaction?: LinkedInReactionType | null;
  comments: Comment[];
  userLiked?: boolean;
  userBookmarked?: boolean;
}

export interface StoryReel {
  id: string;
  title: string;
  creatorId: string;
  creator: string;
  creatorAvatar: string;
  location: string;
  duration: string;
  views: number;
  gradientTheme: string;
  videoType: 'soil-ph' | 'drone-tips' | 'solar-onion' | 'hydroponic-berry' | 'greenhouse-iot';
  mediaUrl: string;
  videoUrl?: string;
  likes: number;
  reactionCounts?: ReactionCounts;
  userReaction?: LinkedInReactionType | null;
  createdAt?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    role: string;
    isVerified?: boolean;
  };
  timestamp: string;
  createdAt?: string;
  content: string;
  images?: string[];
  externalLink?: string;
  sharedPost?: {
    authorId?: string;
    authorName: string;
    authorAvatar: string;
    timestamp: string;
    text: string;
  };
  stats: {
    likes: number;
    commentsCount: number;
    shares: number;
  };
  reactionCounts?: ReactionCounts;
  userReaction?: LinkedInReactionType | null;
  reactionsSummary?: string;
  comments: Comment[];
  userLiked?: boolean;
  userSaved?: boolean;
  textTheme?: string;
  aiLabel?: boolean;
}

export interface TopicStory {
  id: string;
  title: string;
  category: ArticleCategory;
  imageUrl: string;
  iconName: 'drone' | 'seedling' | 'climate' | 'food' | 'rural' | 'policy' | 'soil' | 'tech';
  readsCount?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  articleId?: string;
  videoUrl?: string;
  createdAt?: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  dateMonth: string;
  dateDay: string;
  location: string;
  attendeesCount: string;
  organizerId?: string;
  organizerName?: string;
  description?: string;
  externalLink?: string;
  isRegistered?: boolean;
}

export interface TrendingRankedItem {
  id: string;
  articleId: string;
  rank: string;
  title: string;
  reads: string;
  comments: number;
  imageUrl: string;
  category: ArticleCategory;
}

export interface FeaturedScientist {
  id: string;
  name: string;
  role: string;
  organization: string;
  focusArea: string;
  avatar: string;
  publicationsCount: number;
  isFollowing?: boolean;
}

export interface ResearchPaper {
  id: string;
  institution: string;
  institutionCode: 'BAU' | 'BRRI' | 'BARI' | 'SAU';
  title: string;
  summary: string;
  practicalImpact: string;
  publishedDate: string;
  researchers: string[];
  authorId?: string;
  doiLink?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  recipientId?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  type?: 'reaction' | 'comment' | 'bookmark' | 'follow' | 'system';
  entityType?: 'article' | 'post' | 'reel' | 'profile' | 'comment';
  entityId?: string;
  title: string;
  message?: string;
  source: string;
  time: string;
  unread: boolean;
  isRead?: boolean;
  targetRoute?: string;
  targetUrl?: string;
  createdAt?: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  tag: string;
  image: string;
  sellerId: string;
  seller: string;
  stock: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface BkashOrderItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string;
}

export interface BkashOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  district: string;
  deliveryAddress: string;
  deliveryZone: 'inside_dhaka' | 'outside_dhaka';
  notes?: string;
  items: BkashOrderItem[];
  subtotalBdt: number;
  deliveryFeeBdt: number;
  totalBdt: number;
  receiverBkash: '01771047033';
  senderBkash: string;
  trxId: string;
  paymentMethod: 'bkash_send_money' | 'bkash_checkout';
  paymentScreenshot?: string;
  status: 'paid_verifying' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface CommunityIdea {
  id: string;
  title: string;
  body: string;
  authorId: string;
  author: string;
  authorAvatar?: string;
  votes: number;
  tag: string;
  voted?: boolean;
  createdAt: string;
}

export interface LightboxPayload {
  images: string[];
  index: number;
  title?: string;
  subtitle?: string;
  authorName?: string;
  authorId?: string;
  externalUrl?: string;
}
