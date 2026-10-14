import { NextResponse } from "next/server";
import { recordCheckoutIntent, markCheckoutFailed } from "@/lib/checkout-intents";
import { getTier } from "@/lib/money-mastery";
import { generateReference, initializeTransaction } from "@/lib/paystack";
import { parseFullName } from "@/lib/validation/checkout";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Which storefront page the buyer started from. Whitelisted rather than
 * passed through: this value lands in Paystack metadata and then in our own
 * database, so it must never be an arbitrary client-controlled string.
 * Unrecognised values are stored as null, not guessed at.
 */
function parseVariant(value: unknown): "a" | "b" | "c" | null {
  return value === "a" || value === "b" || value === "c" ? value : null;
}

export async function POST(request: Request) {
  let body: { tier?: string; email?: string; fullName?: string; variant?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tier = getTier(body.tier);
  const email = body.email?.trim().toLowerCase() ?? "";
  const variant = parseVariant(body.variant);

  // Required, not optional. It is the buyer's name on a course enrolment and
  // the name their FOS*AI account is created under, so a purchase made without
  // one is a purchase we cannot fulfil usefully.
  const fullName = parseFullName(body.fullName);

  if (!tier) {
    return NextResponse.json({ error: "Unknown option." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (!fullName) {
    return NextResponse.json(
      { error: "Enter your full name." },
      { status: 400 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // Generated here rather than inline below so the intent row and the Paystack
  // session are keyed on the same reference. The webhook upserts on that
  // reference, so a completed purchase moves this row instead of creating a
  // second one.
  const reference = generateReference();

  // Written before Paystack is called, so the row exists before Paystack could
  // possibly call back. Never throws: losing the row costs an analytics entry,
  // blocking the request would cost the sale.
  await recordCheckoutIntent({
    reference,
    email,
    fullName,
    tier: tier.id,
    amount: tier.amount,
    variant,
  });

  try {
    const { authorizationUrl } = await initializeTransaction({
      email,
      amount: tier.amount,
      reference,
      callbackUrl: `${origin}/money-mastery-code/success`,
      metadata: {
        tier: tier.id,
        tier_name: tier.name,
        course: "Money Mastery Code",
        // The webhook is the only thing that writes to enrollments, and it has
        // no session to read a name from, so the name has to make the round
        // trip through Paystack metadata. Key is alphanumeric-safe and well
        // under Paystack's 45-character key limit.
        full_name: fullName,
        // Carried through to enrollments.source_variant by the webhook so
        // conversion can be compared per storefront variant.
        source_variant: variant ?? "control",
      },
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error) {
    // Paystack never got as far as showing a payment page, so this is not an
    // abandoned checkout and must stay out of the recovery sequence.
    await markCheckoutFailed(reference);

    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}