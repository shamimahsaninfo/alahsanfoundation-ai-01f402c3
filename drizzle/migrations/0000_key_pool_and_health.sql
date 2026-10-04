ALTER TABLE public.ai_keys ADD COLUMN IF NOT EXISTS key_pool jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS public.health_checks (
  id bigserial PRIMARY KEY,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.health_checks TO authenticated;
GRANT ALL ON public.health_checks TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.health_checks_id_seq TO service_role;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read health" ON public.health_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));