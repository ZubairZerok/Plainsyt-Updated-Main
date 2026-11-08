import { supabase } from './supabase';
import { loadProfile } from './auth';
import {
  fromArticleRow, fromCommentRows, fromEventRow, fromNotificationRow, fromPostRow, fromProfileRow,
  fromReactionRow, fromReelRow, PROFILE_COLS, fromStoryRow, safeUrl, toArticleRow, toPostRow, toProfileUpdate,
} from './mappers';
import type {
  Article, Comment, CommunityPost, LinkedInReactionType, NotificationItem, ReactionRecord,
  ReactionTargetType, StoryReel, TopicStory, UpcomingEvent, UserProfile,
} from '../types';

export type SupabaseConnectionStatus = 'checking' | 'connected' | 'offline';

/** In-memory view of server state. The server is the source of truth; nothing is persisted locally. */
export interface DatabaseSnapshot {
  profiles: UserProfile[];
  currentUserId: string;
  articles: Article[];
  posts: CommunityPost[];
  comments: Comment[];
  reels: StoryReel[];
  stories: TopicStory[];
  events: UpcomingEvent[];
  eventRegistrations: string[];
  bookmarkedArticleIds: string[];
  savedPostIds: string[];
  savedReelIds: string[];
  followingIds: string[];
  follows: Array<{ followerId: string; followingId: string }>;
  notifications: NotificationItem[];
}

export const EMPTY_SNAPSHOT: DatabaseSnapshot = {
  profiles: [],
  currentUserId: '',
  articles: [],
  posts: [],
  comments: [],
  reels: [],
  stories: [],
  events: [],
  eventRegistrations: [],
  bookmarkedArticleIds: [],
  savedPostIds: [],
  savedReelIds: [],
  followingIds: [],
  follows: [],
  notifications: [],
};

export type DbResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T,>(data: T): DbResult<T> => ({ ok: true, data });
const fail = (error: { message?: string } | string | null | undefined): DbResult<never> => ({
  ok: false,
  error: typeof error === 'string' ? error : error?.message || 'অজানা ত্রুটি',
});

type Row = Record<string, unknown>;

const PAGE = 40;

