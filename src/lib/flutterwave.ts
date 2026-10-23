import crypto from "node:crypto";

/**
 * Flutterwave v3 API adapter.
 *
 * Base URL: https://api.flutterwave.com/v3
 *
 * Endpoints used:
 *   POST /payments                              — initialize a checkout session
 *   GET  /transactions/verify_by_reference      — verify by our own tx_ref
 *
 * Amounts: Flutterwave is denominated in major units (₦15,000 is 15000),
 * while every other part of this codebase stores kobo (1_500_000). Conversion
 * happens at this boundary and nowhere else — getting it wrong charges a
 * hundred times the price, or records a sale a hundred times too large.
 *
 * Webhooks: Flutterwave sends the secret hash configured in your dashboard
 * in the `verif-hash` header. It is compared as-is; it is not a signature
 * computed over the body.
 */

const FLW_API = "https://api.flutterwave.com/v3";

export type FlutterwaveInitializeResult = {
  reference: string;
  authorizationUrl: string;
};

export type FlutterwaveVerifiedTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  email: string;
  phone: string | null;
  paidAt: string | null;
  transactionId: number | null;
  metadata: Record<string, unknown> | null;
};

function secretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) throw new Error("Missing FLUTTERWAVE_SECRET_KEY");
  return key;
}

/**
 * The webhook secret hash set in the Flutterwave dashboard
 * (Settings > Webhooks > Secret hash). Flutterwave echoes it back in the
 * `verif-hash` header on every webhook request.
 */
function secretHash(): string {
  const hash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!hash) throw new Error("Missing FLUTTERWAVE_SECRET_HASH");
  return hash;
}

/**
 * Flutterwave reference format. Kept distinct from Paystack's MMC- prefix so
 * the two providers' references never collide in the same enrollments table.
 */
export function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `MMC-FLW-${stamp}-${rand}`;
}

/**
 * Compares the `verif-hash` header against the dashboard secret hash.
 *
 * The body is not used: Flutterwave's contract is a shared secret, not a
 * body signature. The comparison is constant-time so a wrong header cannot
 * be discovered byte by byte through timing.
 */
export function verifyWebhookSignature(
  _rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  let expected: string;
  try {
    expected = secretHash();
  } catch {
    // Unconfigured is not a valid signature. A deployment without the hash
    // set must reject webhooks rather than accept anything that arrives.
    return false;
  }

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
  phone?: string | null;
}): Promise<FlutterwaveInitializeResult> {
  const response = await fetch(`${FLW_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: params.reference,
      // Kobo in, naira out. 1_500_000 becomes 15000, not 1_500_000.
      amount: params.amount / 100,
      currency: "NGN",
      // Card, bank transfer and USSD are the methods this buyer base uses.
      // Adding an option the account is not enabled for is a checkout error.
      payment_options: "card, banktransfer, ussd",
      customer: {
        email: params.email,
        name: String(params.metadata?.full_name ?? ""),
        ...(params.phone ? { phonenumber: params.phone } : {}),
      },
      redirect_url: params.callbackUrl,
      customizations: {
        title: "Money Mastery Code",
        description: "The Pixeltique — Money Mastery Code",
      },
      meta: {
        tier: params.metadata?.tier ?? "",
        tier_name: params.metadata?.tier_name ?? "",
        course: params.metadata?.course ?? "Money Mastery Code",
        // The payer's name on a gift, so the checkout page and the receipt
        // address the person whose card is charged.
        full_name: params.metadata?.full_name ?? "",
        source_variant: params.metadata?.source_variant ?? "",
        ...(params.phone ? { phone: params.phone } : {}),
        /*
         * Gift checkouts carry both sides through the payment metadata. The
         * recorded row is the authority when it can be read, but this is the
         * fallback that keeps a fulfilment with no row from enrolling the
         * payer: on a gift, the row's email is the recipient's while the
         * provider's customer is the payer, and losing the distinction would
         * send someone else's access to the buyer.
         */
        ...(params.metadata?.is_gift === "true"
          ? {
              is_gift: "true",
              gift_recipient_name: params.metadata?.gift_recipient_name ?? "",
              gift_recipient_email: params.metadata?.gift_recipient_email ?? "",
              gift_purchaser_name: params.metadata?.gift_purchaser_name ?? "",
              gift_purchaser_email: params.metadata?.gift_purchaser_email ?? "",
            }
          : {}),
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok || payload?.status !== "success") {
    const message =
      payload?.message ??
      payload?.data?.message ??
      `Flutterwave initialize failed with status ${response.status}`;
    throw new Error(message);
  }

  /*
   * `data.link`, not `data.redirect_url`. redirect_url is the field we send
   * to say where the buyer comes back to; link is the hosted checkout page
   * we send them to. Reading the wrong one returns undefined, which callers
   * see as a checkout that never started.
   */
  const link = payload.data?.link;
  if (!link) {
    throw new Error("Flutterwave did not return a payment link.");
  }

  return {
    reference: params.reference,
    authorizationUrl: link,
  };
}

export async function verifyTransaction(
  reference: string,
  timeoutMs?: number
): Promise<FlutterwaveVerifiedTransaction | null> {
  // Verify by our own tx_ref. The /transactions/:id/verify form expects
  // Flutterwave's numeric transaction id, which a pending checkout does not
  // have yet — and the cron sweep only ever holds the reference.
  const url = `${FLW_API}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: "no-store",
    signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
  });

  if (!response.ok) return null;

  const payload = await response.json();
  if (payload?.status !== "success" || !payload?.data) return null;

  const data = payload.data;
  return {
    reference: data.tx_ref,
    /*
     * Normalised to the word Paystack uses. Everything downstream — the
     * success page, the recovery sweep — asks for "success", and Flutterwave
     * says "successful". Mapping here keeps those callers provider-agnostic.
     */
    status: data.status === "successful" ? "success" : data.status,
    // Naira in, kobo out. Every stored amount in this codebase is kobo.
    amount: Math.round(Number(data.amount ?? 0) * 100),
    currency: data.currency ?? "NGN",
    email: data.customer?.email ?? "",
    // Flutterwave keeps a number on the customer record when it has one. It is
    // a fallback only; the checkout form's value is preferred.
    phone: data.customer?.phone_number ?? null,
    paidAt: data.created_at ?? null,
    transactionId: data.id ?? null,
    metadata: data.meta ?? null,
  };
}
