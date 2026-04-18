import type { KiwifyWebhookPayload } from "./webhook";

export const SUBSCRIPTION_PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 15,
    priceInCents: 2990,
    priceDisplay: "R$ 29,90",
    perPost: "R$ 1,99",
    description: "Ideal para quem esta comecando",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    priceInCents: 5990,
    priceDisplay: "R$ 59,90",
    perPost: "R$ 1,20",
    description: "Para criadores de conteudo ativos",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    credits: 150,
    priceInCents: 9990,
    priceDisplay: "R$ 99,90",
    perPost: "R$ 0,67",
    description: "Para agencias e power users",
  },
] as const;

export type Plan = (typeof SUBSCRIPTION_PLANS)[number];
export type PlanId = Plan["id"];

export function getPlan(id: string): Plan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}

export function getKiwifyCheckoutUrl(planId: string): string | undefined {
  const envKey = `KIWIFY_CHECKOUT_URL_${planId.toUpperCase()}`;
  return process.env[envKey];
}

export function getKiwifyPlanId(planId: string): string | undefined {
  const envKey = `KIWIFY_PLAN_ID_${planId.toUpperCase()}`;
  return process.env[envKey];
}

// Resolve nosso plan_id interno a partir de um payload Kiwify.
// Tenta, em ordem: (1) Plan ID via env var; (2) nome do plano; (3) preco em cents.
export function resolvePlanFromPayload(payload: KiwifyWebhookPayload): Plan | undefined {
  const kiwifyPlanId =
    payload.Subscription?.plan?.id ??
    (payload.Subscription as { plan_id?: string } | undefined)?.plan_id;

  if (kiwifyPlanId) {
    for (const plan of SUBSCRIPTION_PLANS) {
      if (getKiwifyPlanId(plan.id) === kiwifyPlanId) return plan;
    }
  }

  const planName =
    payload.Subscription?.plan?.name ??
    (payload.Subscription as { plan_name?: string } | undefined)?.plan_name ??
    payload.Product?.product_name;

  if (planName) {
    const normalized = planName.trim().toLowerCase();
    const byName = SUBSCRIPTION_PLANS.find((p) => p.name.toLowerCase() === normalized);
    if (byName) return byName;
  }

  const charge =
    payload.Commissions?.charge_amount ??
    payload.Commissions?.product_base_price ??
    payload.CommissionAs?.charge_amount;

  if (typeof charge === "number" && charge > 0) {
    const cents = charge < 1000 ? Math.round(charge * 100) : charge;
    const byPrice = SUBSCRIPTION_PLANS.find((p) => p.priceInCents === cents);
    if (byPrice) return byPrice;
  }

  return undefined;
}
