
-- 1) Orders: require user_id (guest checkout not supported)
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;

-- 2) Storage buckets: make sensitive ones private
UPDATE storage.buckets SET public = false WHERE id IN ('prescription-images', 'payment-proofs');

-- 3) Replace storage policies with path-scoped + owner/admin policies
DROP POLICY IF EXISTS "Authenticated users can upload prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Public can read prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete prescriptions" ON storage.objects;
DROP POLICY IF EXISTS "Users upload payment proofs" ON storage.objects;

-- Prescription images: user-scoped upload/read/delete, admin read/delete
CREATE POLICY "Users upload own prescriptions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'prescription-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own prescriptions"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'prescription-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all prescriptions"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'prescription-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Users delete own prescriptions"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'prescription-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins delete all prescriptions"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'prescription-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Payment proofs: user-scoped upload/read/delete, admin read/delete
CREATE POLICY "Users upload own payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins read all payment proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Users delete own payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins delete all payment proofs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 4) pending_cart_items: allow users to delete their own
CREATE POLICY "Users delete own pending cart items"
ON public.pending_cart_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins delete pending cart items"
ON public.pending_cart_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) Lock down SECURITY DEFINER function execute privileges
-- Trigger-only / internal functions: revoke all execute
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_create_loyalty_rule() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalize_phone(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_login_email_by_phone(text) FROM PUBLIC;

-- Keep needed grants
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_login_email_by_phone(text) TO anon, authenticated;
