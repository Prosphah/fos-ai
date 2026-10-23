"use client";

import { useEffect, useRef } from "react";

import {
  COURSE_TIERS,
  majorUnits,
  type StorefrontVariant,
} from "@/lib/money-mastery";
import {
  trackTikTokEvent,
  type TikTokEventName,
  type TikTokEventParams,
} from "@/lib/tiktok";

/**
 * Tell the pixel who this browser belongs to, so events sent from here carry
 * the same Advanced Matching key as the webhook's copy of the purchase.
 *
 * Values must already be hashed. ttq.identify does not hash for us, and an
 * unhashed address here would be the one place plaintext personal data reached
 * TikTok — the server hashes precisely so that it never does.
 */
export function identifyTikTokUser(user: {
  email?: string;
  phone_number?: string;
  external_id?: string;
}): void {
  if (typeof window === "undefined") return;

  const ttq = window.ttq;
  if (!ttq || typeof ttq.identify !== "function") return;

  try {
    ttq.identify(user);
  } catch (error) {
    console.error("[tiktok] Could not identify user", error);
  }
}

/**
 * The course as TikTok sees it.
 *
 * One id for the course rather than one per tier, because the tiers are two
 * ways to buy the same thing rather than two products. The tier that was
 * actually bought is carried on the Purchase event instead, as its own
 * `content_id`.
 */
const CONTENT_ID = "money-mastery-code";

/**
 * The price to report against a content view.
 *
 * The entry tier, which is the cheapest way to take the thing on offer. Only
 * ViewContent carries a value at all: it lets TikTok score a visit against what
 * it would have been worth, and a value on a page that has not yet committed to
 * anything is a judgement call rather than a fact.
 */
const ENTRY_PRICE = majorUnits(
  COURSE_TIERS.find((tier) => !tier.featured)?.amount ?? COURSE_TIERS[0].amount,
);

/**
 * Send one event, ever, for the lifetime of this component.
 *
 * A ref guard rather than the effect's dependency list. React invokes effects
 * twice in development, and a ViewContent that fires twice inflates the
 * viewed-but-did-not-buy audience that retargeting is built from — a bug that
 * only ever appears on someone else's machine.
 */
function useOnceEvent(event: TikTokEventName, params: TikTokEventParams) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackTikTokEvent(event, params);
    // `params` is a fresh object on every render and is listed only so the
    // dependency list is complete. The ref above is what actually makes this
    // once.
  }, [event, params]);
}

/**
 * ViewContent, for one of the three storefront variants.
 *
 * Rendered by each variant page rather than by the shared layout, because the
 * variant is the thing being measured and the layout sits above the rewrite
 * that chooses it — on the sales hostname the layout cannot tell an A visitor
 * from a C one.
 */
export function ViewContentTracker({ variant }: { variant: StorefrontVariant }) {
  useOnceEvent("ViewContent", {
    content_type: "product",
    content_ids: [CONTENT_ID],
    content_name: "Money Mastery Code",
    content_category: "education",
    currency: "NGN",
    value: ENTRY_PRICE,
    variant,
  });

  return null;
}

/**
 * Purchase, fired from the verified success page.
 *
 * This is one of two copies of the same sale. The payment webhook posts the
 * other through the Events API (see @/lib/tiktok-events-api), because the
 * browser is not a reliable witness to a payment: it may never arrive at the
 * success page, and it may have been blocked outright. Both copies carry the
 * payment reference as `event_id`, which is how TikTok tells them apart from
 * two separate sales.
 *
 * If the Diagnostics tab ever shows one sale counted twice, this component is
 * the thing to remove. Keep the server copy, drop this one — the coverage lost
 * is a few percent, and reporting the same money twice is worse than missing
 * it.
 */
export function PurchaseTracker({
  eventId,
  amountInKobo,
  contentId,
  contentName,
  variant,
  hashedEmail,
  hashedPhone,
  hashedExternalId,
}: {
  /** The payment reference. The join key with the server-side event. */
  eventId: string;
  amountInKobo: number;
  contentId: string;
  contentName: string;
  variant: StorefrontVariant | null;
  /**
   * The buyer's email, already SHA-256'd on the server.
   *
   * Hashed before it reaches the browser on purpose. The digest is safe to put
   * in the page — it is one-way, and this page already displays the buyer's
   * name and email address to that same buyer — but hashing it in the browser
   * would mean shipping the plaintext there first and hashing with Web Crypto,
   * which is async and would let the Purchase event leave before the digest
   * existed. One hash, computed once, in the only place that has the address.
   */
  hashedEmail: string | null;
  /** The buyer's E.164 phone, already SHA-256'd on the server. */
  hashedPhone: string | null;
  /** The anonymous visitor id, already SHA-256'd on the server. */
  hashedExternalId: string | null;
}) {
  const identified = useRef(false);

  // ttq.identify must run before the Purchase track, or the event is sent
  // without the user block and the identification arrives too late to be
  // attached to it. Queued like everything else, so this is still safe if the
  // pixel has not finished loading.
  //
  // external_id is repeated here even though the layout identifies with it on
  // every page: ttq.identify replaces the fields it is given, and the layout's
  // call may have happened before this one. Repeating it keeps the browser
  // Purchase carrying the same three keys as the server's copy.
  useEffect(() => {
    if (
      identified.current ||
      (!hashedEmail && !hashedPhone && !hashedExternalId)
    ) {
      return;
    }
    identified.current = true;
    identifyTikTokUser({
      ...(hashedEmail ? { email: hashedEmail } : {}),
      ...(hashedPhone ? { phone_number: hashedPhone } : {}),
      ...(hashedExternalId ? { external_id: hashedExternalId } : {}),
    });
  }, [hashedEmail, hashedPhone, hashedExternalId]);

  useOnceEvent("Purchase", {
    event_id: eventId,
    currency: "NGN",
    // What was actually paid, read back from the provider rather than taken
    // from the price printed on the page. A discount applied at the provider
    // end would otherwise be reported at full price, and ROAS would be
    // flattering.
    value: majorUnits(amountInKobo),
    content_type: "product",
    content_ids: [contentId],
    content_name: contentName,
    content_category: "education",
    quantity: 1,
    ...(variant ? { variant } : {}),
  });

  return null;
}
