-- ==========================================
-- PROFILES (extends auth.users)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para criar profile automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- INSTAGRAM ACCOUNTS
-- ==========================================
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  composio_connection_id TEXT,          -- ID da conexao no Composio (gerencia OAuth/tokens)
  ig_user_id TEXT NOT NULL,
  ig_username TEXT NOT NULL,
  ig_name TEXT,
  ig_profile_picture_url TEXT,
  ig_followers_count INTEGER,
  facebook_page_id TEXT NOT NULL,
  access_token TEXT NOT NULL,           -- 'managed_by_composio' quando usando Composio
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ig_user_id)
);

-- ==========================================
-- BRAND PROFILES (questionario)
-- ==========================================
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  brand_voice TEXT NOT NULL,
  visual_style TEXT NOT NULL,
  color_palette TEXT[],
  content_pillars TEXT[] NOT NULL,
  additional_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- POSTS
-- ==========================================
CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instagram_account_id UUID REFERENCES public.instagram_accounts(id),
  generation_mode TEXT NOT NULL CHECK (generation_mode IN ('auto', 'prompt')),
  user_prompt TEXT,
  image_format TEXT NOT NULL DEFAULT 'square' CHECK (image_format IN ('square', 'portrait')),
  generated_image_url TEXT,
  generated_image_prompt TEXT,
  caption TEXT,
  hashtags TEXT[],
  status public.post_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  ig_media_id TEXT,
  ig_container_id TEXT,
  publish_error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- REFERENCE IMAGES
-- ==========================================
CREATE TABLE public.reference_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- CREDIT TRANSACTIONS
-- ==========================================
CREATE TYPE public.transaction_type AS ENUM ('purchase', 'usage', 'bonus', 'refund');

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  post_id UUID REFERENCES public.posts(id),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- STRIPE CUSTOMERS
-- ==========================================
CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_posts_user_status ON public.posts(user_id, status);
CREATE INDEX idx_posts_scheduled ON public.posts(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_instagram_accounts_user ON public.instagram_accounts(user_id);
CREATE INDEX idx_reference_images_post ON public.reference_images(post_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Usuarios veem proprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios atualizam proprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Instagram Accounts
CREATE POLICY "Usuarios veem proprias contas IG" ON public.instagram_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios inserem proprias contas IG" ON public.instagram_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios atualizam proprias contas IG" ON public.instagram_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios deletam proprias contas IG" ON public.instagram_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Brand Profiles
CREATE POLICY "Usuarios veem proprio perfil de marca" ON public.brand_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios inserem proprio perfil de marca" ON public.brand_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios atualizam proprio perfil de marca" ON public.brand_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Usuarios veem proprios posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios criam proprios posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios atualizam proprios posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios deletam proprios posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Reference Images
CREATE POLICY "Usuarios veem proprias referencias" ON public.reference_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios inserem proprias referencias" ON public.reference_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios deletam proprias referencias" ON public.reference_images
  FOR DELETE USING (auth.uid() = user_id);

-- Credit Transactions
CREATE POLICY "Usuarios veem proprias transacoes" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Stripe Customers
CREATE POLICY "Usuarios veem proprio stripe" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true)
  ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
INSERT INTO storage.buckets (id, name, public) VALUES ('reference-images', 'reference-images', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens geradas sao publicas" ON storage.objects;
CREATE POLICY "Imagens geradas sao publicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');
DROP POLICY IF EXISTS "Usuarios fazem upload de imagens geradas" ON storage.objects;
CREATE POLICY "Usuarios fazem upload de imagens geradas" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Usuarios veem proprias referencias" ON storage.objects;
CREATE POLICY "Usuarios veem proprias referencias" ON storage.objects
  FOR SELECT USING (bucket_id = 'reference-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Usuarios fazem upload de referencias" ON storage.objects;
CREATE POLICY "Usuarios fazem upload de referencias" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reference-images' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Usuarios deletam proprias referencias" ON storage.objects;
CREATE POLICY "Usuarios deletam proprias referencias" ON storage.objects
  FOR DELETE USING (bucket_id = 'reference-images' AND (storage.foldername(name))[1] = auth.uid()::text);
