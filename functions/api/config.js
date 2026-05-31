/* ============================================================
   DebtIQ — public runtime config (Cloudflare Pages Function)
   GET /api/config — returns the PUBLIC Supabase values.
   The anon key is designed to be client-side and is safe to expose;
   row-level security protects user data on the Supabase side.
   Set SUPABASE_URL / SUPABASE_ANON_KEY in the Pages project's
   Environment variables (Production & Preview). If unset, the app
   runs in static demo mode (no auth/persistence).
   ============================================================ */
export const onRequest = async ({ env }) => {
  return new Response(JSON.stringify({
    supabaseUrl: env.SUPABASE_URL || '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY || ''
  }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
};
