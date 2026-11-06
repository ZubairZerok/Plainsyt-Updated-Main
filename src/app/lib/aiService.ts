// PLAiNSYT AI Agronomy Assistant Service via OpenRouter API

const OPENROUTER_API_KEY =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_OPENROUTER_API_KEY || '';

const CANDIDATE_MODELS = [
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-72b-instruct',
];

const SYSTEM_PROMPT = `আপনি হলেন "PLAiNSYT AI" (প্লেইনসাইট এআই) — বাংলাদেশের আধুনিক কৃষিপ্রযুক্তি, শস্যবিজ্ঞান, মৃত্তিকা বিজ্ঞান ও ফসল সুরক্ষা বিশেষজ্ঞ।

আপনার দায়িত্ব ও নির্দেশনা:
১. সবসময় প্রাঞ্জল, সম্মানজনক ও প্রমিত বাংলায় (হিন্দ শিলিগুড়ি ফন্ট বান্ধব বাংলা) উত্তর দিন।
২. উত্তরগুলো স্পষ্ট বুলেট পয়েন্ট ও পরিমিত শিরোনামে সাজান।
৩. বাংলাদেশের কৃষি গবেষণা সংস্থা যেমন ব্রি (BRRI), বারি (BARI), বিনা (BINA), মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউট (SRDI) এবং কৃষি সম্প্রসারণ অধিদপ্তর (DAE)-এর সুপারিশকৃত প্রযুক্তি ও জাতের রেফারেন্স দিন।
৪. সুনির্দিষ্ট কীটনাশক বা সারের ক্ষেত্রে সঠিক অনুমোদিত মাত্রা ও প্রয়োগবিধি উল্লেখ করুন।
৫. কৃষক ও গবেষকদের জন্য বাস্তবসম্মত, সাশ্রয়ী ও পরিবেশবান্ধব সমাধান প্রদান করুন।
৬. শেষে উপযুক্ত বিজ্ঞানভিত্তিক সোর্স বা গবেষণা সংস্থার নাম ছোট করে উল্লেখ করুন।`;

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
  const cleanKey = OPENROUTER_API_KEY.trim();

  // Prepare context from recent chat messages
  const messages: AIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6).map((m) => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.text,
    })),
    { role: 'user', content: userQuery.trim() },
  ];

  // Try candidate models in order of agronomy performance
  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://plainsyt.com',
          'X-Title': 'PLAiNSYT Agro-Tech Bangladesh',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return {
          answer: content.trim(),
          model,
          isOnline: true,
        };
      }
    } catch {
      // try next candidate
    }
  }

  // Fallback to local curated agronomy engine if external API is unreachable
  return {
    answer: getLocalAgronomyFallback(userQuery),
    model: 'local-knowledge-base',
    isOnline: false,
  };
}

