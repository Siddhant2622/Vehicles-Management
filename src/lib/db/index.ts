import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)
  : null;

// Dual-mode database execution helper
export async function dbQuery<T>(
  supabaseQuery: () => Promise<{ data: T | null; error: any }>,
  localFallback: () => T
): Promise<T> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabaseQuery();
      if (error) {
        console.warn('Supabase query error, using local fallback:', error);
        return localFallback();
      }
      return data as T;
    } catch (err) {
      console.warn('Supabase connection failed, using local fallback:', err);
      return localFallback();
    }
  }
  return localFallback();
}
