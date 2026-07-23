import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Missing Supabase environment variables.\n" +
    "Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon, {
  auth: {
    // Persist session across page refreshes using localStorage
    persistSession: true,
    // Automatically refresh the JWT before it expires
    autoRefreshToken: true,
    // Listen for auth state changes in the browser
    detectSessionInUrl: true,
  },
});
