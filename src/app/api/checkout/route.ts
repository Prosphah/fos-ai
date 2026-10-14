import { NextResponse } from "next/server";
import { getTier } from "@/lib/money-mastery";
import { generateReference, initializeTransaction } from "@/lib/paystack";

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
  let body: { tier?: string; email?: string; variant?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tier = getTier(body.tier);
  const email = body.email?.trim().toLowerCase() ?? "";
  const variant = parseVariant(body.variant);

  if (!tier) {
    return NextResponse.json({ error: "Unknown option." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  try {
    const { authorizationUrl } = await initializeTransaction({
      email,
      amount: tier.amount,
      reference: generateReference(),
      callbackUrl: `${origin}/money-mastery-code/success`,
      metadata: {
        tier: tier.id,
        tier_name: tier.name,
        course: "Money Mastery Code",
        // Carried through to enrollments.source_variant by the webhook so
        // conversion can be compared per storefront variant.
        source_variant: variant ?? "control",
      },
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}