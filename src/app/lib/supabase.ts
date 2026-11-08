import { createClient } from '@supabase/supabase-js';

type ViteEnv = { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string; VITE_SUPABASE_ANON_KEY?: string };
const env = (import.meta as unknown as { env?: ViteEnv }).env ?? {};

// The Supabase URL and publishable (anon) key are PUBLIC by design; data safety comes from
// Row-Level Security (see supabase/migrations). The fallbacks keep builds working when the
// hosting dashboard has no env vars configured. Never put secret keys in VITE_* variables.
export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://fycghkjzodjrqornkton.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_csbbXPJ3o30zq68_RK-ldw_OVfArrSY';

export const LOGOS = {
  banglaWhite: '/logos/Bangla.png',
  englishWhite: '/logos/English.png',
  icon: '/logos/icon.png',
  cdnBanglaWhite: 'https://i.postimg.cc/PLgRsfZL/Bangla.png',
  cdnEnglishWhite: 'https://i.postimg.cc/kV0p3M8X/English.png',
  cdnIcon: 'https://i.postimg.cc/wtyGGRtH/icon.png',
} as const;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: { headers: { 'x-application-name': 'plainsyt-agritech-bd' } },
});
