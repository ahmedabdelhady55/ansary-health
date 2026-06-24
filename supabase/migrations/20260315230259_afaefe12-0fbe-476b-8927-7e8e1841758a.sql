-- Support phone-based login by storing login email on profiles and exposing a safe lookup helper
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

UPDATE public.profiles AS p
SET email = COALESCE(u.email, p.email, '')
FROM auth.users AS u
WHERE u.id = p.id
  AND COALESCE(p.email, '') = '';

CREATE OR REPLACE FUNCTION public.normalize_phone(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(COALESCE(input, ''), '[^0-9+]', '', 'g');
$$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
ON public.profiles (public.normalize_phone(phone))
WHERE COALESCE(phone, '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
ON public.profiles (lower(email))
WHERE COALESCE(email, '') <> '';

CREATE OR REPLACE FUNCTION public.get_login_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles AS p
  WHERE public.normalize_phone(p.phone) = public.normalize_phone(_phone)
    AND COALESCE(p.email, '') <> ''
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_login_email_by_phone(text) TO anon, authenticated;