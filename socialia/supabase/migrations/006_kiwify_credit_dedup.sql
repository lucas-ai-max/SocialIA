-- ==========================================
-- Evita creditar duas vezes a mesma order Kiwify
-- em caso de retry/reentrega do webhook.
-- Apenas transacoes de compra (kiwify_order_id nao nulo) sao unicas.
-- ==========================================
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_kiwify_order_id_key
  ON public.credit_transactions (kiwify_order_id)
  WHERE kiwify_order_id IS NOT NULL;
