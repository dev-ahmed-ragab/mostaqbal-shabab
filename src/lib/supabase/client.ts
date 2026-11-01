import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

// التحقق مما إذا كانت بيانات Supabase مهيأة
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co'
);

let browserClient: SupabaseClient | null = null;

/**
 * عميل Supabase للمتصفح.
 * نستخدم createBrowserClient من @supabase/ssr حتى تُحفظ الجلسة في كوكيز
 * يمكن للخادم (proxy / server components) قراءتها والتحقق منها.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase غير مهيأ.');
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? getSupabaseBrowserClient()
  : null;
