import crypto from "node:crypto";

const PAYSTACK_API = "https://api.paystack.co";

export type PaystackInitializeResult = {
  reference: string;
  authorizationUrl: string;
};

export type PaystackVerifiedTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  email: string;
  paidAt: string | null;
  transactionId: number | null;
  metadata: Record<string, unknown> | null;
};

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return key;
}

export function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MMC-${stamp}-${rand}`;
}

/**
 * Paystack signs webhooks with an HMAC-SHA512 of the raw request body,
 * keyed by the secret key. Must run on the untouched body string.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number | boolean>;
}): Promise<PaystackInitializeResult> {
  const response = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ["card", "bank", "ussd", "bank_transfer"],
      metadata: params.metadata,
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload?.status !== true) {
    const message =
      payload?.message ?? `Paystack initialize failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    reference: payload.data.reference,
    authorizationUrl: payload.data.authorization_url,
  };
}

export async function verifyTransaction(
  reference: string,
  timeoutMs?: number
): Promise<PaystackVerifiedTransaction | null> {
  const response = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
    // Optional so the existing caller is unaffected. The cron sweeps pass one:
    // a verify that hangs is a verify that eats the sweep's time budget.
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
  });

  if (!response.ok) return null;

  const payload = await response.json();
  if (payload?.status !== true || !payload?.data) return null;

  const data = payload.data;
  return {
    reference: data.reference,
    status: data.status,
    amount: data.amount,
    currency: data.currency ?? "NGN",
    email: data.customer?.email ?? data.email ?? "",
    paidAt: data.paid_at ?? null,
    transactionId: data.id ?? null,
    metadata: data.metadata ?? null,
  };
}