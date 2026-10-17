/**
 * The TikTok Pixel queue.
 *
 * TikTok's base code assigns `window.ttq` *before* events.js has finished
 * downloading, as an array of `[method, ...args]` pairs that the loaded library
 * later replays. That is why `ttq.track(...)` is safe to call the instant the
 * snippet has run: it queues rather than drops.
 *
 * Only the methods this app actually calls are declared. A partial surface is
 * deliberate — the full SDK is much larger, and declaring it would mean
 * maintaining a port of a library we do not depend on.
 */
type TikTokQueue = Array<unknown> & {
  /** A page view. The base code fires one on load; see tiktok-pixel.tsx. */
  page: () => void;
  track: (event: string, params?: Record<string, unknown>) => void;
  load: (pixelId: string, options?: Record<string, unknown>) => void;
  /**
   * Cookie-consent control. Deliberately unused today: there is no consent
   * banner on these pages and the storefront sells only in Nigeria, so
   * consent is not collected. Both are documented where they would go — see
   * tiktok-pixel.tsx and the privacy policy's section 15.
   */
  holdConsent: () => void;
  grantConsent: () => void;
  revokeConsent: () => void;
};

interface Window {
  ttq?: TikTokQueue;
}
