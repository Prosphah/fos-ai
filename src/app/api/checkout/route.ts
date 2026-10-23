import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recordCheckoutIntent, markCheckoutFailed } from "@/lib/checkout-intents";
import {
  asStorefrontVariant,
  getTier,
  giftAmount,
} from "@/lib/money-mastery";
import { getPaymentProvider } from "@/lib/payment-registry";
import { parseFullName, parsePhoneForE164 } from "@/lib/validation/checkout";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * First hop of x-forwarded-for, which is the buyer rather than the proxy.
 * Vercel also sets x-real-ip; both are tried so this works behind either.
 */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null
  );
}

/**
 * TikTok click ids are long opaque tokens. Whitelisting the alphabet keeps an
 * arbitrary string off the Events API payload; the length floor rejects a
 * stray "1" that would otherwise inflate coverage without matching anyone.
 *
 * `unknown`, not `string`: one caller passes a cookie value and the other a
 * field off the request body, and the annotation is a claim about the happy
 * path rather than a fact about the wire. A non-string is simply not a click
 * id.
 */
function cleanTtclid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[A-Za-z0-9._~-]{10,200}$/.test(trimmed) ? trimmed : null;
}

/**
 * Reads an email field off a body that arrived from the network.
 *
 * `body.email?.trim()` throws on a number or an object, which turns a
 * malformed request into an uncaught TypeError and a 500. Every email field
 * goes through here so a bad shape gets the 400 that describes it instead.
 */
function readEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  let body: {
    tier?: string;
    email?: string;
    fullName?: string;
    variant?: string;
    phone?: string;
    ttclid?: string;
    /** Gift purchases: the recipient's details, plus the payer's identity. */
    gift?: boolean;
    giftRecipientName?: string;
    giftRecipientEmail?: string;
    purchaserName?: string;
    purchaserEmail?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const tier = getTier(body.tier);
  const email = readEmail(body.email);
  const variant = asStorefrontVariant(body.variant);
  const fullName = parseFullName(body.fullName);
  const phone = parsePhoneForE164(body.phone);

  /*
   * A gift purchase is a different shape: whoever filled the form is not the
   * person the access belongs to. The recipient becomes the checkout's email
   * and name — the enrolment, the FOS*AI invitation and the access email all
   * key on those — while the payer is kept for the receipt.
   */
  const isGift = body.gift === true;
  const giftRecipientName = isGift ? parseFullName(body.giftRecipientName) : null;
  const giftRecipientEmail = isGift ? readEmail(body.giftRecipientEmail) : "";
  const purchaserName = isGift ? parseFullName(body.purchaserName) : null;
  const purchaserEmail = isGift ? readEmail(body.purchaserEmail) : "";

  if (!tier) {
    return NextResponse.json({ error: "Unknown option." }, { status: 400 });
  }

  const checkoutEmail = isGift ? giftRecipientEmail : email;
  const checkoutName = isGift ? giftRecipientName : fullName;

  if (!checkoutEmail || !checkoutName) {
    return NextResponse.json(
      {
        error: isGift
          ? "Enter the recipient's name and email."
          : "Enter your full name and email address.",
      },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(checkoutEmail)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  if (isGift && (!purchaserName || !EMAIL_PATTERN.test(purchaserEmail))) {
    return NextResponse.json(
      { error: "Enter your name and the email your receipt should go to." },
      { status: 400 }
    );
  }

  /*
   * The amount is decided here and never read from the client. A gift is 20%
   * off, computed from the tier, so the page copy and the charge cannot drift
   * apart.
   */
  const payableAmount = isGift ? giftAmount(tier.amount) : tier.amount;

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const provider = getPaymentProvider();
  const reference = provider.generateReference();

  /*
   * Identifiers captured now and read back when the payment settles. The
   * webhook has no browser, so this request is the only opportunity to learn
   * the buyer's IP, user agent, anonymous id and TikTok click id.
   *
   * The cookie is the primary source: src/proxy.ts writes mmc_ttclid from the
   * landing URL, so it survives any client-side navigation between the ad
   * click and checkout. The body is a fallback for local development, where
   * the proxy does not run because there is no sales hostname.
   */
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("mmc_vid")?.value ?? null;
  const ttclid =
    cleanTtclid(cookieStore.get("mmc_ttclid")?.value) ??
    cleanTtclid(body.ttclid);

  // Set by the TikTok pixel. Plain text and short-lived, but it is one more
  // browser-scoped identifier TikTok can match when ttclid is absent.
  const rawTtp = cookieStore.get("_ttp")?.value ?? null;
  const ttp =
    rawTtp && /^[A-Za-z0-9._~-]{4,300}$/.test(rawTtp) ? rawTtp : null;

  await recordCheckoutIntent({
    reference,
    // On a gift this is the recipient: the row is what fulfilment, the FOS*AI
    // invitation and the access email all read.
    email: checkoutEmail,
    fullName: checkoutName,
    tier: tier.id,
    amount: payableAmount,
    variant,
    provider: provider.name,
    clientIp: clientIp(request),
    userAgent: request.headers.get("user-agent"),
    ttclid,
    visitorId,
    phone,
    ttp,
    isGift,
    giftRecipientName: isGift ? giftRecipientName : null,
    giftRecipientEmail: isGift ? giftRecipientEmail : null,
    giftPurchaserName: isGift ? purchaserName : null,
    giftPurchaserEmail: isGift ? purchaserEmail : null,
  });

  try {
    const { authorizationUrl } = await provider.initializeTransaction({
      // The payer receives the provider's receipt; on a normal purchase that
      // is the same address. Fulfilment never reads this field — the recorded
      // row is the authority — so using it here does not send access to the
      // payer by accident.
      email: isGift ? purchaserEmail : email,
      amount: payableAmount,
      reference,
      callbackUrl: `${origin}/money-mastery-code/success`,
      phone,
      metadata: {
        tier: tier.id,
        tier_name: tier.name,
        course: "Money Mastery Code",
        // The payer's name on a gift, so the provider's checkout page and
        // receipt address the person whose card is being charged. The
        // recipient travels in the gift_* fields and takes precedence when
        // the recorded row cannot be read.
        full_name: isGift ? purchaserName ?? "" : fullName ?? "",
        source_variant: variant ?? "control",
        ...(phone ? { phone } : {}),
        ...(isGift
          ? {
              is_gift: "true",
              gift_recipient_name: giftRecipientName ?? "",
              gift_recipient_email: giftRecipientEmail,
              gift_purchaser_name: purchaserName ?? "",
              gift_purchaser_email: purchaserEmail,
            }
          : {}),
      },
    });

    return NextResponse.json({ url: authorizationUrl });
  } catch (error) {
    await markCheckoutFailed(reference);

    const message =
      error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
