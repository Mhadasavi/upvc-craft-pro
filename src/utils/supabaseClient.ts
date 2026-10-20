import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Indicates whether Supabase credentials have been provided in .env
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

/**
 * Global Supabase Client instance (null when not configured)
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '[uPVC Craft Pro] Supabase credentials not found in environment (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Running in Local/Demo Mode. Configure .env with your Supabase project keys to enable cloud sync.'
  );
}