/** Load everything the signed-in (or anonymous) visitor needs. Server data always wins. */
export async function fetchFromSupabase(
  meId: string,
): Promise<{ status: SupabaseConnectionStatus; snapshot?: DatabaseSnapshot; errorMessage?: string }> {
  try {
    const [articlesRes, postsRes, reelsRes, storiesRes, eventsRes, profilesRes] = await Promise.all([
      supabase.from('articles').select('*').order('created_at', { ascending: false }).limit(PAGE),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(PAGE),
      supabase.from('reels').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('events').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('profiles').select(PROFILE_COLS).order('created_at', { ascending: false }).limit(60),
    ]);
    const firstError = [articlesRes, postsRes, reelsRes, storiesRes, eventsRes, profilesRes].find((r) => r.error);
    if (firstError?.error) return { status: 'offline', errorMessage: firstError.error.message };

    const articleRows = (articlesRes.data ?? []) as Row[];
    const postRows = (postsRes.data ?? []) as Row[];
    const reelRows = (reelsRes.data ?? []) as Row[];
    const targetIds = [...articleRows, ...postRows, ...reelRows].map((r) => String(r.id));

    const [commentsRes, myRxRes, notifsRes, bookmarksRes, followsRes, regsRes] = await Promise.all([
      targetIds.length
        ? supabase.from('comments').select('*').in('target_id', targetIds).order('created_at', { ascending: true }).limit(3000)
        : Promise.resolve({ data: [], error: null }),
      meId ? supabase.from('reactions').select('*').eq('user_id', meId) : Promise.resolve({ data: [], error: null }),
      meId
        ? supabase.from('notifications').select('*').eq('recipient_id', meId).order('updated_at', { ascending: false }).limit(NOTIF_PAGE)
        : Promise.resolve({ data: [], error: null }),
      meId ? supabase.from('bookmarks').select('*').eq('user_id', meId) : Promise.resolve({ data: [], error: null }),
      supabase.from('follows').select('follower_id, following_id').limit(5000),
      meId ? supabase.from('event_registrations').select('event_id').eq('user_id', meId) : Promise.resolve({ data: [], error: null }),
    ]);
    // Non-critical collections failing must not hide the whole site.
    const myReactions = new Map<string, LinkedInReactionType>();
    for (const r of (myRxRes.data ?? []) as Row[]) {
      myReactions.set(`${String(r.target_type)}:${String(r.target_id)}`, r.type as LinkedInReactionType);
    }

    const comments = fromCommentRows((commentsRes.data ?? []) as Row[], myReactions);
    const bookmarks = (bookmarksRes.data ?? []) as Row[];
    const savedPostIds = bookmarks.filter((b) => b.target_type === 'post').map((b) => String(b.target_id));
    const bookmarkedArticleIds = bookmarks.filter((b) => b.target_type === 'article').map((b) => String(b.target_id));
    const savedReelIds = bookmarks.filter((b) => b.target_type === 'reel').map((b) => String(b.target_id));
    const registered = new Set(((regsRes.data ?? []) as Row[]).map((r) => String(r.event_id)));
    const savedSet = new Set(savedPostIds);

    const follows = ((followsRes.data ?? []) as Row[]).map((r) => ({
      followerId: String(r.follower_id),
      followingId: String(r.following_id),
    }));

    const profiles = ((profilesRes.data ?? []) as Row[]).map(fromProfileRow);
    // Make sure the signed-in user and all content authors can be resolved.
    const known = new Set(profiles.map((p) => p.id));
    const missing = Array.from(
      new Set(
        [meId, ...articleRows.map((r) => String(r.author_id)), ...postRows.map((r) => String(r.author_id))].filter(
          (id) => id && !known.has(id),
        ),
      ),
    );
    if (missing.length) {
      const extra = await supabase.from('profiles').select(PROFILE_COLS).in('id', missing);
      for (const r of (extra.data ?? []) as Row[]) profiles.push(fromProfileRow(r));
    }
    if (meId) {
      const mine = await loadProfile(meId);
      if (mine) {
        const i = profiles.findIndex((p) => p.id === meId);
        if (i >= 0) profiles[i] = mine;
        else profiles.unshift(mine);
      }
    }

    const snapshot: DatabaseSnapshot = {
      profiles,
      currentUserId: meId,
      articles: articleRows.map((r) => fromArticleRow(r, comments, myReactions)),
      posts: postRows.map((r) => fromPostRow(r, comments, myReactions, savedSet)),
      comments,
      reels: reelRows.map((r) => fromReelRow(r, myReactions)),
      stories: ((storiesRes.data ?? []) as Row[]).map(fromStoryRow),
      events: ((eventsRes.data ?? []) as Row[]).map((r) => fromEventRow(r, registered)),
      eventRegistrations: Array.from(registered),
      bookmarkedArticleIds,
      savedPostIds,
      savedReelIds,
      followingIds: follows.filter((f) => f.followerId === meId).map((f) => f.followingId),
      follows,
      notifications: ((notifsRes.data ?? []) as Row[]).map(fromNotificationRow),
    };
    return { status: 'connected', snapshot };
  } catch (err) {
    return { status: 'offline', errorMessage: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function fetchReactionsFor(targetType: ReactionTargetType, targetId: string): Promise<ReactionRecord[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return [];
  return ((data ?? []) as Row[]).map(fromReactionRow);
}

/** Resolve a profile by id or handle (used by /profile/:slug when it is not in the loaded list). */
export async function fetchProfileByKey(key: string): Promise<UserProfile | null> {
  const clean = key.replace(/^@/, '');
  const byId = await supabase.from('profiles').select(PROFILE_COLS).eq('id', clean).maybeSingle();
  if (byId.data) return fromProfileRow(byId.data as Row);
  const byHandle = await supabase.from('profiles').select(PROFILE_COLS).eq('handle', clean.toLowerCase()).maybeSingle();
  return byHandle.data ? fromProfileRow(byHandle.data as Row) : null;
}

/* ------------------------------ writes ------------------------------ */

export async function dbUpdateProfile(profile: UserProfile): Promise<DbResult> {
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return fail('সেশনের মেয়াদ শেষ হয়েছে। আবার লগইন করুন।');
  const { error } = await supabase.from('profiles').update(toProfileUpdate(profile)).eq('id', sess.session.user.id);
  if (error) {
    return fail(error.code === '23505' ? 'এই ইউজারনেম (handle) ইতিমধ্যে ব্যবহৃত হয়েছে।' : error);
  }
  return ok(undefined);
}

export async function dbInsertArticle(article: Article): Promise<DbResult> {
  const { error } = await supabase.from('articles').insert(toArticleRow(article));
  return error ? fail(error) : ok(undefined);
}

export async function dbInsertPost(post: CommunityPost): Promise<DbResult> {
  const { error } = await supabase.from('posts').insert(toPostRow(post));
  return error ? fail(error) : ok(undefined);
}

export async function dbInsertComment(c: Comment): Promise<DbResult> {
  const row: Record<string, unknown> = {
    id: c.id,
    target_type: c.targetType ?? 'article',
    target_id: c.targetId ?? '',
    author_id: c.authorId,
    author: c.author,
    avatar: c.avatar,
    role: c.role,
    text: c.text,
    timestamp_label: '',
    parent_id: c.parentId || null,
  };
  let { error } = await supabase.from('comments').insert(row);
  if (error?.code === '42703') {
    delete row.parent_id; // very old schema without threaded replies
    ({ error } = await supabase.from('comments').insert(row));
  }
  return error ? fail(error) : ok(undefined);
}

export async function dbUpdateComment(id: string, text: string): Promise<DbResult> {
  const { data, error } = await supabase.from('comments').update({ text }).eq('id', id).select('id');
  if (error) return fail(error);
  return data && data.length ? ok(undefined) : fail('মন্তব্যটি সম্পাদনা করার অনুমতি নেই।');
}

export async function dbDeleteComment(id: string): Promise<DbResult> {
  const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id');
  if (error) return fail(error);
  return data && data.length ? ok(undefined) : fail('মন্তব্যটি মুছে ফেলার অনুমতি নেই।');
}

/** Writes only the caller's own reaction row. Counts are maintained by a database trigger. */
export async function dbSetReaction(
  targetType: ReactionTargetType,
  targetId: string,
  user: UserProfile,
  reactionType: LinkedInReactionType | null,
): Promise<DbResult> {
  if (!reactionType) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .match({ target_type: targetType, target_id: targetId, user_id: user.id });
    return error ? fail(error) : ok(undefined);
  }
  const { error } = await supabase.from('reactions').upsert(
    {
      id: `rx-${targetType}-${targetId}-${user.id}`,
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
      user_name: user.name,
      user_avatar: user.avatar,
      user_role: `${user.role}${user.organization ? ` · ${user.organization}` : ''}`,
      type: reactionType,
    },
    { onConflict: 'target_type,target_id,user_id' },
  );
  return error ? fail(error) : ok(undefined);
}

export async function dbInsertReel(reel: StoryReel): Promise<DbResult> {
  const { error } = await supabase.from('reels').insert({
    id: reel.id,
    title: reel.title,
    creator_id: reel.creatorId,
    creator: reel.creator,
    creator_avatar: reel.creatorAvatar,
    location: reel.location,
    duration: reel.duration,
    gradient_theme: reel.gradientTheme,
    video_type: reel.videoType,
    media_url: reel.mediaUrl,
    video_url: safeUrl(reel.videoUrl) ?? '',
  });
  return error ? fail(error) : ok(undefined);
}

export async function dbInsertStory(story: TopicStory): Promise<DbResult> {
  const { error } = await supabase.from('stories').insert({
    id: story.id,
    title: story.title,
    category: story.category,
    image_url: story.imageUrl,
    icon_name: story.iconName,
    reads_count: story.readsCount ?? '0',
    author_id: story.authorId ?? '',
    author_name: story.authorName ?? '',
    author_avatar: story.authorAvatar ?? '',
    article_id: story.articleId ?? null,
  });
  return error ? fail(error) : ok(undefined);
}

async function deleteOwned(table: 'posts' | 'stories' | 'articles', id: string): Promise<DbResult> {
  const { data, error } = await supabase.from(table).delete().eq('id', id).select('id');
  if (error) return fail(error);
  return data && data.length ? ok(undefined) : fail('মুছে ফেলার অনুমতি নেই।');
}
export const dbDeletePost = (id: string) => deleteOwned('posts', id);
export const dbDeleteStory = (id: string) => deleteOwned('stories', id);
export const dbDeleteArticle = (id: string) => deleteOwned('articles', id);

export const NOTIF_PAGE = 40;

/** Older notifications for "আরও দেখুন" (cursor = updated_at of the last loaded row). */
export async function dbFetchNotifications(meId: string, before?: string): Promise<DbResult<NotificationItem[]>> {
  let q = supabase.from('notifications').select('*').eq('recipient_id', meId).order('updated_at', { ascending: false }).limit(NOTIF_PAGE);
  if (before) q = q.lt('updated_at', before);
  const { data, error } = await q;
  return error ? fail(error) : ok(((data ?? []) as Row[]).map(fromNotificationRow));
}

export async function dbUpdateNotificationRead(id: string, isRead: boolean): Promise<DbResult> {
  const { error } = await supabase.from('notifications').update({ is_read: isRead }).eq('id', id);
  return error ? fail(error) : ok(undefined);
}
export async function dbMarkAllNotificationsRead(recipientId: string): Promise<DbResult> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', recipientId);
  return error ? fail(error) : ok(undefined);
}
export async function dbDeleteNotification(id: string): Promise<DbResult> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  return error ? fail(error) : ok(undefined);
}

