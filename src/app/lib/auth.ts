import { supabase } from './supabase';
import type { UserProfile } from '../types';

export const ADMIN_CANONICAL_ID = 'usr-plainsyt-admin';
export const ADMIN_ALIASES = ['plaiinsyt@gmail.com', 'pl@insyt.bd'] as const;
export const ZUBAIR_ID = 'usr-zubair';
export const ZUBAIR_EMAIL = 'Zubair2001!';
export const ZUBAIR_ALIASES = ['zubair2001!', 'zubair2001', 'z65gt9@gmail.com', 'zubair2001@gmail.com', 'hasanzubair'] as const;

export const ADMIN_PROFILE: UserProfile = {
  id: ADMIN_CANONICAL_ID,
  name: 'PLAiNSYT',
  nameBn: 'প্লেইনসাইট',
  handle: 'plainsyt',
  role: 'Admin',
  organization: 'PLAiNSYT Editorial & Agro-Tech Publishing',
  location: 'ঢাকা, বাংলাদেশ',
  bio: 'কৃষি, প্রযুক্তি, গবেষণা ও জ্ঞানভিত্তিক বাংলাদেশের উন্মুক্ত প্রকাশনা প্ল্যাটফর্ম।',
  avatar: '/logos/icon.png',
  coverGradient: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
  isVerified: true,
  focusArea: 'Nuclear Agronomy, Agro-IoT & Biotech',
  publicationsCount: 0,
  followersCount: 0,
  followingCount: 0,
  email: 'plaiinsyt@gmail.com',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const ZUBAIR_PROFILE: UserProfile = {
  id: ZUBAIR_ID,
  name: 'Hasan Zubair',
  nameBn: 'হাসান জুবায়ের',
  handle: 'hasanzubair',
  role: 'Research Fellow',
  organization: 'Bangladesh Agricultural University (BAU)',
  location: 'ময়মনসিংহ, বাংলাদেশ',
  bio: 'গবেষক ও এগ্রো-আইওটি ডেভেলপার। নির্ভুল তথ্যভিত্তিক কৃষি প্রযুক্তির প্রসারে নিবেদিত।',
  avatar: '/images/hasan_zubair.png',
  coverGradient: 'linear-gradient(135deg, #061621 0%, #0d2838 55%, #03EF62 100%)',
  isVerified: true,
  focusArea: 'Agri-Tech & Agronomy',
  publicationsCount: 0,
  followersCount: 0,
  followingCount: 0,
  email: 'Zubair2001!',
  createdAt: '2026-02-01T00:00:00.000Z',
};

const AUTH_STORAGE_KEY = 'plainsyt_auth_session_v1';

export function resolveEmailAlias(rawEmail: string): {
  normalizedEmail: string;
  canonicalEmail: string;
  canonicalUserId: string | null;
  isAdmin: boolean;
} {
  const normalized = rawEmail.trim().toLowerCase();
  if (normalized === 'plaiinsyt@gmail.com' || normalized === 'pl@insyt.bd') {
    return {
      normalizedEmail: normalized,
      canonicalEmail: 'plaiinsyt@gmail.com',
      canonicalUserId: ADMIN_CANONICAL_ID,
      isAdmin: true,
    };
  }
  if (
    normalized === 'zubair2001!' ||
    normalized === 'zubair2001' ||
    normalized === 'z65gt9@gmail.com' ||
    normalized === 'zubair2001@gmail.com' ||
    normalized === 'hasanzubair'
  ) {
    return {
      normalizedEmail: normalized,
      canonicalEmail: normalized.includes('@') ? normalized : 'z65gt9@gmail.com',
      canonicalUserId: ZUBAIR_ID,
      isAdmin: false,
    };
  }
  return {
    normalizedEmail: normalized,
    canonicalEmail: normalized,
    canonicalUserId: null,
    isAdmin: false,
  };
}

export function getStoredAuth(): { user: UserProfile | null; email: string | null } {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user) return parsed;
    }
  } catch {
    // ignore storage error
  }
  return { user: null, email: null };
}

export function getStoredAuthUser(): UserProfile | null {
  return getStoredAuth().user;
}

export function setStoredAuth(user: UserProfile | null, email: string | null) {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, email }));
    }
  } catch {
    // ignore
  }
}

