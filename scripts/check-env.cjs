// Simple build-time guard to ensure EXPO_PUBLIC_* env vars are present
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('[build] EXPO_PUBLIC_SUPABASE_URL =', url ? url : '(missing)');
console.log('[build] EXPO_PUBLIC_SUPABASE_ANON_KEY prefix =', anon ? anon.slice(0, 8) : '(missing)');

if (!url || !anon) {
  console.error('[build] Missing EXPO_PUBLIC_ Supabase env. Configure in Vercel (Production & Preview) and Redeploy with Clear build cache.');
  process.exit(1);
}

if (url.includes('your-project')) {
  console.error('[build] Placeholder Supabase URL detected. Set the real project URL.');
  process.exit(1);
}

console.log('[build] Env OK. Proceeding with export...');

