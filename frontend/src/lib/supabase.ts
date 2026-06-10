import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let supabaseUrl = (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) 
  ? rawUrl.trim() 
  : "https://placeholder.supabase.co";

// Sanitize URL by removing trailing slash and /rest/v1 path suffix if present
if (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}
if (supabaseUrl.endsWith("/rest/v1")) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}
if (supabaseUrl.endsWith("/")) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key").trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
