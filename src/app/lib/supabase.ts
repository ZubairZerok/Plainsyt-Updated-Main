import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_REF = 'fycghkjzodjrqornkton';
export const SUPABASE_URL =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL ||
  'https://fycghkjzodjrqornkton.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_csbbXPJ3o30zq68_RK-ldw_OVfArrSY';

export const BKASH_RECEIVER_NUMBER = '01771047033' as const;

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
  },
  global: {
    headers: {
      'x-application-name': 'plainsyt-agritech-bd',
    },
  },
});
