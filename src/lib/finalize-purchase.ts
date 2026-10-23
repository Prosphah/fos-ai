import { createAdminClient } from "@/lib/supabase/admin";
import { fulfilEnrollment, type FosaiOutcome } from "@/lib/fulfilment";
import {
  asStorefrontVariant,
  getTier,
  giftAmount,
  type CourseTier,
  type StorefrontVariant,
  type TierConfig,
} from "@/lib/money-mastery";
import { triggerPurchaseEmail } from "@/lib/purchase-email";
import { sendTikTokPurchase } from "@/lib/tiktok-events-api";
import { parseFullName, parsePhoneForE164 } from "@/lib/validation/checkout";
import type {
  PaymentProvider,
  PaymentVerifiedTransaction,
} from "@/lib/payment-provider";

/**
 * One path from "a payment is verified" to "the buyer has access and the sale
 * is reported".
 *
 * Both webhooks and the success page call this. Every step is idempotent:
 *
 *   - fulfilment upserts on the reference, so a webhook retry and a success
 *     page render cannot create two enrolments;
 *   - the purchase email claims purchase_email_sent_at with a conditional
 *     update, so only one sender wins;
 *   - TikTok deduplicates on event_id, which is the same reference on both
 *     copies of the Purchase.
 *
 * The success page calling this is the resilience fix: a webhook that never
 * arrives (unreachable localhost, missing dashboard config, provider outage)
 * used to leave a paid buyer pending forever. Now returning to the site
 * completes the same work.
 */

export type FinalizeResult = {
  fulfilled: boolean;
  reason?: string;
  /** The address the buyer typed at checkout, not the provider's echo. */
  email: string;
  fullName: string | null;
  tier: TierConfig | undefined;
  variant: StorefrontVariant | null;
  /** E.164 digits, for the browser-side Advanced Matching copy. */
  phone: string | null;
  /**
   * A gift purchase. The recipient is already the effective `email`/`fullName`
   * above; this block names both sides explicitly so the success page and the
   * purchase email can talk about the gift without re-deriving it.
   */
  gift: {
    isGift: boolean;
    recipientName: string | null;
    recipientEmail: string | null;
    purchaserName: string | null;
    purchaserEmail: string | null;
  };
  /** What happened to the bundle buyer's FOS*AI account. */
  fosai: {
    outcome: FosaiOutcome | "unknown";
    note: string;
  };
  purchaseEmailTriggered: boolean;
  tiktokPurchaseSent: boolean;
};

type CheckoutRecord = {
  email: string | null;
  full_name: string | null;
  tier: string | null;
  amount: number | null;
  source_variant: string | null;
  client_ip: string | null;
  client_user_agent: string | null;
  ttclid: string | null;
  visitor_id: string | null;
  customer_phone: string | null;
  ttp: string | null;
  is_gift: boolean | null;
  gift_recipient_name: string | null;
  gift_recipient_email: string | null;
  gift_purchaser_name: string | null;
  gift_purchaser_email: string | null;
};

/**
 * Reads what the buyer entered and the identifiers captured at checkout.
 *
 * The checkout row, not the payment payload, is the authority for email,
 * name, tier and variant:
 *
 *   - Flutterwave test mode rewrites the customer email with a sandbox prefix
 *     (ravesb_…_betia@example.com). Fulfilling from that address would send
 *     the confirmation into a mailbox that does not exist.
 *   - In live mode the provider's checkout page can still let a buyer edit the
 *     address, while the enrolment, the FOS*AI account and the purchase email
 *     are all built around the address they gave us.
 *
 * The payment payload remains the fallback for a checkout row that was never
 * written — recordCheckoutIntent is best-effort by design.
 */
async function readCheckoutRecord(
  reference: string
): Promise<CheckoutRecord | null> {
  const { data, error } = await createAdminClient()
    .from("enrollments")
    .select(
      "email,full_name,tier,amount,source_variant,client_ip,client_user_agent,ttclid,visitor_id,customer_phone,ttp,is_gift,gift_recipient_name,gift_recipient_email,gift_purchaser_name,gift_purchaser_email"
    )
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (error) {
    // Identifiers improve TikTok matching; losing them costs accuracy, not
    // the sale. Continue with whatever the payment payload carried.
    console.error(
      `[finalize] Could not read checkout row for ${reference}: ${error.message}`,
    );
    return null;
  }

  return (data as CheckoutRecord | null) ?? null;
}

/**
 * Which provider owns a reference.
 *
 * The success page holds only the reference, and after a provider switch the
 * currently configured provider may not be the one that charged the buyer.
 * The recorded column is authoritative; the reference prefix is a fallback
 * for rows created before the column existed or before it was backfilled.
 */