export async function loginWithPassword(email: string, pass: string): Promise<{
  ok: boolean;
  user?: UserProfile;
  error?: string;
}> {
  const { normalizedEmail, canonicalEmail, canonicalUserId, isAdmin } = resolveEmailAlias(email);

  if (!pass || pass.length < 6) {
    return { ok: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  }

  // 1. Try real Supabase Auth
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: canonicalEmail,
      password: pass,
    });

    if (data?.user && !error) {
      const u = data.user;
      let profile: UserProfile;

      // Check if profile exists in public.profiles
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', u.id).single();
      if (profData) {
        profile = {
          id: profData.id,
          name: profData.name,
          nameBn: profData.name_bn || profData.name,
          handle: profData.handle,
          role: profData.role || (isAdmin ? 'Admin' : 'Member'),
          organization: profData.organization,
          location: profData.location,
          bio: profData.bio,
          avatar: profData.avatar,
          coverGradient: profData.cover_gradient,
          isVerified: Boolean(profData.is_verified),
          focusArea: profData.focus_area,
          email: normalizedEmail,
          publicationsCount: profData.publications_count || 0,
          followersCount: profData.followers_count || 0,
          followingCount: profData.following_count || 0,
          createdAt: profData.created_at,
        };
      } else if (isAdmin) {
        profile = { ...ADMIN_PROFILE, id: u.id, email: normalizedEmail };
      } else if (normalizedEmail === ZUBAIR_EMAIL) {
        profile = { ...ZUBAIR_PROFILE, id: u.id, email: normalizedEmail };
      } else {
        profile = {
          id: u.id,
          name: u.user_metadata?.name || normalizedEmail.split('@')[0],
          nameBn: u.user_metadata?.name || normalizedEmail.split('@')[0],
          handle: normalizedEmail.split('@')[0].replace(/[^a-z0-9]/g, '.'),
          role: 'Member',
          organization: 'Plainsyt Reader',
          location: 'Bangladesh',
          bio: '',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
          coverGradient: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
          isVerified: false,
          focusArea: 'Agri-Tech',
          publicationsCount: 0,
          followersCount: 0,
          followingCount: 0,
          email: normalizedEmail,
          createdAt: new Date().toISOString(),
        };
      }

      setStoredAuth(profile, normalizedEmail);
      return { ok: true, user: profile };
    }
  } catch (err) {
    return {
      ok: false,
      error: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
    };
  }

  return { ok: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' };
}

export async function signupWithEmail(email: string, pass: string, name: string): Promise<{
  ok: boolean;
  user?: UserProfile;
  error?: string;
}> {
  const { normalizedEmail } = resolveEmailAlias(email);

  if (!name.trim()) return { ok: false, error: 'নাম প্রদান করুন।' };
  if (!pass || pass.length < 6) return { ok: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: pass,
      options: { data: { name: name.trim() } },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes('already')
        ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।'
        : error.message;
      return { ok: false, error: msg };
    }
    const newId = data?.user?.id || `u-${Date.now().toString(36)}`;
    const newProfile: UserProfile = {
      id: newId,
      name: name.trim(),
      nameBn: name.trim(),
      handle: name.trim().toLowerCase().replace(/[^a-z0-9]/g, '.') + '.' + Math.floor(Math.random() * 90 + 10),
      role: 'Member',
      organization: 'Plainsyt Reader',
      location: 'Bangladesh',
      bio: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      coverGradient: 'linear-gradient(135deg, #04301f 0%, #17754f 55%, #f2c14e 100%)',
      isVerified: false,
      focusArea: 'Agri-Tech',
      publicationsCount: 0,
      followersCount: 0,
      followingCount: 0,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    };

    setStoredAuth(newProfile, normalizedEmail);

    // Persist new user profile to Supabase public.profiles table
    try {
      await supabase.from('profiles').upsert({
        id: newProfile.id,
        name: newProfile.name,
        name_bn: newProfile.nameBn,
        handle: newProfile.handle,
        role: newProfile.role,
        organization: newProfile.organization,
        location: newProfile.location,
        bio: newProfile.bio,
        avatar: newProfile.avatar,
        cover_gradient: newProfile.coverGradient,
        is_verified: newProfile.isVerified,
        focus_area: newProfile.focusArea,
        email: newProfile.email,
      });
    } catch {
      // non-blocking
    }

    return { ok: true, user: newProfile };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'সাইনআপ ত্রুটি' };
  }
}

export async function loginWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://pla.insyt.bd/';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      if (error.message.includes('not enabled') || error.message.includes('validation_failed')) {
        return {
          ok: false,
          error: 'গুগল সাইন-ইন সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।',
        };
      }
      return { ok: false, error: error.message };
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.assign(data.url);
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'গুগল সাইন-ইন সংযোগে সমস্যা হয়েছে।' };
  }
}

export async function logoutUser() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  setStoredAuth(null, null);
}
