import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client for realtime subscriptions
// Uses anon key (public, read-only via RLS)
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