export async function providerNameForReference(
  reference: string
): Promise<PaymentProvider> {
  const { data, error } = await createAdminClient()
    .from("enrollments")
    .select("payment_provider")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!error && data?.payment_provider === "flutterwave") {
    return "flutterwave";
  }
  if (!error && data?.payment_provider === "paystack") {
    return "paystack";
  }

  // Flutterwave references are minted with this prefix; Paystack references
  // never are. A row that cannot be read still gets the right API.
  return reference.startsWith("MMC-FLW-") ? "flutterwave" : "paystack";
}

export type CheckoutResume = {
  /** The storefront the buyer was shown, when the row names a variant. */
  variant: StorefrontVariant | null;
  /**
   * True for a gift attempt. The gift form has its own page, so the variant
   * is only attribution there — not where the buyer goes back to.
   */
  isGift: boolean;
};

/**
 * Where a buyer who cancelled a payment left from.
 *
 * It reads the recorded row rather than the request, so the answer holds even
 * when the browser never kept the variant cookie — a direct /v1 link or a
 * local preview. Returns null when the row is missing, which lets the caller
 * fall back to the cookie.
 */
export async function checkoutResumeForReference(
  reference: string
): Promise<CheckoutResume | null> {
  const { data, error } = await createAdminClient()
    .from("enrollments")
    .select("source_variant,is_gift")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    source_variant: string | null;
    is_gift: boolean | null;
  };

  return {
    variant: asStorefrontVariant(row.source_variant),
    isGift: row.is_gift === true,
  };
}

type FinalizeOptions = {
  /**
   * Set by the recovery sweep's rescue path: it is re-posting a confirmation
   * the webhook should have sent, and the email scenario is told so it can
   * word the message accordingly. Every other caller is the first
   * announcement of the sale.
   */
  isRetry?: boolean;
};

