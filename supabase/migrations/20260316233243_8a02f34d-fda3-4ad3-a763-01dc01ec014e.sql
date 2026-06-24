
-- Add discount_type to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percentage';

-- Create function to auto-create loyalty rule when category is created
CREATE OR REPLACE FUNCTION public.auto_create_loyalty_rule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.loyalty_rules (category, category_en, spend_amount, points_earned)
  VALUES (NEW.name, NEW.name_en, 100, 10)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on categories table
DROP TRIGGER IF EXISTS on_category_created ON public.categories;
CREATE TRIGGER on_category_created
  AFTER INSERT ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_loyalty_rule();

-- Add a "Medicine/علاج" loyalty rule if not exists
INSERT INTO public.loyalty_rules (category, category_en, spend_amount, points_earned)
SELECT 'علاج', 'Medicine', 100, 10
WHERE NOT EXISTS (SELECT 1 FROM public.loyalty_rules WHERE category_en = 'Medicine');

-- Also sync existing categories that don't have loyalty rules yet
INSERT INTO public.loyalty_rules (category, category_en, spend_amount, points_earned)
SELECT c.name, c.name_en, 100, 10
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1 FROM public.loyalty_rules lr WHERE lr.category_en = c.name_en
);

-- Add admin insert policy for order_items so admin can add items when converting chat
CREATE POLICY "Admins can insert order items"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
