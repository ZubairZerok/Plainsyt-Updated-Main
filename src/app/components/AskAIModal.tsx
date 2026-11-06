import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Bot } from 'lucide-react';
import type { UserProfile } from '../types';
import { Modal, CloseButton, Avatar, cn } from './Primitives';
import { PlainsytWordmark } from './PlainsytLogo';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

const KB: { keys: string[]; answer: string; source: string }[] = [
  {
    keys: ['লবণ', 'salin', 'salt'],
    source: 'SRDI Soil Salinity Report 2024 · BARI',
    answer:
      'উপকূলীয় লবণাক্ত মাটির জন্য তিনটি ধাপ কাজে দেয়:\n\n১. লবণসহিষ্ণু জাত — ব্রি ধান৬৭, ব্রি ধান৯৭ বা বারি গম-২৫ বেছে নিন।\n২. জমিতে ১৫–২০ সেমি উঁচু আইল দিয়ে বর্ষার মিঠা পানি ধরে রাখুন, এতে মূলাঞ্চলের লবণ ধুয়ে যায়।\n৩. শুকনো মৌসুমে মালচিং (খড় বা কচুরিপানা) করলে মাটির উপরিভাগে লবণ জমা ৩০–৪০% কমে।\n\nEC ৮ dS/m-এর বেশি হলে নিকটস্থ উপজেলা কৃষি অফিসে মাটি পরীক্ষা করিয়ে নিন।',
  },
  {
    keys: ['বায়োচার', 'biochar'],
    source: 'Jahan et al., BSMRAU (2025)',
    answer:
      'বায়োচার হলো অক্সিজেন-স্বল্প অবস্থায় পোড়ানো জৈব পদার্থ (যেমন ধানের তুষ)।\n\n• প্রয়োগমাত্রা: শতকপ্রতি ৮–১০ কেজি, শেষ চাষের সময় মিশিয়ে দিন।\n• ট্রাইকোডার্মা-সমৃদ্ধ কম্পোস্টের সাথে মেশালে উপকারী অণুজীব দ্রুত বাড়ে।\n• দাকোপের মাঠ পরীক্ষায় মাটির জৈব কার্বন ৩১% এবং টমেটোর ফলন ২২% বেড়েছে।\n\nএকবার দিলে ৩–৫ বছর কার্যকর থাকে।',
  },
  {
    keys: ['ড্রোন', 'drone', 'স্প্রে', 'spray'],
    source: 'CAAB Drone Guidelines · DAE Advisory',
    answer:
      'ড্রোন স্প্রের আগে মনে রাখুন:\n\n১. বাতাসের গতি ঘণ্টায় ১৫ কিমির কম হলে স্প্রে করুন।\n২. ফসলের উপর থেকে ২–৩ মিটার উচ্চতা, গতি ৪–৫ মি/সে।\n৩. প্রচলিত মাত্রার চেয়ে পানি অনেক কম লাগে — বিঘাপ্রতি ২–৩ লিটার দ্রবণ।\n৪. মৌমাছির চলাচলের সময় (সকাল ৯–১১টা) এড়িয়ে চলুন।\n৫. CAAB নিবন্ধিত অপারেটর ছাড়া উড়াবেন না।',
  },
  {
    keys: ['ব্লাস্ট', 'blast'],
    source: 'BRRI Rice Disease Management Guide',
    answer:
      'ধানের ব্লাস্ট রোগ (Magnaporthe oryzae) চিনবেন পাতায় চোখের মতো ধূসর দাগ আর শীষের গোড়া পচে যাওয়া দেখে।\n\n• প্রতিরোধ: ইউরিয়ার অতিরিক্ত ব্যবহার বন্ধ করুন, জমিতে পানি ধরে রাখুন।\n• প্রতিকার: ট্রাইসাইক্লাজোল ৭৫ WP — ১০ লিটার পানিতে ৮ গ্রাম, অথবা ট্রাইফ্লক্সিস্ট্রবিন + টেবুকোনাজল ৬ গ্রাম; ৭ দিন অন্তর দুইবার।\n• শীষ বের হওয়ার আগে একবার প্রতিরোধমূলক স্প্রে সবচেয়ে কার্যকর।',
  },
  {
    keys: ['ph', 'পিএইচ', 'অম্ল', 'চুন'],
    source: 'SRDI Fertilizer Recommendation Guide',
    answer:
      'মাটির pH মাপার সহজ উপায়: ১ ভাগ মাটি + ২.৫ ভাগ পাতিত পানি মিশিয়ে ৩০ মিনিট রাখুন, তারপর pH মিটার বা লিটমাস কাগজ ডুবান।\n\n• pH ৫.৫-এর নিচে (অম্লীয়): শতকপ্রতি ৪–৮ কেজি ডলোচুন দিন, বীজ বোনার ১৫ দিন আগে।\n• pH ৭.৫-এর উপরে (ক্ষারীয়): জিপসাম ও জৈব সার বাড়ান।\n• বেশিরভাগ ফসলের জন্য আদর্শ: ৬.০–৭.০।',
  },
];

const SUGGESTED = [
  'লবণাক্ত মাটিতে কী চাষ করব?',
  'বায়োচার কীভাবে ব্যবহার করব?',
  'ড্রোন স্প্রের নিয়ম',
  'ধানের ব্লাস্ট রোগ দমন',
  'মাটির pH কীভাবে মাপব?',
];

function answer(q: string) {
  const l = q.toLowerCase();
  const hit = KB.find((k) => k.keys.some((key) => l.includes(key)));
  return (
    hit ?? {
      answer:
        'প্রশ্নের জন্য ধন্যবাদ! এই বিষয়ে আরও নির্দিষ্টভাবে জানাবেন? যেমন — ফসলের নাম, জেলা ও বর্তমান সমস্যা। আমি এখন মাটির লবণাক্ততা, বায়োচার, ড্রোন স্প্রে, ধানের ব্লাস্ট ও মাটির pH বিষয়ে সবচেয়ে ভালোভাবে সাহায্য করতে পারি।',
      source: 'Plainsyt AI · Agronomy Knowledge Engine',
    }
  );
}

import { queryPlainsytAI } from '../lib/aiService';

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
      const fallback = answer(userMsg);
      setMsgs((m) => [...m, { role: 'ai', text: fallback.answer }]);
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
          <CloseButton onClick={onClose} className="bg-white/10 text-white hover:bg-white/20" />
        </div>
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