export async function finalizeVerifiedPurchase(
  transaction: PaymentVerifiedTransaction,
  provider: PaymentProvider,
  options: FinalizeOptions = {},
): Promise<FinalizeResult> {
  const record = await readCheckoutRecord(transaction.reference);

  /*
   * Gift purchases put the recipient in the row's email/full_name, because
   * that is whose access this is. The same facts also travel in the payment
   * metadata, so a row that was never written — recordCheckoutIntent is
   * best-effort by design — still delivers to the recipient rather than to
   * the payer, whose address is the one the provider's record carries.
   */
  const metadataIsGift =
    transaction.metadata?.is_gift === true ||
    transaction.metadata?.is_gift === "true";
  const isGift = record?.is_gift ?? metadataIsGift;

  const metadataString = (value: unknown) =>
    typeof value === "string" && value.trim() ? value : null;

  const giftRecipientName = isGift
    ? parseFullName(
        record?.gift_recipient_name ??
          metadataString(transaction.metadata?.gift_recipient_name),
      )
    : null;

  const giftRecipientEmail = isGift
    ? (
        record?.gift_recipient_email ??
        metadataString(transaction.metadata?.gift_recipient_email)
      )
        ?.trim()
        .toLowerCase() ?? null
    : null;

  const giftPurchaserName = isGift
    ? parseFullName(
        record?.gift_purchaser_name ??
          metadataString(transaction.metadata?.gift_purchaser_name),
      )
    : null;

  const giftPurchaserEmail = isGift
    ? (
        record?.gift_purchaser_email ??
        metadataString(transaction.metadata?.gift_purchaser_email)
      )
        ?.trim()
        .toLowerCase() ?? null
    : null;

  /*
   * On a gift, the recipient is who every downstream step is for: the
   * enrolment, the FOS*AI invitation and the access email. The payer stays on
   * the payment record and in the gift block of the result.
   */
  const email = (
    isGift
      ? giftRecipientEmail ?? record?.email ?? transaction.email
      : record?.email ?? transaction.email
  )
    .trim()
    .toLowerCase();

  const tier = getTier(record?.tier ?? String(transaction.metadata?.tier ?? ""));

  const fullName = isGift
    ? giftRecipientName ??
      parseFullName(record?.full_name) ??
      parseFullName(transaction.metadata?.full_name)
    : parseFullName(record?.full_name) ??
      parseFullName(transaction.metadata?.full_name);

  const variant = asStorefrontVariant(
    record?.source_variant ?? transaction.metadata?.source_variant,
  );

  /*
   * Prefer the number the buyer typed. Fall back to the payment metadata, then
   * to the provider's customer record — Flutterwave carries a phone number on
   * the account when the buyer has one. parsePhoneForE164 turns any of them
   * into one E.164 shape and drops a value that is not usable.
   */
  const phone = parsePhoneForE164(
    record?.customer_phone ??
      (typeof transaction.metadata?.phone === "string"
        ? transaction.metadata.phone
        : null) ??
      transaction.phone ??
      null,
  );

  const base: FinalizeResult = {
    fulfilled: false,
    email,
    fullName,
    tier,
    variant,
    phone,
    gift: {
      isGift,
      recipientName: isGift ? fullName : null,
      recipientEmail: isGift ? email : null,
      purchaserName: giftPurchaserName,
      purchaserEmail: giftPurchaserEmail,
    },
    fosai: {
      outcome: "unknown",
      note: "FOS*AI provisioning was not attempted.",
    },
    purchaseEmailTriggered: false,
    tiktokPurchaseSent: false,
  };

  if (!email || !tier) {
    return { ...base, reason: "missing-email-or-tier" };
  }

  /*
   * The amount check is a guard against a misconfigured checkout, not against
   * the provider. Compare against the amount this reference was opened for,
   * which is the promise made to the provider and recorded on the checkout
   * row. A payment that covered less than that is not a sale worth granting
   * full access for; one that covered more is honoured at what was paid.
   *
   * A gift row records the discounted amount, so its fallback is the gift
   * price rather than the list price when the row cannot be read.
   */
  const expectedAmount =
    record?.amount ?? (isGift ? giftAmount(tier.amount) : tier.amount);

  if (transaction.currency !== "NGN") {
    return { ...base, reason: `unexpected-currency-${transaction.currency}` };
  }

  if (transaction.amount < expectedAmount) {
    return {
      ...base,
      reason: `underpaid-${transaction.amount}-below-${expectedAmount}`,
    };
  }

  const fulfilment = await fulfilEnrollment({
    email,
    fullName,
    tier: tier.id as CourseTier,
    amount: transaction.amount,
    reference: transaction.reference,
    transactionId: transaction.transactionId,
    sourceVariant: variant,
    paymentProvider: provider,
    phone,
  });

  if (fulfilment.fosaiOutcome === "failed") {
    console.error(
      `[finalize] FOS*AI access not provisioned for ${transaction.reference}: ${fulfilment.fosaiNote}`,
    );
  }

  /*
   * A refunded purchase is not a sale to announce. The purchase email and the
   * TikTok Purchase are deliberately skipped — both would describe money
   * coming in for access that was taken back — and the caller is told the
   * real outcome, so the webhook and the success page can say "refunded"
   * rather than "fulfilled". The row keeps its refunded status.
   */
  if (fulfilment.fosaiOutcome === "refunded") {
    return {
      ...base,
      reason: "refunded",
      fosai: {
        outcome: fulfilment.fosaiOutcome,
        note: fulfilment.fosaiNote,
      },
    };
  }

  const emailResult = await triggerPurchaseEmail({
    reference: transaction.reference,
    email,
    fullName,
    tier: tier.id,
    amount: transaction.amount,
    variant,
    paidAt: transaction.paidAt,
    isRetry: options.isRetry ?? false,
    isGift,
    giftPurchaserName,
    giftPurchaserEmail,
  });

  // already-claimed means an earlier caller (usually the webhook) sent it.
  // That is the idempotency working, not a failure.
  if (!emailResult.triggered && emailResult.reason !== "already-claimed") {
    console.error(
      `[finalize] Purchase email not confirmed for ${transaction.reference}: ${emailResult.reason}`,
    );
  }

  const tiktokResult = await sendTikTokPurchase({
    eventId: transaction.reference,
    amountInKobo: transaction.amount,
    contentId: tier.id,
    contentName: tier.name,
    sourceVariant: variant,
    /*
     * One person per identity. The click id, IP and user agent were captured
     * in the payer's browser, so on a gift they describe the payer; hashing
     * the recipient's address into the same event would describe two
     * different people and match neither. The recipient is the fallback only
     * when the payer's address is missing, where any identity beats none.
     */
    email: (isGift ? giftPurchaserEmail : null) ?? email,
    phone,
    ip: record?.client_ip ?? null,
    userAgent: record?.client_user_agent ?? null,
    ttclid: record?.ttclid ?? null,
    externalId: record?.visitor_id ?? null,
    ttp: record?.ttp ?? null,
  });

  if (!tiktokResult.sent) {
    console.error(
      `[tiktok] Purchase not reported for ${transaction.reference}: ${tiktokResult.reason}`,
    );
  }

  return {
    ...base,
    fulfilled: true,
    fosai: {
      outcome: fulfilment.fosaiOutcome,
      note: fulfilment.fosaiNote,
    },
    purchaseEmailTriggered: emailResult.triggered,
    tiktokPurchaseSent: tiktokResult.sent,
  };
}
