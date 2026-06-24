import { supabase } from '@/integrations/supabase/client';

const SIGN_EXPIRES = 60 * 60; // 1h

/**
 * Resolve an image URL for a private storage bucket.
 *
 * Accepts either:
 *   - a legacy public URL (returned as-is)
 *   - a storage path stored in the DB (signed URL is generated)
 */
export async function resolveSignedUrl(
  bucket: 'prescription-images' | 'payment-proofs',
  value: string | null | undefined,
): Promise<string> {
  if (!value) return '';
  // Legacy: full URL already stored
  if (/^https?:\/\//i.test(value)) {
    // Try to extract a path if it's a Supabase storage URL pointing to the same bucket
    const marker = `/storage/v1/object/`;
    const idx = value.indexOf(marker);
    if (idx !== -1) {
      const after = value.slice(idx + marker.length).replace(/^public\//, '').replace(/^sign\//, '');
      const parts = after.split('/');
      const urlBucket = parts.shift();
      const path = parts.join('/').split('?')[0];
      if (urlBucket === bucket && path) {
        const { data } = await supabase.storage.from(bucket).createSignedUrl(path, SIGN_EXPIRES);
        if (data?.signedUrl) return data.signedUrl;
      }
    }
    return value;
  }
  // It's a storage path
  const { data } = await supabase.storage.from(bucket).createSignedUrl(value, SIGN_EXPIRES);
  return data?.signedUrl || '';
}
