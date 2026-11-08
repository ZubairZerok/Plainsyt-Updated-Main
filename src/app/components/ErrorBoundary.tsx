import React, { Component, type ReactNode } from 'react';
import { useRouteError, useNavigate } from 'react-router';
import { RefreshCw, Home } from 'lucide-react';
import { LOGOS } from '../lib/supabase';

// Filter out developer / runtime JS errors like "useState is not defined", ReferenceError, etc.
type ErrorLike = { status?: number; statusText?: string; message?: string; data?: unknown } | null | undefined;
function getSafeErrorMessage(rawError: unknown): string {
  const error = rawError as ErrorLike;
  if (error?.status === 404 || error?.statusText === 'Not Found') {
    return 'কাঙ্ক্ষিত পৃষ্ঠা বা তথ্যটি খুঁজে পাওয়া যায়নি।';
  }

  const raw = String(error?.message || error?.statusText || error?.data || '');

  // Regex targeting internal JS / React / Vite developer errors
  const isInternalJsError =
    /useState|useEffect|useContext|useMemo|useCallback|useRef|render|is not defined|ReferenceError|TypeError|SyntaxError|Cannot read|undefined is not|null is not|chunk|minified|vite|react/i.test(
      raw
    );

  if (!raw || isInternalJsError) {
    return 'একটি সাময়িক কারিগরি জটিলতা দেখা দিয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা মূল পাতায় ফিরে যান।';
  }

  // If already Bengali and not a developer exception, display it safely
  if (/[\u0980-\u09FF]/.test(raw) && !isInternalJsError) {
    return raw;
  }

  return 'একটি সাময়িক কারিগরি জটিলতা দেখা দিয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন অথবা মূল পাতায় ফিরে যান।';
}

/**
 * High-tech Red Glitch Icon for PLAiNSYT
 * - Pure Red (#FF2E2E) using CSS mask-image (guarantees 100% solid vivid red with NO yellow/amber tint).
 * - No square border/box around it.
 * - No horizontal break lines.
 * - Significantly bigger (112px - 128px).
 * - Glitch chromatic aberration and jitter animations.
 */
