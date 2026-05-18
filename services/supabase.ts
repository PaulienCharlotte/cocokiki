
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Guard: if env vars missing the client still exports but every call will fail gracefully
export const supabaseConfigured = !!(url && key);

export const supabase = createClient(
  url  ?? 'https://placeholder.supabase.co',
  key  ?? 'placeholder-key',
);

// ─── Database types ────────────────────────────────────────────────────────────

export interface Profile {
  id:             string;
  display_name:   string;
  total_score:    number;
  sessions_count: number;
  created_at:     string;
}

export interface ScoreSession {
  id:         string;
  user_id:    string;
  mode:       string;
  province_id: string;
  score:      number;
  created_at: string;
}

export interface LocationProgress {
  user_id:           string;
  location_id:       string;
  location_name:     string;
  province_id:       string;
  correct_count:     number;
  attempt_count:     number;
  last_practiced_at: string;
}

// ─── Admin check ───────────────────────────────────────────────────────────────

export async function checkIsAdmin(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

// ─── Helper functions ──────────────────────────────────────────────────────────

export async function saveScoreSession(
  userId: string,
  mode: string,
  provinceId: string,
  score: number,
): Promise<void> {
  if (!supabaseConfigured || score <= 0) return;

  // Insert session
  await supabase.from('score_sessions').insert({
    user_id:    userId,
    mode,
    province_id: provinceId,
    score,
  });

  // Increment profile totals
  await supabase.rpc('increment_profile_score', {
    p_user_id:       userId,
    p_score:         score,
  });
}

export async function recordLocationCorrect(
  userId:       string,
  locationId:   string,
  locationName: string,
  provinceId:   string,
): Promise<void> {
  if (!supabaseConfigured) return;

  await supabase.from('location_progress').upsert(
    {
      user_id:           userId,
      location_id:       locationId,
      location_name:     locationName,
      province_id:       provinceId,
      last_practiced_at: new Date().toISOString(),
    },
    {
      onConflict:            'user_id,location_id',
      ignoreDuplicates:      false,
    },
  );

  // Increment correct_count via a simple select + update
  const { data } = await supabase
    .from('location_progress')
    .select('correct_count, attempt_count')
    .eq('user_id', userId)
    .eq('location_id', locationId)
    .single();

  if (data) {
    await supabase
      .from('location_progress')
      .update({
        correct_count: data.correct_count + 1,
        attempt_count: data.attempt_count + 1,
      })
      .eq('user_id', userId)
      .eq('location_id', locationId);
  }
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export async function fetchRecentSessions(userId: string, limit = 10): Promise<ScoreSession[]> {
  const { data } = await supabase
    .from('score_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchLocationProgress(userId: string): Promise<LocationProgress[]> {
  const { data } = await supabase
    .from('location_progress')
    .select('*')
    .eq('user_id', userId)
    .order('correct_count', { ascending: false });
  return data ?? [];
}

// ─── Location Photos (admin) ───────────────────────────────────────────────────

export interface LocationPhoto {
  id:            string;
  location_id:   string;
  location_name: string;
  province_id:   string;
  storage_path:  string;
  url:           string;
  caption:       string;
  uploaded_by:   string;
  created_at:    string;
}

export async function uploadLocationPhoto(
  file:         File,
  locationId:   string,
  locationName: string,
  provinceId:   string,
  caption:      string,
): Promise<string | null> {
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const path     = `${provinceId}/${locationId}/${Date.now()}.${ext}`;

  const { error: storageErr } = await supabase.storage
    .from('location-photos')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageErr) return storageErr.message;

  const { data: { publicUrl } } = supabase.storage
    .from('location-photos')
    .getPublicUrl(path);

  const { error: dbErr } = await supabase.from('location_photos').insert({
    location_id:   locationId,
    location_name: locationName,
    province_id:   provinceId,
    storage_path:  path,
    url:           publicUrl,
    caption,
  });

  return dbErr?.message ?? null;
}

export async function fetchAllPhotos(): Promise<LocationPhoto[]> {
  const { data } = await supabase
    .from('location_photos')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function deleteLocationPhoto(id: string, storagePath: string): Promise<string | null> {
  await supabase.storage.from('location-photos').remove([storagePath]);
  const { error } = await supabase.from('location_photos').delete().eq('id', id);
  return error?.message ?? null;
}

// ─── Site Assets (admin) ───────────────────────────────────────────────────────

export type AssetCategory = 'logo' | 'icoon' | 'illustratie' | 'overig';

export interface SiteAsset {
  id:           string;
  name:         string;
  category:     AssetCategory;
  storage_path: string;
  url:          string;
  uploaded_by:  string;
  created_at:   string;
}

export async function uploadSiteAsset(
  file:     File,
  name:     string,
  category: AssetCategory,
): Promise<string | null> {
  const ext  = file.name.split('.').pop() ?? 'svg';
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const path = `${category}/${slug}-${Date.now()}.${ext}`;

  const { error: storageErr } = await supabase.storage
    .from('site-assets')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageErr) return storageErr.message;

  const { data: { publicUrl } } = supabase.storage
    .from('site-assets')
    .getPublicUrl(path);

  const { error: dbErr } = await supabase.from('site_assets').insert({
    name,
    category,
    storage_path: path,
    url:          publicUrl,
  });

  return dbErr?.message ?? null;
}

export async function fetchAllSiteAssets(): Promise<SiteAsset[]> {
  const { data } = await supabase
    .from('site_assets')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function deleteSiteAsset(id: string, storagePath: string): Promise<string | null> {
  await supabase.storage.from('site-assets').remove([storagePath]);
  const { error } = await supabase.from('site_assets').delete().eq('id', id);
  return error?.message ?? null;
}
