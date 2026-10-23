import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  GraduationCap,
  Loader2,
  Mail,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";

import { AutoRedirect } from "@/components/sales/auto-redirect";
import { PurchaseTracker } from "@/components/sales/tiktok-events";
import {
  asStorefrontVariant,
  getStorefrontResumeUrl,
  getStorefrontUrl,
  getTier,
  getWhatsAppUrl,
} from "@/lib/money-mastery";
import {
  checkoutResumeForReference,
  finalizeVerifiedPurchase,
  providerNameForReference,
  type FinalizeResult,
} from "@/lib/finalize-purchase";
import { getPaymentProviderByName } from "@/lib/payment-registry";
import { SITE_ORIGIN } from "@/lib/seo";
import {
  hashEmailForTikTok,
  hashPhoneForTikTok,
  hashVisitorIdForTikTok,
} from "@/lib/tiktok-user-data";
import { parseFullName } from "@/lib/validation/checkout";

export const metadata: Metadata = {
  title: "You are enrolled | Money Mastery Code",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The gift form. A gift purchase is its own flow rather than a variant, so a
 * cancelled gift is returned here and not to a storefront page. Relative on
 * purpose: it resolves on whichever host the checkout started from, and
 * src/proxy.ts passes /money-mastery-code/ through untouched.
 */
const GIFT_PAGE_PATH = "/money-mastery-code/gift";

type PageProps = {
  searchParams: Promise<{
    reference?: string;
    tx_ref?: string;
    /** The payment page's own verdict, appended to the redirect URL. */
    status?: string;
  }>;
};

/**
 * First name only, for the greeting.
 *
 * Paystack and Flutterwave echo back whatever the buyer typed, so this is a
 * name of unknown provenance rendered into a heading. Using only the first
 * token limits how much of it is echoed, and means a single stray comma or
 * double space cannot turn the greeting into a sentence. Falls back to null so
 * the page drops to a neutral heading rather than rendering something odd.
 */
function firstName(fullName: string | null): string | null {
  if (!fullName) return null;

  const [first] = fullName.split(" ");
  if (!first) return null;

  return first.length <= 40 ? first : null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16 font-sans">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}

/**
 * Back to the sales page.
 *
 * The href is passed in by the enrolled state, which knows which variant the
 * buyer came from. The three states above a verified payment have no
 * transaction to read that from, so they fall back to the storefront root.
 */
function BackToPricing({
  href = getStorefrontUrl(),
  label = "Back to Money Mastery Code",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="sales-focus inline-flex items-center gap-2 text-[14px] font-medium"
      style={{ color: "var(--sales-accent)" }}
    >
      {label}
      <ArrowRight size={16} />
    </Link>
  );
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Paystack redirects with `reference`; Flutterwave redirects with `tx_ref`.
  // Both name the same thing — the reference this checkout was opened under.
  const reference = params.reference ?? params.tx_ref;

  /*
   * The payment page's own verdict on the attempt, which Flutterwave appends
   * to the redirect: `?status=cancelled&tx_ref=…` when the buyer backs out of
   * its checkout, `?status=failed` when the attempt could not go through.
   * These are the states that arrive with no successful transaction to verify,
   * and treating them as "still confirming" is what left a cancelled checkout
   * watching a spinner forever.
   *
   * `status=successful` is deliberately ignored. It is the payment page's
   * opinion, not proof, and the verify call below is the authority on whether
   * money actually moved.
   */
  const providerStatus = params.status?.toLowerCase();

  if (providerStatus === "cancelled" || providerStatus === "failed") {
    /*
     * Back to the page the buyer actually left from. A gift returns to the
     * gift form — the variant it was recorded under is attribution, not the
     * page they were filling in. For everything else the recorded row is
     * preferred because it names the page the buyer was actually shown; the
     * cookie is the fallback for a reference that never got a row written.
     */
    const recorded = reference
      ? await checkoutResumeForReference(reference)
      : null;
    const returnUrl = recorded?.isGift
      ? GIFT_PAGE_PATH
      : getStorefrontResumeUrl(
          recorded?.variant ??
            asStorefrontVariant((await cookies()).get("mmc_variant")?.value) ??
            undefined,
        );

    return (
      <Shell>
        <AutoRedirect href={returnUrl} />
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {providerStatus === "failed"
              ? "Payment did not go through"
              : "Payment cancelled"}
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            {providerStatus === "failed"
              ? "The charge could not be completed, so nothing was paid."
              : "Nothing was charged and no money left your account."}{" "}
            Taking you back to where you left off so you can try again — if
            that does not happen on its own, use the link below.
          </p>
          <div className="mt-8">
            <BackToPricing href={returnUrl} label="Take me back now" />
          </div>
        </div>
      </Shell>
    );
  }

  if (!reference) {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            No payment reference found
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            If you just completed a payment, email me from the address you paid with
            and I will confirm your access manually.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  const providerName = await providerNameForReference(reference);
  const transaction = await getPaymentProviderByName(providerName).verifyTransaction(reference);

  if (!transaction) {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin"
            style={{ color: "var(--sales-accent)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Confirming your payment
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            This can take a few seconds. Refresh in a moment, and if nothing has
            changed in a minute, email me and I will sort it out.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  if (transaction.status !== "success") {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Payment not completed
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            This transaction came through as {transaction.status}. If money left your
            account, email me with reference {transaction.reference} and I will check
            it straight away.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  /*
   * Finish the purchase from the verified transaction.
   *
   * This is the resilience path. The webhook is the primary fulfilment
   * trigger, but it can be missed: a buyer who never returns, a dashboard
   * that was never configured, a provider outage, or a local test that the
   * provider cannot reach. A verified transaction on this page is proof
   * enough to do the same work, and every step is idempotent so a webhook
   * that already ran is not repeated.
   */
  let finalized: FinalizeResult | null = null;
  try {
    finalized = await finalizeVerifiedPurchase(transaction, providerName);
  } catch (error) {
    // Payment is verified; a database blip must not turn the page into an
    // error screen. The buyer still gets the access-request button below.
    console.error(
      `[success] Could not finalize ${transaction.reference}:`,
      error instanceof Error ? error.message : "Unknown error",
    );
  }

  /*
   * The row recorded a refund. Not a fulfilment failure to retry and not a
   * purchase to announce: the money went back and the access went with it, so
   * the page says exactly that instead of showing a receipt. The finalizer
   * has already skipped the purchase email and the TikTok Purchase.
   */
  if (finalized && !finalized.fulfilled && finalized.reason === "refunded") {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            This purchase was refunded
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            This payment was refunded, so this reference cannot be enrolled
            again. If that does not match what you expected, email me with
            reference {transaction.reference} and I will sort it out.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  const tier = finalized?.tier ?? getTier(String(transaction.metadata?.tier ?? ""));

  // Read once, used twice: to attribute the purchase for TikTok and to decide
  // where "back to the sales page" goes. It comes out of the payment metadata,
  // which the checkout route whitelisted, so it is a variant or it is nothing.
  const sourceVariant =
    finalized?.variant ?? asStorefrontVariant(transaction.metadata?.source_variant);

  // Read back out of the payment rather than from anything the browser sent,
  // so the greeting matches the name recorded against the payment rather than
  // anything that could have been edited into the URL.
  const fullName =
    finalized?.fullName ?? parseFullName(transaction.metadata?.full_name);
  const buyer = firstName(fullName);

  /*
   * The address the buyer typed at checkout. Flutterwave test mode rewrites
   * the customer email with a sandbox prefix, so transaction.email is only a
   * fallback for a checkout row that was never written.
   */
  const buyerEmail = finalized?.email ?? transaction.email;

  /*
   * What actually happened to the FOS*AI account. "unknown" means fulfilment
   * did not run or threw before it could report; it must not be rendered as
   * "invitation sent".
   */
  const fosaiOutcome = finalized?.fosai.outcome ?? "unknown";

  /*
   * A gift fulfils for the recipient, so `fullName` and `buyerEmail` name
   * them, not the payer. The gift block carries both sides: the recipient for
   * "tell them" copy, the purchaser for the greeting and for anything the
   * buyer might message me about.
   */
  const isGift = finalized?.gift.isGift ?? false;
  const recipientName = finalized?.gift.recipientName ?? null;
  const recipientDisplay = recipientName ?? buyerEmail;
  const purchaserName = finalized?.gift.purchaserName ?? null;
  const purchaser = firstName(purchaserName);

  // The same anonymous id the layout hands the pixel, repeated on the Purchase
  // so the browser copy cannot lose it to an identify() call that ran earlier.
  const visitorId = (await cookies()).get("mmc_vid")?.value ?? null;
  const hashedVisitorId = visitorId ? hashVisitorIdForTikTok(visitorId) : null;

  /* Access is granted by hand, so the page's job is to make that one message
   * easy to send and impossible to send incomplete. The reference is the part
   * that matters: it is the join key between this conversation and the
   * payment, so it goes in the composed message rather than being asked for in
   * a follow-up.
   *
   * A gift changes who the message is about: the buyer is messaging on someone
   * else's behalf, so the recipient's address is the useful detail and the
   * payer's name is the sign-off. */
  const requestMessage = isGift
    ? [
        "Hi, I bought the Money Mastery Code as a gift.",
        purchaserName ? `My name is ${purchaserName}.` : null,
        `The access is for ${recipientDisplay}${
          recipientName ? ` (${buyerEmail})` : ""
        }.`,
        `Reference: ${transaction.reference}.`,
        "Could you check that their access email went out?",
      ]
        .filter(Boolean)
        .join(" ")
    : [
        "Hi, I just paid for the Money Mastery Code.",
        fullName ? `My name is ${fullName}.` : null,
        `The email on the payment is ${buyerEmail}.`,
        `Reference: ${transaction.reference}.`,
        "I'd like to request access to the lectures.",
      ]
        .filter(Boolean)
        .join(" ");

  // WhatsApp when a number is configured, email when one is not. A button
  // that opens nothing is the same as no button, and the buyer has just paid.
  const whatsappUrl = getWhatsAppUrl(requestMessage);
  const requestUrl =
    whatsappUrl ??
    `mailto:refunds@betiangli.xyz?subject=${encodeURIComponent(
      "Money Mastery Code — access request"
    )}&body=${encodeURIComponent(requestMessage)}`;

  return (
    <Shell>
      <div className="sales-card rounded-3xl p-8 sm:p-11">
        {/*
          The browser's half of the Purchase event, and the only reason this
          component is here: the amount and the reference come from the
          provider's own record of the payment, so this can only be reached by
          someone whose charge actually settled. The server reports the same
          sale through the Events API, and the shared event_id is what stops
          that counting twice.
        */}
        <PurchaseTracker
          eventId={transaction.reference}
          amountInKobo={transaction.amount}
          contentId={tier?.id ?? "course"}
          contentName={tier?.name ?? "Money Mastery Code"}
          variant={sourceVariant}
          /*
           * The browser half of the Purchase has to name the same person as
           * the browser that made it. On a gift the identifiers (click id,
           * visitor id, IP) belong to the payer, so the hashed address is the
           * payer's too; the recipient is the fallback when we have none.
           */
          hashedEmail={hashEmailForTikTok(
            isGift ? finalized?.gift.purchaserEmail ?? buyerEmail : buyerEmail
          )}
          hashedPhone={finalized?.phone ? hashPhoneForTikTok(finalized.phone) : null}
          hashedExternalId={hashedVisitorId}
        />

        <div className="text-center">
          <CheckCircle2
            size={38}
            className="mx-auto"
            style={{ color: "var(--sales-accent)" }}
          />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {isGift
              ? purchaser
                ? `Thank you, ${purchaser}.`
                : "Your gift is on its way."
              : buyer
                ? `Thank you, ${buyer}.`
                : "You are enrolled."}
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg break-words text-[16px] leading-8"
            style={{ color: "var(--sales-text-2)" }}
          >
            {isGift ? (
              <>
                Payment confirmed. {tier ? tier.name : "The workshop"} is now a
                gift for {recipientDisplay}.
              </>
            ) : (
              <>Payment confirmed{tier ? ` for ${tier.name}` : ""}.</>
            )}{" "}
            Reference{" "}
            <span style={{ color: "var(--sales-text-1)" }}>{transaction.reference}</span>.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <div
            className="flex gap-4 rounded-2xl border p-5"
            style={{
              borderColor: "var(--sales-border)",
              background: "var(--sales-accent-softer)",
            }}
          >
            <GraduationCap size={20} className="mt-0.5 shrink-0" style={{ color: "var(--sales-accent)" }} />
            {/*
              min-w-0 lets this column shrink below the width of its longest
              unbreakable token (a plus-addressed email is one long word), and
              break-words — inherited by the paragraphs — wraps it instead of
              letting it spill out of the card.
            */}
            <div className="min-w-0 break-words">
              <p className="text-[15px] font-semibold">
                {isGift ? "Their lectures" : "Your lectures"}
              </p>
              <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                {isGift
                  ? `Every participant is granted access by me, and added to the community. Their access link has been sent to ${buyerEmail}. Ask them to check their inbox — or message me on their behalf using the button below, usually within 10 minutes and always the same day.`
                  : "Every participant is granted access by me, and added to the community. Check your email for the access link, or message me using the button below and I will send you the access link, usually within 10 minutes and always the same day."}
              </p>
            </div>
          </div>

          <a
            href={requestUrl}
            target={whatsappUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="sales-focus flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition hover:-translate-y-0.5"
            style={{
              background: "var(--sales-accent)",
              color: "var(--sales-accent-contrast)",
            }}
          >
            {whatsappUrl ? (
              <MessageCircle size={17} />
            ) : (
              <Mail size={17} />
            )}
            {isGift
              ? "Message me about their access"
              : whatsappUrl
                ? "Request access on WhatsApp"
                : "Request access by email"}
            <ArrowRight size={17} />
          </a>

          <p
            className="text-center text-[13px] leading-6"
            style={{ color: "var(--sales-text-3)" }}
          >
            {isGift
              ? "The reference and their email go into the message, so there is nothing left to fill in."
              : "Your name, email and reference go into the message, so there is nothing left to fill in."}
          </p>

          {tier?.id === "course_fosai" ? (
            <div
              className="flex gap-4 rounded-2xl border p-5"
              style={{
                borderColor: "var(--sales-border)",
                background: "var(--sales-accent-softer)",
              }}
            >
              <Mail size={20} className="mt-0.5 shrink-0" style={{ color: "var(--sales-accent)" }} />
              <div className="min-w-0 break-words">
                <p className="text-[15px] font-semibold">
                  {isGift ? "Their FOS·AI access" : "Your FOS·AI access"}
                </p>
                {fosaiOutcome === "invited" ? (
                  <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                    {isGift
                      ? `An invitation to create their account is on its way to ${buyerEmail}. They accept it, set a password, and their workspace is waiting.`
                      : `An invitation to create your account is on its way to ${buyerEmail}. Accept it, set a password, and your workspace is waiting.`}
                  </p>
                ) : fosaiOutcome === "existing" ? (
                  isGift ? (
                    <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                      This purchase is linked to the FOS·AI account that already
                      exists for {buyerEmail}. No new invitation was needed —
                      they keep signing in as usual.
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                      This purchase is linked to the FOS·AI account that already
                      exists for {buyerEmail}. No new invitation was needed.{" "}
                      <Link
                        href={`${SITE_ORIGIN}/login`}
                        className="sales-focus font-medium underline underline-offset-2"
                        style={{ color: "var(--sales-accent)" }}
                      >
                        Sign in as usual
                      </Link>
                      .
                    </p>
                  )
                ) : fosaiOutcome === "failed" ? (
                  <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                    {isGift
                      ? "Their payment is confirmed, but the FOS·AI invitation could not be sent automatically. I will set up their access by hand and email them as soon as it is ready."
                      : "Your payment is confirmed, but the FOS·AI invitation could not be sent automatically. I will set up your access by hand and email you as soon as it is ready."}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                    {isGift
                      ? "Their payment is confirmed. I am finishing their FOS·AI access and will email them when it is ready."
                      : "Your payment is confirmed. I am finishing your FOS·AI access and will email you when it is ready."}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <p
          className="mt-8 text-[13.5px] leading-7"
          style={{ color: "var(--sales-text-3)" }}
        >
          {isGift
            ? "Tell them to watch the lectures in order — starting with the Money Management code even if they came for the investing content. Message or email me any time in the first 180 days, including if they decide it was not for them."
            : "Watch the lectures in order. Start with the Money Management code even if you came for the investing content. Message or email me any time in the first 180 days, including if you decide it was not for you."}
        </p>

        {/* The gift offer lives on the success page rather than the sales
            pages: someone who just paid is the one person who knows the
            workshop is worth giving, and there is no ambiguity about what
            they would be buying. */}
        <div
          className="mt-8 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "var(--sales-border)",
            background: "var(--sales-surface-hover)",
          }}
        >
          <div>
            <p className="text-[15px] font-semibold">
              Know someone else who needs this?
            </p>
            <p
              className="mt-1 text-[13.5px] leading-6"
              style={{ color: "var(--sales-text-2)" }}
            >
              Gift the workshop at 20% off. Their access goes straight to
              their email.
            </p>
          </div>
          <Link
            href={GIFT_PAGE_PATH}
            className="sales-focus inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-[14px] font-semibold transition hover:-translate-y-0.5"
            style={{
              background: "var(--sales-accent)",
              color: "var(--sales-accent-contrast)",
            }}
          >
            <Gift size={16} />
            Gift this workshop
          </Link>
        </div>

        <div className="mt-9 text-center">
          <BackToPricing href={getStorefrontUrl(sourceVariant ?? undefined)} />
        </div>
      </div>
    </Shell>
  );
}