export async function dbToggleFollow(followerId: string, followingId: string, follow: boolean): Promise<DbResult> {
  if (!followerId || !followingId) return fail('অবৈধ অনুরোধ');
  const { error } = follow
    ? await supabase.from('follows').upsert(
        { follower_id: followerId, following_id: followingId },
        { onConflict: 'follower_id,following_id' },
      )
    : await supabase.from('follows').delete().match({ follower_id: followerId, following_id: followingId });
  return error ? fail(error) : ok(undefined);
}

export async function dbToggleBookmark(
  userId: string,
  targetType: 'article' | 'post' | 'reel',
  targetId: string,
  bookmarked: boolean,
): Promise<DbResult> {
  if (!userId || !targetId) return fail('অবৈধ অনুরোধ');
  const { error } = bookmarked
    ? await supabase.from('bookmarks').upsert(
        { user_id: userId, target_type: targetType, target_id: targetId },
        { onConflict: 'user_id,target_type,target_id' },
      )
    : await supabase.from('bookmarks').delete().match({ user_id: userId, target_type: targetType, target_id: targetId });
  return error ? fail(error) : ok(undefined);
}

/** Atomic server-side view counter (works for visitors who are not the author). */
export async function dbIncrementArticleView(id: string): Promise<void> {
  await supabase.rpc('increment_article_view', { p_id: id });
}

