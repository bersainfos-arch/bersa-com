CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  organisation text NOT NULL,
  contact_email text NOT NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'emploi'::text,
  domain text NOT NULL DEFAULT 'general'::text,
  description text NOT NULL DEFAULT ''::text,
  location text,
  qualifications text,
  documents text,
  conditions text,
  external_link text,
  deadline date,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities public read active" ON public.opportunities FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "opportunities owner read" ON public.opportunities FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "opportunities insert own" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "opportunities owner edit pending" ON public.opportunities FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "opportunities admin all" ON public.opportunities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  full_name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL DEFAULT ''::text,
  attachment_link text,
  status text NOT NULL DEFAULT 'recue'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications owner read" ON public.applications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "applications publisher read" ON public.applications FOR SELECT TO authenticated USING (opportunity_id IN (SELECT id FROM public.opportunities WHERE user_id = auth.uid()));
CREATE POLICY "applications insert own" ON public.applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'recue');
CREATE POLICY "applications admin all" ON public.applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));