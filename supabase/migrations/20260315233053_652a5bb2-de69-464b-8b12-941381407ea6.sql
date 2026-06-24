-- Storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-images', 'prescription-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload prescriptions
CREATE POLICY "Authenticated users can upload prescriptions"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'prescription-images');

-- Allow public read access to prescription images
CREATE POLICY "Public can read prescriptions"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'prescription-images');

-- Allow admins to delete prescription images
CREATE POLICY "Admins can delete prescriptions"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'prescription-images' AND public.has_role(auth.uid(), 'admin'));

-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  user_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own conversations"
ON public.conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Conversation messages table
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL DEFAULT 'user',
  message text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own conversation messages"
ON public.conversation_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can read own conversation messages"
ON public.conversation_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;