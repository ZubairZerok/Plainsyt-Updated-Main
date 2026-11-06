import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Bot, Key, Check } from 'lucide-react';
import type { UserProfile } from '../types';
import { Modal, CloseButton, Avatar, cn } from './Primitives';
import { PlainsytWordmark } from './PlainsytLogo';
import { queryPlainsytAI, getLocalAgronomyFallback } from '../lib/aiService';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

const SUGGESTED = [
  'লবণাক্ত জমিতে কোন জাতের ধান সেরা?',
  'ধানের ব্লাস্ট ও কারেন্ট পোকা দমন',
  'মাটির pH ও অম্লত্ব নিরসনে চুন প্রয়োগ',
  'বায়োচার জমিতে কীভাবে ব্যবহার করব?',
  'AWD সেচ পদ্ধতিতে পানি সাশ্রয়',
  'আলুর নাবী ধসা রোগ প্রতিকার',
  'ড্রোন স্প্রে প্রয়োগের নিয়মাবলী',
];

export function AskAIModal({
  open,
  onClose,
  currentUser,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: 'আসসালামু আলাইকুম! আমি Plainsyt AI কৃষি সহকারী। মাটি, ফসল, রোগবালাই, ড্রোন সেন্সিং বা কৃষিপ্রযুক্তি — যেকোনো প্রশ্ন বাংলায় করতে পারেন।',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyVal, setApiKeyVal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('plainsyt_openrouter_api_key') || '';
    }
    return '';
  });
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveKey = () => {
    if (typeof window !== 'undefined') {
      if (apiKeyVal.trim()) {
        localStorage.setItem('plainsyt_openrouter_api_key', apiKeyVal.trim());
      } else {
        localStorage.removeItem('plainsyt_openrouter_api_key');
      }
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 2000);
    }
  };

  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, typing, thinking]);
  useEffect(() => () => window.clearInterval(timer.current), []);

  const ask = async (q: string) => {
    if (!q.trim() || thinking || typing !== null) return;
    const userMsg = q.trim();
    setMsgs((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setThinking(true);

    try {
      const res = await queryPlainsytAI(userMsg, msgs);
      setThinking(false);
      let i = 0;
      setTyping('');
      timer.current = window.setInterval(() => {
        i += 6;
        if (i >= res.answer.length) {
          window.clearInterval(timer.current);
          setTyping(null);
          setMsgs((m) => [...m, { role: 'ai', text: res.answer }]);
        } else {
          setTyping(res.answer.slice(0, i));
        }
      }, 14);
    } catch {
      setThinking(false);
      const fallbackText = getLocalAgronomyFallback(userMsg);
      setMsgs((m) => [...m, { role: 'ai', text: fallbackText }]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-[640px]" labelledBy="ai-title">
      <div className="flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 dark:border-white/10 bg-canvas-card shadow-2xl sm:h-[78vh] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#041d13] px-5 py-3.5 text-white">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <PlainsytWordmark lang="bn" className="h-4" />
              <h2 id="ai-title" className="font-display text-[18px] font-semibold leading-tight">
                AI কৃষি সহকারী
              </h2>
            </div>
            <p className="font-mono text-[10px] tracking-wider text-emerald-300/80">
              BRRI · BARI · SRDI সূত্রভিত্তিক · 24/7
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              title="OpenRouter API Key কনফিগারেশন"
              aria-label="API Key Settings"
              className={cn(
                'flex size-9 items-center justify-center rounded-full transition cursor-pointer',
                showKeyInput || apiKeyVal ? 'bg-emerald-500/30 text-[#03EF62]' : 'bg-white/10 text-white hover:bg-white/20',
              )}
            >
              <Key className="size-4" />
            </button>
            <CloseButton onClick={onClose} className="bg-white/10 text-white hover:bg-white/20" />
          </div>
        </div>

        {showKeyInput && (
          <div className="border-b border-white/10 bg-[#06261a] px-5 py-3 text-white transition animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bangla text-xs font-semibold text-emerald-300">
                OpenRouter API Key (ঐচ্ছিক):
              </span>
              {keySaved && (
                <span className="inline-flex items-center gap-1 font-bangla text-[11px] text-[#03EF62]">
                  <Check className="size-3" /> সংরক্ষিত হয়েছে
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKeyVal}
                onChange={(e) => setApiKeyVal(e.target.value)}
                placeholder="sk-or-v1-..."
                className="h-8 flex-1 rounded-lg border border-white/20 bg-black/40 px-3 font-mono text-xs text-white placeholder:text-white/40 focus:border-[#03EF62] outline-none"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="h-8 px-3 rounded-lg bg-[#03EF62] text-[#061621] font-bangla text-xs font-bold hover:bg-[#02d857] transition cursor-pointer"
              >
                সংরক্ষণ
              </button>
            </div>
            <p className="mt-1 text-[10px] text-white/60 font-bangla">
              কী না থাকলেও ইন-বিল্ট বৈজ্ঞানিক ডাটাবেজ স্বয়ংক্রিয়ভাবে উত্তর দেবে।
            </p>
          </div>
        )}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {msgs.map((m, i) => (
            <div key={i} className={cn('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
              {m.role === 'ai' ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-pine-900 bg-pine-100 text-pine-800">
                  <Bot className="size-4" />
                </span>
              ) : (
                <Avatar src={currentUser?.avatar || 'PS'} size="size-8" />
              )}
              <div
                className={cn(
                  'max-w-[82%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 font-bangla text-[14.5px] leading-relaxed',
                  m.role === 'ai'
                    ? 'rounded-tl-sm border border-canvas-border bg-canvas-card text-pine-900'
                    : 'rounded-tr-sm bg-pine-900 text-canvas',
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full border border-pine-900 bg-pine-100 text-pine-800">
                <Bot className="size-4" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl border border-canvas-border bg-canvas-card px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-pine-500"
                    style={{ animationDelay: `${d * 120}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          {typing !== null && (
            <div className="flex gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-pine-900 bg-pine-100 text-pine-800">
                <Bot className="size-4" />
              </span>
              <div className="max-w-[82%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-canvas-border bg-canvas-card px-3.5 py-2.5 font-bangla text-[14.5px] leading-relaxed text-pine-900">
                {typing}
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-pine-600 [animation:blink_1s_steps(1)_infinite]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-canvas-border bg-canvas px-3 pb-3 pt-2.5">
          <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="shrink-0 rounded-full border border-pine-900/25 bg-canvas-card px-3 py-1 font-bangla text-[12.5px] text-pine-900 transition hover:border-pine-900 hover:bg-pine-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার প্রশ্ন লিখুন…"
              className="h-11 flex-1 rounded-full border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 font-bangla text-[14.5px] text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-canvas-card transition"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="flex size-11 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-40 transition"
            >
              <Send className="size-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
