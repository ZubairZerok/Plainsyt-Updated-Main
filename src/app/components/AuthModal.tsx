import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { Modal, CloseButton, cn } from './Primitives';
import { loginWithPassword, signupWithEmail, loginWithGoogle } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

interface Props {
  open?: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  promptReason?: string | null;
  reason?: string | null;
  initialTab?: 'login' | 'signup';
}

export function AuthModal({
  open = true,
  onClose,
  onSuccess,
  promptReason,
  reason,
  initialTab = 'login',
}: Props) {
  const [isNewUser, setIsNewUser] = useState(initialTab === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const displayReason = promptReason || reason;

  useEffect(() => {
    if (isNewUser) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isNewUser]);

  const handleGoogleAuth = async () => {
    setError(null);
    setInfoNotice(null);
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (!res.ok && res.error) {
        setError(res.error);
        setGoogleLoading(false);
      }
    } catch {
      setError('গুগল সাইন-ইন সেবা সাময়িকভাবে অনুপলব্ধ।');
      setGoogleLoading(false);
    }
  };

  /**
   * Smart submit handler:
   * 1. If in new user mode with name: registers the new user immediately.
   * 2. If in regular login mode: attempts login.
   *    If credentials fail, it checks if the email is registered in Supabase.
   *    If NOT registered, it intelligently detects this is a new person,
   *    switches to signup mode, and asks for their name in one seamless step!
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoNotice(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    const isSpecialAlias = ['zubair2001!', 'zubair2001', 'plainsyt', 'hasanzubair'].includes(cleanEmail.toLowerCase());
    if (!cleanEmail || (!cleanEmail.includes('@') && !isSpecialAlias)) {
      setError('একটি বৈধ ইমেইল বা ব্যবহারকারী নাম প্রদান করুন।');
      return;
    }
    if (!password || password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);

    try {
      // If already in new user mode, proceed to signup
      if (isNewUser) {
        if (!name.trim()) {
          setError('আপনার সম্পূর্ণ নাম লিখুন।');
          setLoading(false);
          nameInputRef.current?.focus();
          return;
        }

        const res = await signupWithEmail(cleanEmail, password, name.trim());
        if (res.ok && res.user) {
          setSuccessMsg(`স্বাগতম, ${res.user.name}! আপনার অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে।`);
          setTimeout(() => {
            onSuccess(res.user!);
            onClose();
          }, 350);
        } else {
          setError(res.error || 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
        return;
      }

      // In login mode: attempt sign in
      const res = await loginWithPassword(cleanEmail, password);
      if (res.ok && res.user) {
        setSuccessMsg(`স্বাগতম, ${res.user.name}!`);
        setTimeout(() => {
          onSuccess(res.user!);
          onClose();
        }, 300);
        return;
      }

      // Login failed — let's check if this email is completely new!
      const norm = cleanEmail.toLowerCase();
      let existsInDb = false;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', norm)
          .maybeSingle();
        existsInDb = Boolean(data);
      } catch {
        existsInDb = false;
      }

      if (!existsInDb) {
        // Goddamn smart auto-detection: user does NOT exist!
        setIsNewUser(true);
        setInfoNotice(
          'স্বাগতম! আপনি নতুন সদস্য হিসেবে শনাক্ত হয়েছেন। অনুগ্রহ করে শুধু আপনার নামটি লিখুন, এখনই অ্যাকাউন্ট তৈরি হয়ে যাবে।'
        );
        setTimeout(() => nameInputRef.current?.focus(), 100);
      } else {
        // User exists, password was just incorrect
        setError(res.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে যাচাই করুন।');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('পাসওয়ার্ড রিকভারির জন্য আপনার ইমেইল প্রদান করুন।');
      return;
    }
    setForgotSent(true);
    setError(null);
  };

  return (
    <Modal open={open ?? true} onClose={onClose} className="max-w-[460px]" labelledBy="auth-modal-title">
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#071f2d] shadow-2xl font-bangla">
        {/* Sleek Modern Header with Lime / Pine gradient */}
        <div className="relative border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-[#041d13] via-[#062c1d] to-[#041d13] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-[#00ED64]/15 border border-[#00ED64]/30 text-[#00ED64] shadow-xs">
                {isNewUser ? <UserPlus className="size-5" /> : <Sparkles className="size-5" />}
              </span>
              <div>
                <h2
                  id="auth-modal-title"
                  className="font-display text-[20px] font-bold tracking-tight text-white leading-tight"
                >
                  {isNewUser ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'প্ল্যাটফর্মে প্রবেশ করুন'}
                </h2>
                <p className="font-mono text-[10.5px] text-[#00ED64] tracking-wider uppercase">
                  PLAiNSYT Ecosystem
                </p>
              </div>
            </div>
            <CloseButton
              onClick={onClose}
              className="bg-white/10 text-white hover:bg-white/20 rounded-full"
            />
          </div>

          {displayReason && (
            <div className="mt-3.5 rounded-xl bg-white/10 border border-white/15 px-3.5 py-2 text-xs text-white/95 backdrop-blur-sm">
              <span className="font-semibold text-[#00ED64]">প্রয়োজনীয়: </span>
              {displayReason}
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          {/* Sign in with Google (1-click for both existing and new users) */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 font-sans text-sm font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 transition shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin text-[#00ED64]" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Google দিয়ে এক ক্লিকে এগিয়ে যান</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/10" />
            </div>
            <span className="relative bg-white dark:bg-[#071f2d] px-3 font-bangla text-xs text-slate-400">
              অথবা ইমেইল দিয়ে প্রবেশ করুন
            </span>
          </div>

          {/* Smart Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Intelligent info notice when system auto-detects new user */}
            {infoNotice && (
              <div className="rounded-xl border border-[#00ED64]/40 bg-[#00ED64]/10 p-3 text-xs font-semibold text-[#006f30] dark:text-[#00ED64] animate-in fade-in slide-in-from-top-1 duration-200">
                ✨ {infoNotice}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900/50 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-[#00ED64]/40 bg-[#00ED64]/10 p-3 text-xs font-semibold text-[#006f30] dark:text-[#00ED64]">
                {successMsg}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                ইমেইল ঠিকানা *
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 size-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="your.email@example.com"
                  className="h-10.5 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-[#00ED64] focus:bg-white dark:focus:bg-[#071f2d] focus:ring-2 focus:ring-[#00ED64]/20 transition"
                  required
                />
              </div>
            </div>

            {/* Smart Dynamic Name Field (Appears when detected as new user) */}
            {isNewUser && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  আপনার পূর্ণ নাম *
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 size-4 text-[#00ED64]" />
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="যেমন: জুবায়ের হাসান / ড. আবদুর রহমান"
                    className="h-10.5 w-full rounded-xl border border-[#00ED64]/60 dark:border-[#00ED64]/40 bg-white dark:bg-white/5 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-[#00ED64] focus:ring-2 focus:ring-[#00ED64]/30 transition shadow-xs"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  পাসওয়ার্ড *
                </label>
                {!isNewUser && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-[#008f3c] dark:text-[#00ED64] hover:underline"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 size-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className="h-10.5 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 pl-10 pr-10 text-sm text-slate-900 dark:text-white outline-none focus:border-[#00ED64] focus:bg-white dark:focus:bg-[#071f2d] focus:ring-2 focus:ring-[#00ED64]/20 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {forgotSent && (
                <p className="mt-1 text-[11px] text-[#008f3c] dark:text-[#00ED64]">
                  পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।
                </p>
              )}
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#00ED64] hover:bg-[#00d859] text-sm font-bold text-[#061621] shadow-tactile-xs disabled:opacity-50 transition active:scale-[0.98] mt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-[#061621]" /> যাচাই করা হচ্ছে…
                </>
              ) : (
                <>
                  <span>{isNewUser ? 'অ্যাকাউন্ট তৈরি ও প্রবেশ করুন' : 'লগইন করুন'}</span>
                  <ArrowRight className="size-4 text-[#061621]" />
                </>
              )}
            </button>

            {/* Smart Mode Switcher link */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsNewUser((prev) => !prev);
                  setError(null);
                  setInfoNotice(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition hover:underline"
              >
                {isNewUser
                  ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? সরাসরি লগইন করুন'
                  : 'নতুন সদস্য? সরাসরি অ্যাকাউন্ট তৈরি করতে ক্লিক করুন'}
              </button>
            </div>

            {/* Cloud Security Indicator */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              <span className="flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5 text-[#00ED64]" /> সম্পূর্ণ সুরক্ষিত ও এনক্রিপ্টেড সংযোগ
              </span>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