export interface EventRegistrationInput {
  name: string;
  email: string;
  phone: string;
  organization?: string;
}

export async function dbRegisterForEvent(eventId: string, userId: string, info: EventRegistrationInput): Promise<DbResult> {
  const base = { event_id: eventId, user_id: userId };
  let { error } = await supabase.from('event_registrations').upsert(
    { ...base, name: info.name, email: info.email, phone: info.phone, organization: info.organization ?? '' },
    { onConflict: 'event_id,user_id' },
  );
  if (error?.code === '42703') {
    // Columns not migrated yet: still record the registration itself.
    ({ error } = await supabase.from('event_registrations').upsert(base, { onConflict: 'event_id,user_id' }));
  }
  return error ? fail(error) : ok(undefined);
}

export async function dbSubscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { success: false, message: 'সঠিক ইমেইল ঠিকানা দিন' };
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: clean });
  if (error && error.code !== '23505') {
    return { success: false, message: 'সাবস্ক্রিপশন সম্পন্ন করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' };
  }
  return {
    success: true,
    message: error ? 'আপনি ইতিমধ্যে আমাদের সাপ্তাহিক নিউজলেটারে যুক্ত আছেন!' : 'অভিনন্দন! আপনি সফলভাবে আমাদের সাপ্তাহিক কৃষিপ্রযুক্তি নিউজলেটারে যুক্ত হয়েছেন।',
  };
}

export async function dbGetNewsletterSubscribers(): Promise<Array<{ email: string; createdAt: string }>> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('email, created_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) return [];
  return (data ?? []).map((r) => ({ email: String(r.email), createdAt: String(r.created_at ?? '') }));
}

/* ------------------- deep links (items older than the feed page) ------------------- */

async function commentsAndReactions(targetIds: string[], meId: string) {
  const [c, rx] = await Promise.all([
    supabase.from('comments').select('*').in('target_id', targetIds).order('created_at', { ascending: true }).limit(1000),
    meId ? supabase.from('reactions').select('*').eq('user_id', meId).in('target_id', targetIds) : Promise.resolve({ data: [] }),
  ]);
  const my = new Map<string, LinkedInReactionType>();
  for (const r of (rx.data ?? []) as Row[]) my.set(`${String(r.target_type)}:${String(r.target_id)}`, r.type as LinkedInReactionType);
  return { comments: fromCommentRows((c.data ?? []) as Row[], my), my };
}

export async function fetchArticleByKey(key: string, meId: string): Promise<{ article: Article; comments: Comment[] } | null> {
  const byId = await supabase.from('articles').select('*').eq('id', key).maybeSingle();
  const row = byId.data ?? (await supabase.from('articles').select('*').eq('slug', key).maybeSingle()).data;
  if (!row) return null;
  const { comments, my } = await commentsAndReactions([String((row as Row).id)], meId);
  return { article: fromArticleRow(row as Row, comments, my), comments };
}

export async function fetchPostById(id: string, meId: string): Promise<{ post: CommunityPost; comments: Comment[] } | null> {
  const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const { comments, my } = await commentsAndReactions([id], meId);
  const saved = new Set<string>();
  if (meId) {
    const b = await supabase.from('bookmarks').select('target_id').eq('user_id', meId).eq('target_type', 'post').eq('target_id', id);
    if (b.data?.length) saved.add(id);
  }
  return { post: fromPostRow(data as Row, comments, my, saved), comments };
}

export async function fetchReelById(id: string, meId: string): Promise<StoryReel | null> {
  const { data } = await supabase.from('reels').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  const { my } = await commentsAndReactions([id], meId);
  return fromReelRow(data as Row, my);
}
