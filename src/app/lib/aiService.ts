// PLAiNSYT AI Agronomy Assistant Service via OpenRouter & Live AI Engine

function getApiKey(): string {
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENROUTER_API_KEY || '';
  if (envKey && envKey.trim().length > 0) return envKey.trim();
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('plainsyt_openrouter_api_key');
    if (stored && stored.trim().length > 0) return stored.trim();
  }
  return '';
}

const CANDIDATE_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
  'deepseek/deepseek-chat',
];

const SYSTEM_PROMPT = `আপনি হলেন "PLAiNSYT AI" (প্লেইনসাইট এআই) — বাংলাদেশের কৃষি, শস্য ও প্রযুক্তি সহকারী।

কড়া নির্দেশনা:
১. সবসময় সহজ, সরল, প্রাঞ্জল ও প্রমিত বাংলায় (হিন্দ শিলিগুড়ি ফন্ট বান্ধব) উত্তর দিন। ইংরেজি পরিহার করুন।
২. উত্তর সবসময় সংক্ষিপ্ত, স্পষ্ট ও টু-দ্য-পয়েন্ট (simple and precise) রাখুন।
৩. কৃষকের জিজ্ঞাসা অনুযায়ী সরাসরি কাজের সমাধান, সঠিক সার বা বালাইনাশকের নাম ও মাত্রা (যেমন: লবণাক্ত সহনশীল জাত, ধানের ব্লাস্ট রোগ প্রতিরোধ, কারেন্ট পোকা বা বাদামি গাছফড়িং দমন, পর্যায়ক্রমে ভিজানো ও শুকানো AWD সেচ পদ্ধতি ইত্যাদি) এবং সময়োপযোগী করণীয় বুলেট পয়েন্টে দিন।
৪. অপ্রয়োজনীয় ভূমিকা বা দীর্ঘ তত্ত্ব পরিহার করে স্পষ্ট কার্যকর পরামর্শ দিন।`;

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  answer: string;
  source?: string;
  model: string;
  isOnline: boolean;
}

export async function queryPlainsytAI(
  userQuery: string,
  history: { role: 'user' | 'ai'; text: string }[] = []
): Promise<AIResponse> {
  const apiKey = getApiKey();

  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    })),
    { role: 'user', content: userQuery.trim() },
  ];

  // 1. Attempt OpenRouter if key is present
  if (apiKey) {
    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://pla.insyt.bd',
            'X-Title': 'PLAiNSYT Agro-Tech Bangladesh',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.5,
            max_tokens: 800,
          }),
        });

        if (response.status === 401) {
          // Key is invalid or expired — stop immediately to avoid log spam
          break;
        }

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content && typeof content === 'string' && content.trim().length > 0) {
            return {
              answer: content.trim(),
              model,
              isOnline: true,
            };
          }
        }
      } catch {
        // Try next or fall through to live fallback
      }
    }
  }

  // 2. Seamless live LLM endpoint for dynamic generation without hardcoding
  try {
    const liveRes = await fetch('https://text.pollinations.ai/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai',
        messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (liveRes.ok) {
      const liveData = await liveRes.json();
      const liveContent = liveData?.choices?.[0]?.message?.content;
      if (liveContent && typeof liveContent === 'string' && liveContent.trim().length > 0) {
        return {
          answer: liveContent.trim(),
          model: 'plainsyt-live-ai',
          isOnline: true,
        };
      }
    }
  } catch {
    // Network offline
  }

  // 3. Clean message if network is unreachable
  return {
    answer: 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।',
    model: 'plainsyt-core',
    isOnline: false,
  };
}

export function getLocalAgronomyFallback(_q: string): string {
  return 'সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন অথবা আপনার OpenRouter API Key কনফিগার করুন।';
}
