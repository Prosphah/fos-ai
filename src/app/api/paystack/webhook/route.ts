import { NextResponse } from "next/server";
import { finalizeVerifiedPurchase } from "@/lib/finalize-purchase";
import { verifyWebhookSignature } from "@/lib/paystack";
import { getPaymentProviderName } from "@/lib/payment-registry";

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
    metadata?: { tier?: string; source_variant?: string; full_name?: string; phone?: string };
  };
};

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
  const reference = data?.reference;
  const email = (data?.email ?? data?.customer?.email ?? "").trim().toLowerCase();

  // The checkout row is the authority for the email; the payload's copy is a
  // fallback. Only the reference is required, because without it there is
  // nothing to look up or fulfil.
  if (!reference) {
    return NextResponse.json(
      { error: "Webhook payload is missing a reference." },
      { status: 400 }
    );
  }

  // When PAYMENT_PROVIDER=flutterwave this route can still be hit by a
  // straggling Paystack webhook. Tag the sale with the provider that actually
  // sent it, not whichever one is currently selected.
  if (getPaymentProviderName() !== "paystack") {
    console.warn(
      `[paystack] Webhook for ${reference} arrived while PAYMENT_PROVIDER is not paystack; processing it as paystack.`,
    );
  }

  const result = await finalizeVerifiedPurchase(
    {
      reference,
      status: data?.status ?? "success",
      amount: data?.amount ?? 0,
      currency: data?.currency ?? "NGN",
      email,
      paidAt: data?.paid_at ?? null,
      transactionId: data?.id ?? null,
      metadata: data?.metadata ?? null,
    },
    "paystack",
  );

  return NextResponse.json({
    received: true,
    fulfilled: result.fulfilled,
    reason: result.reason,
    purchaseEmailTriggered: result.purchaseEmailTriggered,
    tiktokPurchaseSent: result.tiktokPurchaseSent,
  });
}
