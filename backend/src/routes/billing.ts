import { Router, Request, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";
import {
  getPlan,
  getKiwifyCheckoutUrl,
  resolvePlanFromPayload,
} from "../lib/kiwify/products";
import {
  verifyKiwifySignature,
  KiwifyWebhookPayload,
} from "../lib/kiwify/webhook";

const router = Router();

// POST /checkout - Retorna URL de checkout Kiwify com userId em tracking param
router.post("/checkout", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const { planId } = req.body as { planId: string };

    if (!planId) {
      res.status(400).json({ error: "O campo planId e obrigatorio." });
      return;
    }

    const plan = getPlan(planId);
    if (!plan) {
      res.status(400).json({ error: "Plano invalido." });
      return;
    }

    const checkoutUrl = getKiwifyCheckoutUrl(planId);
    if (!checkoutUrl) {
      console.error(`[billing/checkout] URL Kiwify nao configurada para planId=${planId}`);
      res.status(500).json({ error: "Checkout indisponivel para este plano." });
      return;
    }

    // Verifica se ja tem assinatura ativa
    const admin = createAdminClient();
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["active", "past_due"])
      .maybeSingle();

    if (existingSub) {
      res.status(400).json({ error: "Voce ja possui uma assinatura ativa." });
      return;
    }

    // Anexa userId como tracking parameter (s1) que a Kiwify ecoa no webhook
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    const url = `${checkoutUrl}${separator}s1=${encodeURIComponent(userId)}`;

    res.json({ url });
  } catch (error) {
    console.error("[billing/checkout] Erro:", error);
    res.status(500).json({ error: "Erro ao gerar link de pagamento." });
  }
});

// GET /subscription - Buscar assinatura atual
router.get("/subscription", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    res.json({ subscription: subscription ?? null });
  } catch (error) {
    console.error("[billing/subscription] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar assinatura." });
  }
});

// POST /webhook - Webhook da Kiwify (sem auth; valida signature na query string)
router.post("/webhook", async (req: Request, res: Response) => {
  if (!verifyKiwifySignature(req.query.signature)) {
    console.warn("[billing/webhook] signature invalida");
    res.status(401).json({ error: "Assinatura invalida." });
    return;
  }

  const payload = req.body as KiwifyWebhookPayload;
  const event = payload.webhook_event_type;

  // Log completo do payload ate estabilizarmos o mapeamento de plano
  console.log("[kiwify/webhook] payload:", JSON.stringify(payload, null, 2));

  if (!event) {
    res.status(400).json({ error: "Evento ausente." });
    return;
  }

  const admin = createAdminClient();

  try {
    switch (event) {
      case "order_approved":
      case "subscription_renewed": {
        const userId = await resolveUserId(admin, payload);
        if (!userId) {
          console.error(`[webhook] userId nao resolvido para evento=${event}`);
          break;
        }

        const plan = resolvePlanFromPayload(payload);
        if (!plan) {
          console.error(
            `[webhook] plano nao resolvido. plan.id=${payload.Subscription?.plan?.id} name=${payload.Subscription?.plan?.name} product=${payload.Product?.product_name}`
          );
          break;
        }

        const kiwifyProductId = payload.Product?.product_id;
        const orderId = payload.order_id || payload.Subscription?.id || "";
        const periodStart = payload.Subscription?.start_date
          ? new Date(payload.Subscription.start_date).toISOString()
          : new Date().toISOString();
        const periodEnd = payload.Subscription?.next_payment
          ? new Date(payload.Subscription.next_payment).toISOString()
          : null;

        await admin
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              kiwify_order_id: orderId,
              kiwify_product_id: kiwifyProductId || null,
              plan_id: plan.id,
              status: "active",
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            } as never,
            { onConflict: "user_id" }
          );

        await addCredits(admin, userId, plan.credits, plan.name, orderId);
        console.log(`[webhook] ${event}: +${plan.credits} creditos para ${userId}`);
        break;
      }

      case "subscription_canceled": {
        const userId = await resolveUserId(admin, payload);
        if (!userId) break;

        await admin
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("user_id", userId);

        break;
      }

      case "subscription_late": {
        const userId = await resolveUserId(admin, payload);
        if (!userId) break;

        await admin
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          } as never)
          .eq("user_id", userId);

        break;
      }

      case "order_refunded": {
        const userId = await resolveUserId(admin, payload);
        if (!userId) break;

        await admin
          .from("subscriptions")
          .update({
            status: "unpaid",
            updated_at: new Date().toISOString(),
          } as never)
          .eq("user_id", userId);

        break;
      }

      default:
        console.log(`[webhook] evento ignorado: ${event}`);
    }
  } catch (error) {
    console.error("[billing/webhook] Erro ao processar evento:", error);
    res.status(500).json({ error: "Erro interno ao processar webhook." });
    return;
  }

  res.json({ received: true });
});

// GET /credits - Buscar creditos e transacoes (auth required)
router.get("/credits", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single<{ credits: number }>();

    if (profileError || !profile) {
      res.status(404).json({ error: "Perfil nao encontrado." });
      return;
    }

    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (txError) {
      console.error("[billing/credits] Erro ao buscar transacoes:", txError);
      res.status(500).json({ error: "Erro ao buscar historico de transacoes." });
      return;
    }

    res.json({
      credits: profile.credits,
      transactions: transactions ?? [],
    });
  } catch (error) {
    console.error("[billing/credits] Erro:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;

// ==========================================
// Helpers
// ==========================================

async function resolveUserId(
  admin: ReturnType<typeof createAdminClient>,
  payload: KiwifyWebhookPayload
): Promise<string | null> {
  const trackedUserId = payload.TrackingParameters?.s1;
  if (trackedUserId && isUuid(trackedUserId)) return trackedUserId;

  const email = payload.Customer?.email;
  if (!email) return null;

  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

async function addCredits(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  creditsToAdd: number,
  planName: string,
  kiwifyOrderId: string
) {
  const { data: profile } = await admin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single<{ credits: number }>();

  if (!profile) return;

  const newBalance = profile.credits + creditsToAdd;

  await admin
    .from("profiles")
    .update({ credits: newBalance, updated_at: new Date().toISOString() } as never)
    .eq("id", userId);

  await admin.from("credit_transactions").insert({
    user_id: userId,
    type: "purchase",
    amount: creditsToAdd,
    balance_after: newBalance,
    description: `Plano ${planName} (${creditsToAdd} creditos)`,
    kiwify_order_id: kiwifyOrderId || null,
  } as never);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
