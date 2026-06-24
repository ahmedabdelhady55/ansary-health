
-- Convert pure/safe functions away from SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.normalize_phone(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT regexp_replace(COALESCE(input, ''), '[^0-9+]', '', 'g');
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;
-- has_role must stay DEFINER (it's used in RLS policies on other tables to bypass user_roles RLS reliably),
-- but we keep grants restricted to authenticated only (set above).