export function RedGlitchPlainsytIcon() {
  const iconUrl = LOGOS.icon;

  return (
    <div className="relative mx-auto my-6 flex items-center justify-center select-none w-28 h-28 sm:w-32 sm:h-32">
      <style>{`
        @keyframes red-glitch-anim {
          0% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          10% {
            transform: translate(-4px, 2px);
            clip-path: inset(12% 0 60% 0);
          }
          20% {
            transform: translate(4px, -2px);
            clip-path: inset(35% 0 35% 0);
          }
          30% {
            transform: translate(-3px, 1px);
            clip-path: inset(65% 0 15% 0);
          }
          45% {
            transform: translate(3px, -1px);
            clip-path: inset(8% 0 75% 0);
          }
          55% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          70% {
            transform: translate(-3px, -2px);
            clip-path: inset(45% 0 25% 0);
          }
          85% {
            transform: translate(4px, 1px);
            clip-path: inset(22% 0 55% 0);
          }
          100% {
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
        }

        @keyframes red-glitch-jitter {
          0% {
            transform: translate(0);
            opacity: 0.7;
          }
          15% {
            transform: translate(5px, -2px);
            opacity: 0.9;
          }
          35% {
            transform: translate(-5px, 2px);
            opacity: 0.75;
          }
          65% {
            transform: translate(3px, 1px);
            opacity: 0.85;
          }
          100% {
            transform: translate(0);
            opacity: 0.7;
          }
        }

        @keyframes red-glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 16px rgba(255, 46, 46, 0.75)) drop-shadow(0 0 32px rgba(239, 68, 68, 0.45));
          }
          50% {
            filter: drop-shadow(0 0 26px rgba(255, 46, 46, 0.95)) drop-shadow(0 0 45px rgba(239, 68, 68, 0.65));
          }
        }
      `}</style>

      {/* Layer 1: Red Glitch Offset Clone (Left Chromatic Aberration) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'red-glitch-anim 2.1s infinite ease-in-out',
          backgroundColor: '#DC2626',
          maskImage: `url(${iconUrl})`,
          WebkitMaskImage: `url(${iconUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          opacity: 0.85,
        }}
      />

      {/* Layer 2: Vivid Crimson Shift Clone (Right Glitch Jitter) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          animation: 'red-glitch-jitter 1.7s infinite steps(2, start)',
          backgroundColor: '#FF4D6D',
          maskImage: `url(${iconUrl})`,
          WebkitMaskImage: `url(${iconUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          opacity: 0.7,
        }}
      />

      {/* Layer 3: Main Base Icon in 100% Pure Intense Red (#FF2E2E) */}
      <div
        className="relative z-10 w-full h-full"
        style={{
          animation: 'red-glow-pulse 2.4s ease-in-out infinite',
          backgroundColor: '#FF2E2E',
          maskImage: `url(${iconUrl})`,
          WebkitMaskImage: `url(${iconUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
    </div>
  );
}

function getCurrentPageContext(): { label: string; pageName: string } {
  if (typeof window === 'undefined') {
    return { label: 'ফিডে পুনরায় চেষ্টা করুন', pageName: 'ফিড' };
  }
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/explore')) {
    return { label: 'এক্সপ্লোরে পুনরায় চেষ্টা করুন', pageName: 'এক্সপ্লোর' };
  }
  if (path.startsWith('/events')) {
    return { label: 'ইভেন্টসে পুনরায় চেষ্টা করুন', pageName: 'ইভেন্টস' };
  }
  if (path.startsWith('/editorial')) {
    return { label: 'ড্যাশবোর্ডে পুনরায় চেষ্টা করুন', pageName: 'সম্পাদকীয় ড্যাশবোর্ড' };
  }
  if (path.startsWith('/notifications')) {
    return { label: 'বিজ্ঞপ্তিতে পুনরায় চেষ্টা করুন', pageName: 'বিজ্ঞপ্তি' };
  }
  if (path.startsWith('/profile')) {
    return { label: 'প্রোফাইলে পুনরায় চেষ্টা করুন', pageName: 'প্রোফাইল' };
  }
  if (path.startsWith('/article')) {
    return { label: 'প্রতিবেদনে পুনরায় চেষ্টা করুন', pageName: 'প্রতিবেদন' };
  }
  if (path.startsWith('/reels')) {
    return { label: 'রিলসে পুনরায় চেষ্টা করুন', pageName: 'রিলস' };
  }
  return { label: 'ফিডে পুনরায় চেষ্টা করুন', pageName: 'ফিড' };
}

/**
 * Error Screen Presentation Layout
 */
function ErrorScreenView({
  errorMessage,
  onReload,
  onGoHome,
}: {
  errorMessage: string;
  onReload: () => void;
  onGoHome: () => void;
}) {
  const pageContext = getCurrentPageContext();

  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#061621] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 font-bangla transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#0b2433] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-white/10 text-center relative overflow-hidden">
        {/* Subtle decorative top border in brand lime green */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#03EF62] via-emerald-400 to-[#03EF62]" />

        {/* Big Red Glitch Platform Logo (replaces former exclamation mark) */}
        <RedGlitchPlainsytIcon />

        {/* Category Pill / Status Tag */}
        <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
          <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
          সিস্টেম নোটিশ · {pageContext.pageName}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold mt-3 mb-2 text-slate-900 dark:text-white">
          সাময়িক জটিলতা দেখা দিয়েছে
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          {errorMessage}
        </p>

        {/* Action Buttons using brand Lime Green */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onReload}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#03EF62] hover:bg-[#02d955] text-[#061621] font-bold shadow-tactile-xs active:scale-95 transition text-sm"
          >
            <RefreshCw className="size-4 text-[#061621]" />
            {pageContext.label}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-slate-800 dark:text-white font-semibold hover:border-[#03EF62] hover:text-[#03EF62] active:scale-95 transition text-sm shadow-xs"
          >
            <Home className="size-4" />
            মূল পাতা
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * React Router Route Error Boundary
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage = getSafeErrorMessage(error);

  return (
    <ErrorScreenView
      errorMessage={errorMessage}
      onReload={() => window.location.reload()}
      onGoHome={() => navigate('/')}
    />
  );
}

/**
 * Top-level React Class ErrorBoundary for Catching Any Unhandled Runtime Render Errors
 */
interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PLAiNSYT Unhandled Exception Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = getSafeErrorMessage(this.state.error);
      return (
        <ErrorScreenView
          errorMessage={errorMessage}
          onReload={() => window.location.reload()}
          onGoHome={() => {
            window.location.href = '/';
          }}
        />
      );
    }
    return this.props.children;
  }
}
