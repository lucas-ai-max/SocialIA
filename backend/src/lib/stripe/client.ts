import Stripe from "stripe";

let stripeInstance: any = null;

export function getStripe() {
  if (!stripeInstance) {
    stripeInstance = new (Stripe as any)(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-04-30.basil",
    });
  }
  return stripeInstance;
}
