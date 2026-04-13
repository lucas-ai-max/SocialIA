import { Router, Request, Response } from "express";
import express from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";
import { getPlan } from "../lib/stripe/products";
import { createSubscriptionCheckout } from "../lib/stripe/checkout";
import { constructEvent } from "../lib/stripe/webhook";
import { getStripe } from "../lib/stripe/client";

const router = Router();

// POST /checkout - Criar sessao de checkout Stripe para assinatura
router.post("/checkout", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;

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

    // Verificar se ja tem assinatura ativa
    const admin = createAdminClient();
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .in("status", ["active", "past_due"])
      .single();

    if (existingSub) {
      res.status(400).json({ error: "Voce ja possui uma assinatura ativa. Use o portal para gerenciar." });
      return;
    }

    // Buscar stripe customer existente
    const { data: stripeCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single<{ stripe_customer_id: string }>();

    const session = await createSubscriptionCheckout({
      userId,
      planId,
      customerEmail: req.user!.email!,
      stripeCustomerId: stripeCustomer?.stripe_customer_id,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("[billing/checkout] Erro:", error);
    res.status(500).json({ error: "Erro ao criar sessao de pagamento." });
  }
});

// POST /portal - Abrir portal de gerenciamento Stripe
router.post("/portal", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const stripe = getStripe();

    const { data: stripeCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single<{ stripe_customer_id: string }>();

    if (!stripeCustomer) {
      res.status(404).json({ error: "Nenhuma conta de cobranca encontrada." });
      return;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error("[billing/portal] Erro:", error);
    res.status(500).json({ error: "Erro ao abrir portal de cobranca." });
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
      .single();

    res.json({ subscription: subscription ?? null });
  } catch (error) {
    console.error("[billing/subscription] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar assinatura." });
  }
});

// POST /webhook - Webhook do Stripe (NO auth, raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const body = req.body;
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      res.status(400).json({ error: "Assinatura do Stripe ausente." });
      return;
    }

    let event: any;

    try {
      event = constructEvent(body, signature);
    } catch (error) {
      console.error("[billing/webhook] Erro ao verificar assinatura:", error);
      res.status(400).json({ error: "Assinatura do webhook invalida." });
      return;
    }

    const admin = createAdminClient();

    try {
      switch (event.type) {
        // Checkout concluido — salvar customer e criar subscription record
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;

          if (!userId) break;

          // Upsert stripe customer
          if (session.customer) {
            const stripeCustomerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer.id;

            await admin
              .from("stripe_customers")
              .upsert(
                { user_id: userId, stripe_customer_id: stripeCustomerId } as never,
                { onConflict: "user_id" }
              );
          }
          break;
        }

        // Assinatura criada ou atualizada
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as any;
          const metadata = subscription.metadata ?? {};
          let userId = metadata.userId;

          // Buscar userId pelo stripe_customer_id se nao tiver no metadata
          if (!userId && subscription.customer) {
            const customerId =
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id;

            const { data: sc } = await admin
              .from("stripe_customers")
              .select("user_id")
              .eq("stripe_customer_id", customerId)
              .single<{ user_id: string }>();

            userId = sc?.user_id;
          }

          if (!userId) {
            console.error("[webhook] userId nao encontrado para subscription:", subscription.id);
            break;
          }

          const planId = metadata.planId || "starter";
          const status = subscription.status as string;

          // Mapear status do Stripe para nosso enum
          const statusMap: Record<string, string> = {
            active: "active",
            canceled: "canceled",
            past_due: "past_due",
            unpaid: "unpaid",
            incomplete: "incomplete",
            incomplete_expired: "canceled",
            trialing: "active",
            paused: "canceled",
          };

          await admin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_price_id: subscription.items?.data?.[0]?.price?.id || null,
                plan_id: planId,
                status: statusMap[status] || "incomplete",
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end || false,
                updated_at: new Date().toISOString(),
              } as never,
              { onConflict: "user_id" }
            );

          break;
        }

        // Assinatura deletada/cancelada definitivamente
        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;

          await admin
            .from("subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: false,
              updated_at: new Date().toISOString(),
            } as never)
            .eq("stripe_subscription_id", subscription.id);

          break;
        }

        // Invoice paga — renovacao mensal: adicionar creditos
        case "invoice.paid": {
          const invoice = event.data.object as any;

          // Ignorar invoices que nao sao de subscription
          if (!invoice.subscription) break;

          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;

          if (!customerId) break;

          const { data: sc } = await admin
            .from("stripe_customers")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single<{ user_id: string }>();

          if (!sc) break;

          const userId = sc.user_id;

          // Buscar subscription para saber o plano
          const { data: sub } = await admin
            .from("subscriptions")
            .select("plan_id")
            .eq("user_id", userId)
            .single<{ plan_id: string }>();

          const plan = getPlan(sub?.plan_id || "starter");
          const creditsToAdd = plan?.credits || 15;

          // Buscar saldo atual
          const { data: profile } = await admin
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single<{ credits: number }>();

          if (!profile) break;

          const newBalance = profile.credits + creditsToAdd;

          // Atualizar creditos
          await admin
            .from("profiles")
            .update({ credits: newBalance, updated_at: new Date().toISOString() } as never)
            .eq("id", userId);

          // Registrar transacao
          await admin.from("credit_transactions").insert({
            user_id: userId,
            type: "purchase",
            amount: creditsToAdd,
            balance_after: newBalance,
            description: `Renovacao mensal - Plano ${plan?.name || "Starter"} (${creditsToAdd} creditos)`,
            stripe_payment_intent_id: invoice.payment_intent || null,
          } as never);

          console.log(`[webhook] Creditos renovados: +${creditsToAdd} para user ${userId}`);
          break;
        }

        // Pagamento falhou
        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          console.warn("[webhook] Pagamento falhou para invoice:", invoice.id);
          break;
        }
      }
    } catch (error) {
      console.error("[billing/webhook] Erro ao processar evento:", error);
      res.status(500).json({ error: "Erro interno ao processar webhook." });
      return;
    }

    res.json({ received: true });
  }
);

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
