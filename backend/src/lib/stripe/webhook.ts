import { getStripe } from "./client";

export function constructEvent(body: string, signature: string) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
