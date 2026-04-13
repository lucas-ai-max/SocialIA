CREATE TABLE IF NOT EXISTS public.auto_schedule_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  posts_per_day INTEGER NOT NULL DEFAULT 1,
  schedule_times TEXT[] NOT NULL DEFAULT '{"09:00"}',
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_schedule_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem propria config" ON public.auto_schedule_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios inserem propria config" ON public.auto_schedule_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios atualizam propria config" ON public.auto_schedule_config
  FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN NOT NULL DEFAULT false;
