import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe in the browser. RLS enforces access.
const SUPABASE_URL = "https://gdcbiaolnroeyeefojuh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_brVhsc74kAGK_WKHuAZjIw_d65fxkMs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SCRAPE_WEBHOOK_URL =
  "https://n8n.srv971626.hstgr.cloud/webhook/scrape-instant";
