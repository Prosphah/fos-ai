import { NextResponse } from "next/server";
import { fulfilEnrollment } from "@/lib/fulfilment";
import { getTier, type CourseTier } from "@/lib/money-mastery";
import { verifyWebhookSignature } from "@/lib/paystack";
import { triggerPurchaseEmail } from "@/lib/purchase-email";
import { parseFullName } from "@/lib/validation/checkout";

type PaystackEvent = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    email?: string;
    customer?: { email?: string };
    paid_at?: string | null;
    id?: number;
    metadata?: { tier?: string; source_variant?: string; full_name?: string };
  };
};

/**
 * Same whitelist as the checkout route. The webhook payload is signed by
 * Paystack but still arrives over the network, so the value is validated
 * rather than trusted.
 */
function parseSourceVariant(value: unknown): "a" | "b" | "c" | null {
  return value === "a" || value === "b" || value === "c" ? value : null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // Acknowledge only the event that grants access.
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const data = event.data;
  const email = (data?.email ?? data?.customer?.email ?? "").trim().toLowerCase();
  const reference = data?.reference;
  const tier = getTier(data?.metadata?.tier);

  if (!email || !reference || !tier) {
    return NextResponse.json(
      { error: "Webhook payload is missing email, reference or tier." },
      { status: 400 }
    );
  }

  // Normalised once here. The webhook is the only writer of the name column,
  // so this is the last point at which a bad value can be caught before it
  // becomes a row, and both fulfilment and the email need the same value.
  const fullName = parseFullName(data?.metadata?.full_name);
  const variant = parseSourceVariant(data?.metadata?.source_variant);

  const result = await fulfilEnrollment({
    email,
    fullName,
    tier: tier.id as CourseTier,
    amount: data?.amount ?? tier.amount,
    reference,
    transactionId: data?.id ?? null,
    sourceVariant: variant,
  });

  // After fulfilment, and deliberately unable to throw. If this raised, the
  // webhook would answer non-2xx and Paystack would replay it, and the replay
  // is what produces duplicate enrolment rows and duplicate invitations.
  const emailResult = await triggerPurchaseEmail({
    reference,
    email,
    fullName,
    tier: tier.id,
    amount: data?.amount ?? tier.amount,
    variant,
    paidAt: data?.paid_at ?? null,
    isRetry: false,
  });

  if (!emailResult.triggered) {
    // purchase_email_sent_at stays null, so the sweep picks this up.
    console.error(
      `[paystack] Purchase email not confirmed for ${reference}: ${emailResult.reason}`,
    );
  }

  return NextResponse.json({
    received: true,
    fosaiInvited: result.fosaiInvited,
    purchaseEmailTriggered: emailResult.triggered,
  });
}