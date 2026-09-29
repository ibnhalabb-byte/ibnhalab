import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const BUCKET = 'ibn-aleppo';
export const isSupabaseConfigured = Boolean(url && key);

// null when env vars are missing -> the app falls back to mock data.
export const supabase = isSupabaseConfigured ? createClient(url, key) : null;

/**
 * Uploads a file to Supabase Storage and returns its public URL.
 * Without Supabase it returns a temporary local blob URL (lost on refresh).
 */
export async function uploadFile(file, folder = 'misc') {
  if (!supabase) return URL.createObjectURL(file);
  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
