import { supabase } from '@/integrations/supabase/client';

export const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').trim();

const looksLikeEmail = (value: string) => value.includes('@');

export const resolveLoginEmail = async (identifier: string) => {
  const cleaned = identifier.trim();

  if (!cleaned) return null;
  if (looksLikeEmail(cleaned)) return cleaned.toLowerCase();

  const { data, error } = await supabase.rpc(
    'get_login_email_by_phone' as never,
    { _phone: normalizePhone(cleaned) } as never,
  );

  if (error) {
    throw error;
  }

  return (data as string | null) ?? null;
};
