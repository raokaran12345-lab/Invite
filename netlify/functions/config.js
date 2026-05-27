/* ============================================================
   DebtIQ — public runtime config (Netlify Function)
   Returns the PUBLIC Supabase values (the anon key is designed to be
   client-side and is safe to expose; row-level security protects data).
   Set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify env vars.
   If unset, the app runs in static demo mode (no auth/persistence).
   ============================================================ */
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  })
});
