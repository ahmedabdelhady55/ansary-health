-- Bootstrap the first authenticated user as admin so the project can be managed securely
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = current_user_id
        AND role = 'admin'
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;