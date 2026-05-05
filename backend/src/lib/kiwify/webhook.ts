import crypto from "crypto";

// Kiwify anexa ?signature=<HMAC-SHA1(body, token)> na URL do webhook.
// O token e mostrado no painel Kiwify ao criar o webhook (KIWIFY_WEBHOOK_SECRET).
// Quando ha multiplas signatures (ex.: nos ja temos uma na URL configurada),
// Express parseia como array — pegamos a ultima (a que a Kiwify acabou de anexar).
export function verifyKiwifySignature(
  querySignature: unknown,
  rawBody: Buffer | string
): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET;
  if (!secret) return false;

  const sig = Array.isArray(querySignature)
    ? String(querySignature[querySignature.length - 1])
    : typeof querySignature === "string"
      ? querySignature
      : null;

  if (!sig) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  const computed = crypto.createHmac("sha1", secret).update(body).digest("hex");

  const a = Buffer.from(sig);
  const b = Buffer.from(computed);
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
