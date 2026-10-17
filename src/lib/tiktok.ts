import type { StorefrontVariant } from "@/lib/money-mastery";

/**
 * TikTok measurement for the Money Mastery Code storefront.
 *
 * This is the shared vocabulary: the pixel id, the event names, and the
 * parameters. Three places need to agree on those exactly, which is why they
 * are declared once here rather than in each caller:
 *
 *   - src/components/sales/tiktok-pixel.tsx loads the pixel.
 *   - src/components/sales/tiktok-events.tsx fires the browser events.
 *   - src/lib/tiktok-events-api.ts posts the server-side purchase.
 *
 * When TikTok deduplicates, it compares the event name and the event_id
 * across the two copies of an event. Change a name in one place only and the
 * same sale is counted twice, which reads as a sudden and inexplicable jump in
 * ROAS.
 */

/**
 * The pixel id, e.g. DB9NB4RC77UB6E0EDHKG.
 *
 * Unset means no pixel loads at all, which is the correct state for local
 * development: a pixel firing from a developer's machine mixes their reloads
 * into the same dataset as real storefront traffic and quietly inflates every
 * rate in the account.
 */
export const TIKTOK_PIXEL_ID =
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() ?? "";

/**
 * TikTok issues pixel ids as alphanumeric strings. Validating the shape rather
 * than trusting it matters more than it looks: the value is interpolated into
 * an inline `<script>` as a JavaScript string literal, so anything containing a
 * quote would break out of it. An environment variable is not user input, but it
 * is also not something this code controls.
 */
export function isValidTikTokPixelId(value: string): boolean {
  return /^[A-Za-z0-9]{8,64}$/.test(value);
}

/**
 * The standard events this storefront sends.
 *
 * Deliberately short. `PageView` is automatic and is not listed because it is
 * never sent by hand. `AddPaymentInfo` is absent because card details are
 * entered on Paystack's own hosted page and never touch this site, so there
 * would be nothing truthful to report. `Lead` and `CompleteRegistration` are
 * absent because the enrolment happens by hand, off-site, after the sale — an
 * event fired when we send the access link would be reporting a delay we
 * measure in hours as though it were a conversion.
 */
export type TikTokEventName = "ViewContent" | "InitiateCheckout" | "Purchase";

/** Every price on this site is in Nigerian naira, and TikTok supports NGN. */
export type TikTokCurrency = "NGN";

/**
 * TikTok's standard event parameters.
 *
 * Only the fields that can be supplied honestly are typed. An untyped bag of
 * strings would let a `value` go out as a formatted "₦15,000" or as undefined
 * on the one event where ROAS is computed from it.
 */
export type TikTokEventParams = {
  /** Total in major units. Required for ROAS and value-based optimisation. */
  value?: number;
  currency?: TikTokCurrency;
  content_type?: "product" | "product_group";
  /** TikTok requires the plural spelling, for one id or many. */
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  description?: string;
  quantity?: number;
  /**
   * The key that ties the browser's copy of an event to the server's copy of
   * the same event. Both sides pass the Paystack reference here.
   */
  event_id?: string;
  /**
   * Which storefront page the event came from.
   *
   * Not one of TikTok's named parameters, so it is sent but not surfaced as a
   * breakdown in Ads Manager. The authoritative per-variant numbers live in
   * enrollments.source_variant regardless; this is a convenience copy.
   */
  variant?: StorefrontVariant;
};

/**
 * Queue an event on the pixel.
 *
 * Silent when there is no pixel: no id configured, a client without the base
 * code, or a server render. Analytics must never be the reason a page fails to
 * render or a checkout fails to start, so this cannot throw and does not care
 * whether anyone is listening.
 */
export function trackTikTokEvent(
  event: TikTokEventName,
  params: TikTokEventParams = {},
): void {
  if (typeof window === "undefined") return;

  const ttq = window.ttq;
  if (!ttq || typeof ttq.track !== "function") return;

  try {
    ttq.track(event, params as Record<string, unknown>);
  } catch (error) {
    console.error(`[tiktok] Could not record ${event}`, error);
  }
}

/**
 * Record a page view outside a full page load.
 *
 * See tiktok-pixel.tsx for why this is needed at all — in short, `ttq.page()`
 * is only ever called by the base code, which runs once per document.
 */
export function trackTikTokPageView(): void {
  if (typeof window === "undefined") return;

  window.ttq?.page?.();
}
