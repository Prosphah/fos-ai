import { getStorefrontVariantUrl, majorUnits } from "@/lib/money-mastery";
import { isValidTikTokPixelId } from "@/lib/tiktok";

/**
 * The server half of TikTok measurement: the Events API.
 *
 * The pixel in the browser is missing conversions often enough to matter.
 * Safari's ITP, ad blockers, and every buyer who simply never returns to the
 * thank-you page all produce sales TikTok cannot see — and an ad account
 * optimises towards the conversions it can see, so every one of those is a sale
 * that quietly degrades the campaign. TikTok's own guidance for all web
 * advertisers is to run both and deduplicate, which is what the `event_id`
 * below arranges.
 *
 * The Paystack webhook is the right place to send it from: it is the only place
 * that knows a payment actually settled, and it runs whether or not a human
 * ever comes back to the site.
 *
 * Reads a secret. Server only — never import this from a client component.
 */
const TRACK_URL = "https://api.tiktokbiz.com/open_api/v1.3/event/track/";

/**
 * Long enough for a normal call, short enough that TikTok being slow cannot
 * delay the webhook's response past what Paystack will wait for.
 */
const TIMEOUT_MS = 5_000;

export type TikTokPurchase = {
  /** Paystack reference. The join key with the browser's copy of this event. */
  eventId: string;
  /** Kobo, as Paystack reports it. */
  amountInKobo: number;
  contentId: string;
  contentName: string;
  contentCategory?: string;
  /** Which storefront page it was bought on, when that was recorded. */
  sourceVariant?: string | null;
};

export type TikTokSendResult = {
  sent: boolean;
  /** Why not, when not. Worth logging: this runs once per sale. */
  reason?: string;
};

/**
 * Report a completed purchase.
 *
 * Written so that it cannot throw. The only caller is a webhook, and a webhook
 * that answers non-2xx gets its event replayed by Paystack — and that replay is
 * what produces duplicate enrolments and duplicate invitations, which is a far
 * worse outcome than a missing advertising event.
 */
export async function sendTikTokPurchase(
  purchase: TikTokPurchase,
): Promise<TikTokSendResult> {
  const accessToken = process.env.TIKTOK_PIXEL_ACCESS_TOKEN?.trim();
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim();

  if (!accessToken || !isValidTikTokPixelId(pixelId ?? "")) {
    return { sent: false, reason: "not-configured" };
  }

  const landingUrl = getStorefrontVariantUrl(purchase.sourceVariant ?? undefined);
  const testCode = testEventCode();

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    // Events Manager > Data Connection > Test Events produces this code, and
    // it routes the event to Test Events instead of into reporting and
    // optimisation. Only ever set it while testing: test events left on in
    // production pollute the numbers they are meant to check.
    ...(testCode ? { test_event_code: testCode } : {}),
    data: {
      event: "Purchase",
      event_id: purchase.eventId,
      // Seconds, not milliseconds. TikTok rejects a payload whose timestamp is
      // implausibly far from now, so this is not a field to leave out.
      event_time: Math.floor(Date.now() / 1000),
      // Which storefront page the sale is attributed to. Omitted when there is
      // no sales host configured, because TikTok wants an absolute URL and a
      // route path is not one.
      ...(landingUrl.startsWith("http") ? { page: { url: landingUrl } } : {}),
      /*
       * `user` is deliberately absent.
       *
       * Advanced Matching wants the buyer's email address, SHA-256'd, shipped
       * to an advertising platform — and there is no consent banner on these
       * pages for that to rest on. Matching still works without it: the
       * browser pixel has already tied this visitor to the ad they clicked
       * through its own first-party cookie, so a conversion reported from that
       * same browser is recognisable. What is given up is cross-device reach.
       *
       * Adding it later means adding `user: { email: sha256(email) }` here, and
       * saying so in section 15 of the privacy policy first.
       */
      properties: {
        currency: "NGN",
        value: majorUnits(purchase.amountInKobo),
        content_type: "product",
        content_ids: [purchase.contentId],
        content_name: purchase.contentName,
        content_category: purchase.contentCategory ?? "education",
        quantity: 1,
        source: "web",
        ...(purchase.sourceVariant ? { variant: purchase.sourceVariant } : {}),
      },
    },
  };

  try {
    const response = await fetch(TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // The per-pixel access token, not an account-wide key. Events Manager
        // > Data Connection > API details issues it.
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        sent: false,
        reason: `http-${response.status}`,
      };
    }

    /*
     * TikTok answers 200 for a rejected event too, putting the failure in the
     * body rather than the status line, so the status alone would report
     * success for events that never arrived. Read the body and let the caller
     * see it; this is a per-sale decision to log and not worth a schema.
     */
    const result = (await response.json().catch(() => null)) as {
      code?: number;
      message?: string;
    } | null;

    if (result && result.code !== 0) {
      return { sent: false, reason: result.message ?? `code-${result.code}` };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "request-failed",
    };
  }
}

function testEventCode(): string | undefined {
  return process.env.TIKTOK_TEST_EVENT_CODE?.trim() || undefined;
}