function getLocalAgronomyFallback(q: string): string {
  const l = q.toLowerCase();
  if (l.includes('লবণ') || l.includes('salin') || l.includes('salt')) {
    return 'উপকূলীয় লবণাক্ত মাটির জন্য তিনটি প্রমাণিত ধাপ:\n\n১. লবণসহিষ্ণু জাত — ব্রি ধান৬৭, ব্রি ধান৯৭ বা বারি গম-২৫ বেছে নিন।\n২. জমিতে ১৫–২০ সেমি উঁচু আইল দিয়ে বর্ষার মিঠা পানি ধরে রাখুন, এতে মূলাঞ্চলের লবণ ধুয়ে যায়।\n৩. শুকনো মৌসুমে মালচিং (খড় বা কচুরিপানা) করলে মাটির উপরিভাগে লবণ জমা ৩০–৪০% কমে।\n\nEC ৮ dS/m-এর বেশি হলে নিকটস্থ উপজেলা কৃষি অফিসে মাটি পরীক্ষা করিয়ে নিন।';
  }
  if (l.includes('বায়োচার') || l.includes('biochar')) {
    return 'বায়োচার হলো অক্সিজেন-স্বল্প অবস্থায় নিয়ন্ত্রিত তাপে পোড়ানো জৈব কার্বন (যেমন ধানের তুষ)।\n\n• প্রয়োগমাত্রা: শতকপ্রতি ৮–১০ কেজি, শেষ চাষের সময় মাটির সাথে মিশিয়ে দিন।\n• ট্রাইকোডার্মা-সমৃদ্ধ কম্পোস্টের সাথে মেশালে মাটিতে উপকারী অণুজীব দ্রুত বাড়ে।\n• গবেষণায় দেখা গেছে মাটির জৈব কার্বন ৩১% এবং জলধারণ ক্ষমতা প্রায় ২৫% বৃদ্ধি পায়।\n\nএকবার প্রয়োগ করলে ৩–৫ বছর পর্যন্ত কার্যকর থাকে।';
  }
  if (l.includes('ড্রোন') || l.includes('drone') || l.includes('স্প্রে') || l.includes('spray')) {
    return 'আধুনিক ড্রোন স্প্রে প্রয়োগে সতর্কতামূলক নিয়মাবলী:\n\n১. বাতাসের গতিবেগ ঘণ্টায় ১৫ কিমি-এর কম থাকলে স্প্রে করুন।\n২. ফসলের ক্যানোপি থেকে ২–৩ মিটার উচ্চতা ও ৪–৫ মি/সেকেন্ড গতি বজায় রাখুন।\n৩. প্রচলিত পদ্ধতির তুলনায় পানি অনেক কম লাগে — বিঘাপ্রতি মাত্র ২–৩ লিটার মিশ্রণ।\n৪. পরাগায়নকারী মৌমাছির সক্রিয় সময় (সকাল ৯টা–১১টা) স্প্রে করা পরিহার করুন।';
  }
  if (l.includes('ব্লাস্ট') || l.includes('blast')) {
    return 'ধানের ব্লাস্ট রোগ (Magnaporthe oryzae) নিয়ন্ত্রণের বিজ্ঞানসম্মত পদ্ধতি:\n\n• লক্ষণ: পাতায় চোখের মতো ধূসর কেন্দ্রযুক্ত বাদামি দাগ ও শীষের গোড়া পচে যাওয়া।\n• প্রতিরোধ: ইউরিয়ার অতিরিক্ত প্রয়োগ বন্ধ করে পটাশ সার ব্যবহার করুন।\n• প্রতিকার: ট্রাইসাইক্লাজোল ৭৫ WP (১০ লিটার পানিতে ৮ গ্রাম) অথবা অ্যাজোক্সিস্ট্রবিন + ডাইফেনোকোনাজল (১০ লিটার পানিতে ১০ মিলি) ৭ দিন অন্তর ২ বার স্প্রে করুন।\n• শীষ বের হওয়ার মুখে একবার আগাম প্রতিরোধক স্প্রে অত্যন্ত কার্যকর।';
  }
  if (l.includes('ph') || l.includes('পিএইচ') || l.includes('অম্ল') || l.includes('চুন')) {
    return 'মাটির pH পরীক্ষা ও সংশোধন বিধি:\n\n• pH ৫.৫-এর নিচে (তীব্র অম্লীয়): শতকপ্রতি ৪–৮ কেজি ডলোচুন জমিতে প্রয়োগ করুন, বীজ বপনের কমপক্ষে ১৫ দিন আগে।\n• pH ৭.৫-এর উপরে (ক্ষারীয়): জিপসাম ও জৈব সারের প্রয়োগ বাড়ান।\n• বেশিরভাগ ফসলের আদর্শ মান: ৬.০ থেকে ৭.০ (নিরপেক্ষ)।\n\nসঠিক বিশ্লেষণের জন্য এসআরডিআই (SRDI) ভ্রাম্যমাণ গবেষণাগারে মাটি পরীক্ষা করাতে পারেন।';
  }
  return `আপনার প্রশ্নের জন্য ধন্যবাদ।\n\nবাংলাদেশের কৃষি সম্প্রসারণ অধিদপ্তর (DAE) ও বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC)-এর সুপারিশ অনুসারে, যেকোনো রোগবালাই বা সারের মাত্রা নির্ধারণের আগে ফসলের সঠিক বয়স ও মাটির ধরন যাচাই করা জরুরি।\n\nআপনি নির্দিষ্ট কোনো ফসল (যেমন: ধান, গম, সরিষা, ভুট্টা, সবজি) বা সমস্যা (যেমন: রোগবালাই, সার প্রয়োগ, সেচ বা আর্দ্রতা সেন্সর) সম্পর্কে প্রশ্ন করলে আরও নির্ভুল তথ্য প্রদান করতে পারব।`;
}
