
-- Table for medicine items added by pharmacist that appear in customer's cart
CREATE TABLE public.pending_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'علاج (من الشات)',
  name_en text NOT NULL DEFAULT 'Medicine (from chat)',
  price numeric NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '💊',
  category text NOT NULL DEFAULT 'Medicine',
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_cart_items ENABLE ROW LEVEL SECURITY;

-- Customers can read their own pending items
CREATE POLICY "Users can read own pending cart items"
  ON public.pending_cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can insert pending cart items (pharmacist adds medicine)
CREATE POLICY "Admins can insert pending cart items"
  ON public.pending_cart_items FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can update own pending items (to mark as added_to_cart)
CREATE POLICY "Users can update own pending cart items"
  ON public.pending_cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can also read all
CREATE POLICY "Admins can read all pending cart items"
  ON public.pending_cart_items FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_cart_items;
