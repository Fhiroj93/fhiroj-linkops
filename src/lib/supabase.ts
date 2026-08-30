import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe in the browser. RLS enforces access.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SCRAPE_WEBHOOK_URL = import.meta.env.VITE_SCRAPE_WEBHOOK_URL;
