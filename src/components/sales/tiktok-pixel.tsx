"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  TIKTOK_PIXEL_ID,
  isValidTikTokPixelId,
  trackTikTokPageView,
} from "@/lib/tiktok";
import { identifyTikTokUser } from "@/components/sales/tiktok-events";

const ENABLED = isValidTikTokPixelId(TIKTOK_PIXEL_ID);

/**
 * TikTok's base code, as TikTok ships it, with the pixel id interpolated.
 *
 * Kept verbatim rather than rewritten into a loader of our own. This snippet is
 * what TikTok's Pixel Helper, their diagnostics and their support all expect to
 * find, so any clever rewrite of it becomes something that has to be
 * re-explained every time it misbehaves.
 *
 * One edit beyond the id, and it is load-bearing: the trailing `ttq.page()` is
 * removed. Identification has to happen before the first page view is sent, and
 * the id is a prop this component receives rather than something the inline
 * snippet can read. Calling page() here would fire it at parse time, before
 * React has rendered, and every PageView would go out with no external_id —
 * the exact coverage gap this work exists to close. This component calls
 * ttq.page() itself, once, after identifying.
 *
 * If a consent banner is ever added — the reasoning for not having one is in the
 * privacy policy, section 15 — `ttq.holdConsent()` goes immediately before
 * `ttq.load()`, and `ttq.grantConsent()` fires from the banner's accept button.
 * Nothing else about this component needs to change, and no event call site
 * needs to change, which is why the pixel is loaded in one place and events are
 * queued through ttq rather than sent directly.
 */
const BASE_CODE = `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('${TIKTOK_PIXEL_ID}');
}(window, document, 'ttq');`;

/**
 * The TikTok Pixel, for the storefront only.
 *
 * Mounted in src/app/money-mastery-code/layout.tsx, which is what keeps it off
 * the FOS·AI app, login and marketing pages. That separation is a promise made
 * in the privacy policy, and the cheapest way to keep it is for the tag to have
 * no route into the app at all.
 *
 * Loaded with next/script's afterInteractive, which is worth justifying, because
 * two other options look better and are not:
 *
 *   - A plain inline <script> in the component tree. The first thing to try, and
 *     it does not work: React does not emit inline scripts into the
 *     server-rendered HTML, so the tag only ever came into existence after
 *     hydration. Verified against the build output, not assumed.
 *   - beforeInteractive, which does write itself into the response — but Next.js
 *     only honours it from the root layout, and the root layout is shared with
 *     the FOS·AI app. Moving it there would mean the pixel is one path check
 *     away from firing on the app, which is precisely the boundary the privacy
 *     policy draws. Not worth it, for the reason in the next paragraph.
 *
 * So the tag arrives at hydration rather than at first byte. That is normally
 * the argument against it, and for a landing page it usually is — a visit that
 * ends before the page hydrates is a visit nobody counts. Here it costs
 * nothing that matters, because the only event that depends on the browser is
 * the one nothing depends on:
 *
 *   - Purchase is reported from the Paystack webhook, which never touches the
 *     browser at all. It is unaffected by when, or whether, this tag loads.
 *   - InitiateCheckout needs a person to fill in a name and an email, which
 *     takes far longer than hydration takes.
 *   - ViewContent fires from the page itself, so it is measured from whenever
 *     the page mounts.
 *
 * What a late tag does cost is the occasional uncounted bounce, and an uncounted
 * bounce is a non-conversion. It nudges the conversion rate up slightly and does
 * nothing to the number the campaign is judged on.
 *
 * Renders nothing at all unless a valid pixel id is configured, so a deployment
 * without one is genuinely untracked rather than half-tracked.
 */
export function TikTokPixel({ externalId }: { externalId: string | null }) {
  const pathname = usePathname();
  const seenPath = useRef(pathname);
  const identified = useRef(false);

  useEffect(() => {
    /*
     * Identify first, then report the view. Order is the whole point: ttq sends
     * events in the order they are queued, so a page() queued ahead of
     * identify() leaves without the external_id attached, and no later event can
     * put it right.
     *
     * Skipped when there is no id, which is the expected state on the app
     * hostname and in local development where the proxy does not run. Sending
     * an empty string instead would raise the coverage number TikTok displays
     * while matching nobody — a better-looking score for the same zero results.
     */
    if (identified.current) return;
    identified.current = true;

    if (externalId) {
      identifyTikTokUser({ external_id: externalId });
    }

    /*
     * The base code's own ttq.page() was removed so that it could land here,
     * after identify rather than before it. This is that replacement.
     */
    trackTikTokPageView();
  }, [externalId]);

  useEffect(() => {
    /*
     * Later route changes. This layout survives client-side navigation — the
     * buyer comes back from Paystack to /success, and the "back to the sales
     * page" link goes on to the storefront — and neither loads a fresh
     * document, so nothing else would report them.
     *
     * Compared against the previous path rather than fired on mount, because
     * the effect above has already reported the mount. Firing both would count
     * one view twice.
     */
    if (seenPath.current === pathname) return;
    seenPath.current = pathname;
    trackTikTokPageView();
  }, [pathname]);

  if (!ENABLED) return null;

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: BASE_CODE }}
    />
  );
}
