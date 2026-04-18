-- ==========================================
-- MIGRATE FROM STRIPE TO KIWIFY
-- ==========================================

-- Remove tabela Stripe-specific
DROP TABLE IF EXISTS public.stripe_customers;

-- Renomeia colunas Stripe -> Kiwify em subscriptions
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;

ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_subscription_id TO kiwify_order_id;

ALTER TABLE public.subscriptions
  RENAME COLUMN stripe_price_id TO kiwify_product_id;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_kiwify_order_id_key UNIQUE (kiwify_order_id);

-- Renomeia coluna em credit_transactions
ALTER TABLE public.credit_transactions
  RENAME COLUMN stripe_payment_intent_id TO kiwify_order_id;
