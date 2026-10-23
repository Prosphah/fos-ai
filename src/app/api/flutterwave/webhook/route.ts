import { NextResponse } from "next/server";
import { finalizeVerifiedPurchase } from "@/lib/finalize-purchase";
import { verifyTransaction, verifyWebhookSignature } from "@/lib/flutterwave";

/**
 * How long the server-to-server verify may take before the webhook gives up.
 *
 * A webhook that does not answer in time is retried by Flutterwave, and a
 * retry is the right outcome here: answering without verifying the payment
 * would either grant access on an unverified claim or silently drop a real
 * one.
 */
const VERIFY_TIMEOUT_MS = 4_000;

type FlutterwaveEvent = {
  event?: string;
  data?: { tx_ref?: string };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("verif-hash");

  // Always the Flutterwave adapter, regardless of PAYMENT_PROVIDER: this route
  // exists precisely so a webhook from the other provider is still understood
  // after a switch.
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: FlutterwaveEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // Flutterwave fires charge.completed for failed attempts too. Only that
  // event can carry a settled charge, so anything else is acknowledged and
  // left for the recovery sweep to notice.
  if (event.event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.tx_ref;

  // Only the reference is taken from the payload. Without it there is nothing
  // to verify or fulfil.
  if (!reference) {
    return NextResponse.json(
      { error: "Webhook payload is missing a reference." },
      { status: 400 }
    );
  }

  /*
   * The payload is not the truth, and its `verif-hash` is a static shared
   * secret rather than a body signature — it can be replayed by anyone who
   * learns it. So the transaction is re-verified against the Flutterwave API
   * and only what the API reports is finalized: amount (already normalised to
   * kobo), status, customer, metadata and transaction id all come from
   * `verifyTransaction`.
   *
   * A verify that cannot answer gets a retryable error, not an
   * acknowledgement, so Flutterwave redelivers and a real payment is never
   * dropped because the API was briefly down.
   */
  const transaction = await verifyTransaction(reference, VERIFY_TIMEOUT_MS).catch(
    () => null
  );

  if (!transaction) {
    return NextResponse.json(
      { error: "Could not verify transaction." },
      { status: 502 }
    );
  }

  // Verified, but not a success: a pending or failed attempt. Acknowledge
  // without fulfilling; the recovery sweep owns these.
  if (transaction.status !== "success") {
    return NextResponse.json({ received: true, fulfilled: false });
  }

  const result = await finalizeVerifiedPurchase(transaction, "flutterwave");

  return NextResponse.json({
    received: true,
    fulfilled: result.fulfilled,
    reason: result.reason,
    purchaseEmailTriggered: result.purchaseEmailTriggered,
    tiktokPurchaseSent: result.tiktokPurchaseSent,
  });
}
