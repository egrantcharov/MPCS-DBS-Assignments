import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

export function createSupabaseClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });
}

// Public client for reading all favorites (no auth needed)
export const supabase = createClient(supabaseUrl, supabaseKey);
