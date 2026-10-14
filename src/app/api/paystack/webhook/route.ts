import { NextResponse } from "next/server";
import { fulfilEnrollment } from "@/lib/fulfilment";
import { getTier, type CourseTier } from "@/lib/money-mastery";
import { verifyWebhookSignature } from "@/lib/paystack";

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
    metadata?: { tier?: string; source_variant?: string };
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

  const result = await fulfilEnrollment({
    email,
    fullName: null,
    tier: tier.id as CourseTier,
    amount: data?.amount ?? tier.amount,
    reference,
    transactionId: data?.id ?? null,
    sourceVariant: parseSourceVariant(data?.metadata?.source_variant),
  });

  return NextResponse.json({ received: true, fosaiInvited: result.fosaiInvited });
}