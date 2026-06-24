
-- Payment enhancements for orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof text NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed boolean NOT NULL DEFAULT false;

-- Delete policies
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete conversations" ON public.conversations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete conv messages" ON public.conversation_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin can update any profile (for loyalty points on payment confirmation)
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Admin upload banner images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admin delete banner images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banner-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Users upload payment proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs');

-- Enable realtime for orders and conversations
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
