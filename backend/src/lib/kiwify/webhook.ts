import crypto from "crypto";

// Kiwify envia o token de webhook diretamente na query string (?signature=<token>)
// e espera comparacao contra o secret configurado no painel.
// Se a integracao for trocada para HMAC-sobre-body, este arquivo e o
// middleware em src/index.ts precisam ser ajustados para raw-body + HMAC.
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
