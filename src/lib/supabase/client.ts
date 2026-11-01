import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
 * Supabase هنا للبيانات/التخزين فقط، وليس للهوية أو الأدوار.
 * لذلك نعطّل حفظ الجلسة وتجديدها: الدخول يتم بكلمة سر واحدة على الخادم.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase غير مهيأ.');
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return browserClient;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? getSupabaseBrowserClient()
  : null;
