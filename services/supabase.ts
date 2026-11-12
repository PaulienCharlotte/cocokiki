export function supabaseAnalyticsConfig(env: Record<string, unknown> = import.meta.env) {
  if (env.VITE_ANALYTICS_ENABLED !== 'true' || env.VITE_ANALYTICS_PRIVACY_APPROVED !== 'true') return null;
  try {
    const url = new URL(String(env.VITE_SUPABASE_URL ?? ''));
    const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '');
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return null;
    return { endpoint: `${url.origin}/functions/v1/analytics`, key };
  } catch { return null; }
}
