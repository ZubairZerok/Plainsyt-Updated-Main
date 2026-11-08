import { supabase } from './supabase';
import { fromProfileRow, PROFILE_COLS } from './mappers';
import type { UserProfile } from '../types';

/** Editors/admins are granted server-side (app_admins table). The client only reads the result. */
export const isEditor = (user?: UserProfile | null): boolean => Boolean(user?.isEditor);
export const canCreateStory = isEditor;
export const isEditorialAuthorized = isEditor;

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Load the signed-in user's profile (created by the handle_new_user DB trigger) plus their role. */
export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', userId).maybeSingle();
  if (error || !data) return null;
  const profile = fromProfileRow(data as unknown as Record<string, unknown>);
  const { data: sess } = await supabase.auth.getSession();
  profile.email = sess.session?.user.email ?? undefined; // own e-mail comes from the auth session, never the public table
  const role = await supabase.rpc('my_role');
  profile.isEditor = !role.error && (role.data === 'admin' || role.data === 'editor');
  return profile;
}

export type AuthResult = { ok: true; needsEmailConfirmation?: boolean } | { ok: false; error: string };

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  if (!password || password.length < 6) return { ok: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) {
      return { ok: false, error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।' };
  }
}

export async function signupWithEmail(email: string, password: string, name: string): Promise<AuthResult> {
  if (!name.trim()) return { ok: false, error: 'নাম প্রদান করুন।' };
  if (!password || password.length < 6) return { ok: false, error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' };
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      const already = error.message.toLowerCase().includes('already');
      return { ok: false, error: already ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।' : error.message };
    }
    // With "Confirm email" enabled there is no session yet: the user is NOT logged in.
    return { ok: true, needsEmailConfirmation: !data.session };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'সাইনআপ ত্রুটি' };
  }
}

export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: 'select_account' } },
    });
    if (error) return { ok: false, error: 'গুগল সাইন-ইন সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন।' };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'গুগল সাইন-ইন সংযোগে সমস্যা হয়েছে।' };
  }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/me/security`,
    });
    // Same neutral outcome whether or not the account exists (no enumeration).
    if (error && isPlainObject(error) && /rate|limit/i.test(String(error.message))) {
      return { ok: false, error: 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'সংযোগ সমস্যা হয়েছে। আবার চেষ্টা করুন।' };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // The auth listener clears local state even if the network call fails.
  }
}
export const isFollowableAccount = (user?: UserProfile | null): boolean => Boolean(user?.isVerified);
