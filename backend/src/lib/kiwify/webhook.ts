import crypto from "crypto";

export function verifyKiwifySignature(querySignature: unknown): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret || typeof querySignature !== "string") return false;

  const a = Buffer.from(querySignature);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export type KiwifyWebhookEvent =
  | "order_approved"
  | "order_refunded"
  | "subscription_canceled"
  | "subscription_renewed"
  | "subscription_late";

export interface KiwifyWebhookPayload {
  webhook_event_type?: KiwifyWebhookEvent;
  order_id?: string;
  order_status?: string;
  Product?: {
    product_id?: string;
    product_name?: string;
  };
  Customer?: {
    email?: string;
    full_name?: string;
  };
  Subscription?: {
    id?: string;
    start_date?: string;
    next_payment?: string;
    status?: string;
    plan?: {
      id?: string;
      name?: string;
      frequency?: string;
    };
  };
  Commissions?: {
    charge_amount?: number;
    product_base_price?: number;
  };
  CommissionAs?: {
    charge_amount?: number;
  };
  TrackingParameters?: {
    s1?: string;
    s2?: string;
    s3?: string;
  };
  [key: string]: unknown;
}
