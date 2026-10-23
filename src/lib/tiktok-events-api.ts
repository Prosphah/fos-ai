import { getStorefrontVariantUrl, majorUnits } from "@/lib/money-mastery";
import { isValidTikTokPixelId } from "@/lib/tiktok";
import {
  hashEmailForTikTok,
  hashPhoneForTikTok,
  hashVisitorIdForTikTok,
} from "@/lib/tiktok-user-data";

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
 * The payment webhook is the right place to send it from: it is the only place
 * that knows a payment actually settled, and it runs whether or not a human
 * ever comes back to the site. The success page calls the same path as a
 * fallback for a webhook that never arrived.
 *
 * Reads a secret. Server only — never import this from a client component.
 */
/**
 * business-api.tiktok.com, not api.tiktokbiz.com.
 *
 * Both appear in circulating examples. The latter does not resolve at all —
 * every request to it fails at the connection, before any response — so an
 * Events API integration pointed at it never receives so much as an error code
 * from TikTok and looks like a silent no-op. Verified by request, not by docs:
 * `api.tiktokbiz.com` threw "fetch failed" on v1.3, v1.2 and v1.1 alike,
 * while this host answers.
 */
const TRACK_HOST = "https://business-api.tiktok.com";

/**
 * Only v1.3 is the Events API. v1.2 is a 404 and v1.1 answers with a different,
 * older schema ("no schema found"), so a wrong version here is another way to
 * get a response that looks like an unrelated error.
 */
const TRACK_PATH = "/open_api/v1.3/event/track/";

/**
 * Long enough for a normal call, short enough that TikTok being slow cannot
 * delay the webhook's response past what Paystack will wait for.
 */
const TIMEOUT_MS = 5_000;

export type TikTokPurchase = {
  /** Payment reference. The join key with the browser's copy of this event. */
  eventId: string;
  /** Kobo. Both adapters normalise to kobo before this is called. */
  amountInKobo: number;
  contentId: string;
  contentName: string;
  contentCategory?: string;
  /** Which storefront page it was bought on, when that was recorded. */
  sourceVariant?: string | null;
  /**
   * The buyer's email, sent unhashed and hashed here rather than by the caller,
   * so the normalisation lives in one place.
   */
  email?: string | null;
  /**
   * E.164 digits, e.g. "2348031234567". Optional because checkout asks for a
   * number but does not require one.
   */
  phone?: string | null;
  /**
   * The anonymous mmc_vid cookie. Hashed here and sent as external_id, which
   * is what ties the Purchase to the PageView TikTok already saw from this
   * browser — the single largest matching gain available now that a stable
   * per-person id exists.
   */
  externalId?: string | null;
  /** Buyer IP captured at checkout start. Sent as-is; TikTok does not hash it. */
  ip?: string | null;
  /** Buyer user agent captured at checkout start. Sent as-is. */
  userAgent?: string | null;
  /** TikTok click id from the ad URL, captured by src/proxy.ts. */
  ttclid?: string | null;
  /**
   * The `_ttp` cookie the TikTok pixel sets. Plain text, captured at checkout
   * and sent as `user.ttp`, which gives TikTok a second browser-scoped key
   * alongside ttclid when cookies are not blocked.
   */
  ttp?: string | null;
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

  /*
   * Advanced Matching: who this purchase belongs to.
   *
   * Without a `user` block TikTok can only match this sale by IP and browser,
   * which is roughly a coin flip on shared networks and mobile carriers — a
   * large share of the traffic this storefront gets. TikTok reports a 13% lower
   * CPA for advertisers sending complete match keys, which is most of the
   * reason this block exists.
   *
   * The email is hashed, never sent as typed. SHA-256 is one-way, so TikTok
   * cannot read the address back or use it to email anyone; it can only check
   * whether the same digest has been seen against a TikTok account. That is the
   * entire privacy argument for doing this at all, and it is why the hashing
   * cannot be skipped or swapped for plaintext.
   *
   * Every identifier here is one TikTok's Event Match Quality panel asks for.
   * Together they lift the score from "email only" to a matchable event:
   *
   *   - email (hashed) — the strongest identity signal available.
   *   - phone (hashed) — collected optionally at checkout, E.164 normalised.
   *   - external_id (hashed) — the anonymous mmc_vid cookie, which is the only
   *     id TikTok has already seen on this same browser's PageView.
   *   - ip / user_agent — captured from the checkout request, sent as-is.
   *   - ttclid — the ad click id, captured by the proxy on landing.
   *   - ttp — the pixel's own browser cookie, read at checkout when present.
   */
  const email = purchase.email?.trim();
  const phone = purchase.phone?.trim();
  const externalId = purchase.externalId?.trim();
  const ip = purchase.ip?.trim();
  const userAgent = purchase.userAgent?.trim();
  const ttclid = purchase.ttclid?.trim();
  const ttp = purchase.ttp?.trim();

  const user = {
    ...(email ? { email: hashEmailForTikTok(email) } : {}),
    /*
     * `phone`, not `phone_number`.
     *
     * The browser pixel's identify() call takes `phone_number`; the Events API
     * takes `phone`. TikTok answers code 0 for an unknown key, so getting this
     * backwards looks like a working integration while the phone match key is
     * silently dropped — the exact reason the EMQ panel can stay at zero phone
     * coverage after a number is collected.
     */
    ...(phone ? { phone: hashPhoneForTikTok(phone) } : {}),
    ...(externalId
      ? { external_id: hashVisitorIdForTikTok(externalId) }
      : {}),
    // Not hashed: TikTok matches these against the network request itself.
    ...(ip ? { ip } : {}),
    ...(userAgent ? { user_agent: userAgent } : {}),
    ...(ttclid ? { ttclid } : {}),
    ...(ttp ? { ttp } : {}),
  };

  const payload = {
    event_source: "web",
    event_source_id: pixelId,
    // Events Manager > Data Connection > Test Events produces this code, and
    // it routes the event to Test Events instead of into reporting and
    // optimisation. Only ever set it while testing: test events left on in
    // production pollute the numbers they are meant to check.
    ...(testCode ? { test_event_code: testCode } : {}),
    /*
     * `data` is an ARRAY, even though this sends exactly one event.
     *
     * This is the single most expensive mistake available in this file, and it
     * is invisible: TikTok answers `400 {"code":40002,"message":"Data: Invalid
     * type."}` to the object form that its own documentation examples are
     * written in. The message names no field and points at nothing wrong with
     * the event, so it reads as a malformed purchase rather than a container
     * shaped wrong. Confirmed against the live API — the identical payload
     * wrapped as an object is rejected, and as an array returns `{"code":0}`.
     *
     * Keep the array, and send the whole event inside it.
     */
    data: [
      {
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
         * Advanced Matching. See the `user` block built above: every identity
         * field is SHA-256'd and unsalted so the same person matches across
         * devices, while the raw value never leaves this process. IP, user
         * agent and ttclid are the exception — TikTok matches those against
         * the request itself and expects them unhashed.
         */
        ...(Object.keys(user).length > 0 ? { user } : {}),
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
    ],
  };

  try {
    const response = await fetch(`${TRACK_HOST}${TRACK_PATH}`, {
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
