import { createAdminClient } from "./supabase";

/**
 * Deduz creditos ATOMICAMENTE via funcao Postgres.
 * Retorna o novo saldo ou null se insuficiente.
 * A funcao SQL faz UPDATE credits = credits - amount WHERE credits >= amount
 * em uma unica operacao atomica, sem race conditions.
 */
export async function deductCredits(params: {
  userId: string;
  amount: number;
  description: string;
  postId?: string;
}): Promise<{ newBalance: number } | null> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("deduct_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
  });

  const newBalance = data as number;

  // -1 = creditos insuficientes (retornado pela funcao SQL)
  if (error || newBalance < 0) return null;

  // Registrar transacao
  await admin.from("credit_transactions").insert({
    user_id: params.userId,
    type: "usage",
    amount: -params.amount,
    balance_after: newBalance,
    description: params.description,
    post_id: params.postId || null,
  } as never);

  return { newBalance };
}

/**
 * Reembolsa creditos (em caso de falha apos deducao).
 */
export async function refundCredits(params: {
  userId: string;
  amount: number;
  description: string;
  postId?: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("deduct_credits", {
    p_user_id: params.userId,
    p_amount: -params.amount,
  });

  if (error) {
    console.error("[credits] Erro ao reembolsar creditos:", error);
    return;
  }

  const newBalance = (data as number) ?? 0;

  await admin.from("credit_transactions").insert({
    user_id: params.userId,
    type: "refund",
    amount: params.amount,
    balance_after: newBalance,
    description: params.description,
    post_id: params.postId || null,
  } as never);
}
