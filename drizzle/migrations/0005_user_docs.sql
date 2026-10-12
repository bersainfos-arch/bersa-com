CREATE TABLE public.user_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Sans titre',
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL DEFAULT '',
  word_count int NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_docs TO authenticated;
GRANT ALL ON public.user_docs TO service_role;
ALTER TABLE public.user_docs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own docs" ON public.user_docs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());