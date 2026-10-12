ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text, ADD COLUMN IF NOT EXISTS bio text, ADD COLUMN IF NOT EXISTS physical_address text, ADD COLUMN IF NOT EXISTS marital_status text, ADD COLUMN IF NOT EXISTS research_domain text, ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
COMMENT ON COLUMN public.profiles.phone IS 'DEPRECATED: phone no longer collected';

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL,
  plan_name text NOT NULL,
  duration_months int NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  daily_conversation_limit int NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_code, duration_months)
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans read" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plans admin write" ON public.subscription_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.subscription_plans (plan_code, plan_name, duration_months, price, daily_conversation_limit, features) VALUES
('free','Gratuit',0,0,20,ARRAY['Rédaction et assistance IA de base','20 conversations par jour']),
('standard','Standard',1,7,60,ARRAY['60 conversations par jour','Outils courants de rédaction']),
('standard','Standard',2,10,60,ARRAY['60 conversations par jour','Outils courants de rédaction']),
('standard','Standard',3,25,60,ARRAY['60 conversations par jour','Outils courants de rédaction']),
('standard','Standard',6,60,60,ARRAY['60 conversations par jour','Outils courants de rédaction']),
('standard','Standard',12,100,60,ARRAY['60 conversations par jour','Outils courants de rédaction']),
('premium','Premium',1,20,150,ARRAY['150 conversations par jour','Fonctions IA avancées']),
('premium','Premium',2,40,150,ARRAY['150 conversations par jour','Fonctions IA avancées']),
('premium','Premium',3,60,150,ARRAY['150 conversations par jour','Fonctions IA avancées']),
('premium','Premium',6,100,150,ARRAY['150 conversations par jour','Fonctions IA avancées']),
('premium','Premium',12,210,150,ARRAY['150 conversations par jour','Fonctions IA avancées']),
('pro','Pro',1,50,400,ARRAY['400 conversations par jour','Rédaction longue','Outils avancés']),
('pro','Pro',2,90,400,ARRAY['400 conversations par jour','Rédaction longue','Outils avancés']),
('pro','Pro',3,120,400,ARRAY['400 conversations par jour','Rédaction longue','Outils avancés']),
('pro','Pro',6,240,400,ARRAY['400 conversations par jour','Rédaction longue','Outils avancés']),
('pro','Pro',12,450,400,ARRAY['400 conversations par jour','Rédaction longue','Outils avancés']),
('ultra','Ultra Pro',1,100,1000,ARRAY['1000 conversations par jour','Toutes les fonctionnalités']),
('ultra','Ultra Pro',2,180,1000,ARRAY['1000 conversations par jour','Toutes les fonctionnalités']),
('ultra','Ultra Pro',3,260,1000,ARRAY['1000 conversations par jour','Toutes les fonctionnalités']),
('ultra','Ultra Pro',6,510,1000,ARRAY['1000 conversations par jour','Toutes les fonctionnalités']),
('ultra','Ultra Pro',12,1000,1000,ARRAY['1000 conversations par jour','Toutes les fonctionnalités']);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  plan_code text NOT NULL,
  duration_months int NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  expires_at timestamptz,
  payment_provider text,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.subscriptions (user_id);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own or admin" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "subs request own" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND started_at IS NULL AND expires_at IS NULL);
CREATE POLICY "subs admin update" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid,
  usage_type text NOT NULL DEFAULT 'conversation',
  quota_period date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_usage (user_id, quota_period);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage read own or admin" ON public.ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.current_daily_limit(_user uuid) RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT max(p.daily_conversation_limit) FROM subscriptions s JOIN subscription_plans p ON p.plan_code = s.plan_code AND p.duration_months = s.duration_months
    WHERE s.user_id = _user AND s.status = 'active' AND s.expires_at > now()),
    (SELECT daily_conversation_limit FROM subscription_plans WHERE plan_code='free' LIMIT 1), 20)
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_quota() RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lim int; used int; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  lim := current_daily_limit(uid);
  SELECT count(*) INTO used FROM ai_usage WHERE user_id = uid AND quota_period = (now() AT TIME ZONE 'UTC')::date;
  IF used >= lim THEN RETURN json_build_object('ok', false, 'used', used, 'limit', lim); END IF;
  INSERT INTO ai_usage (user_id) VALUES (uid);
  RETURN json_build_object('ok', true, 'used', used + 1, 'limit', lim);
END $$;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_daily_limit(uuid) TO authenticated;