import { getStripe } from "./client";
import { getPlan } from "./products";

export async function createSubscriptionCheckout(params: {
  userId: string;
  planId: string;
  customerEmail: string;
  stripeCustomerId?: string;
}) {
  const stripe = getStripe();
  const plan = getPlan(params.planId);

  if (!plan) {
    throw new Error("Plano invalido");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.stripeCustomerId || undefined,
    customer_email: params.stripeCustomerId
      ? undefined
      : params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `SocialIA ${plan.name}`,
            description: `${plan.credits} posts/mes com IA`,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId: params.userId,
        planId: params.planId,
        credits: plan.credits.toString(),
      },
    },
    metadata: {
      userId: params.userId,
      planId: params.planId,
    },
    success_url: `${process.env.FRONTEND_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/settings/billing?canceled=true`,
  });

  return session;
}
