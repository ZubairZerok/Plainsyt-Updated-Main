import { useState } from 'react';
import { Download, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { FEED_CARD, cn } from './Primitives';

interface Props {
  currentUser: UserProfile | null;
  onLogout?: () => void;
  onOpenProfileSettings?: () => void;
}

/** Real account-security actions backed by Supabase Auth (no fabricated device lists). */
export function AccountSecurityView({ currentUser, onLogout, onOpenProfileSettings }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <section className={cn(FEED_CARD, 'p-8 text-center font-bangla')}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">অ্যাকাউন্ট সিকিউরিটি</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">এই পাতা দেখতে অনুগ্রহ করে লগইন করুন।</p>
      </section>
    );
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    setBusy('password');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword('');
    toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।');
  };

  const signOutEverywhere = async () => {
    setBusy('global');
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    onLogout?.();
  };

  const downloadMyData = async () => {
    setBusy('export');
    try {
      const [comments, posts, bookmarks] = await Promise.all([
        supabase.from('comments').select('*').eq('author_id', currentUser.id),
        supabase.from('posts').select('*').eq('author_id', currentUser.id),
        supabase.from('bookmarks').select('*').eq('user_id', currentUser.id),
      ]);
      const failed = [comments, posts, bookmarks].find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: currentUser,
        comments: comments.data,
        posts: posts.data,
        bookmarks: bookmarks.data,
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `plainsyt-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ডাটা ডাউনলোড করা যায়নি');
    } finally {
      setBusy(null);
    }
  };

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/10 px-3 py-2 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-100 disabled:opacity-60 transition';

  return (
    <div className="space-y-4 font-bangla pb-12">
      <section className={cn(FEED_CARD, 'p-4 sm:p-6')}>
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#061621] text-[#03EF62]">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <h1 className="font-sans text-xl sm:text-2xl font-black text-slate-900 dark:text-white">অ্যাকাউন্ট সিকিউরিটি</h1>
            <p className="font-sans text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {currentUser.email || currentUser.name}
            </p>
          </div>
        </div>
        <button type="button" onClick={onOpenProfileSettings} className={cn(btn, 'mt-4')}>
          প্রোফাইল সম্পাদনা
        </button>
      </section>

      <section className={cn(FEED_CARD, 'p-4 sm:p-5')}>
        <h2 className="mb-3 font-sans text-base font-bold text-slate-900 dark:text-white">পাসওয়ার্ড পরিবর্তন</h2>
        <form onSubmit={changePassword} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)"
            aria-label="নতুন পাসওয়ার্ড"
            className="w-full rounded-xl border border-slate-200 bg-canvas-card px-3.5 py-2.5 text-sm outline-none focus:border-[#03EF62] dark:border-white/10 dark:text-white"
          />
          <button type="submit" disabled={busy === 'password'} className={btn}>
            <KeyRound className="size-3.5" /> পরিবর্তন করুন
          </button>
        </form>
      </section>

      <section className={cn(FEED_CARD, 'p-4 sm:p-5 space-y-3')}>
        <h2 className="font-sans text-base font-bold text-slate-900 dark:text-white">সেশন ও ডাটা</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={signOutEverywhere} disabled={busy === 'global'} className={btn}>
            <LogOut className="size-3.5" /> সব ডিভাইস থেকে লগআউট
          </button>
          <button type="button" onClick={downloadMyData} disabled={busy === 'export'} className={btn}>
            <Download className="size-3.5" /> আমার ডাটা ডাউনলোড (JSON)
          </button>
        </div>
      </section>
    </div>
  );
}
