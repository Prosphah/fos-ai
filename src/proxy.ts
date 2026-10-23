import { NextResponse, type NextRequest } from "next/server";

/**
 * The Money Mastery Code storefront lives on its own hostname, but it is the
 * same deployment as the FOS*AI app. Requests arriving on the sales hostname
 * are rewritten onto the existing /money-mastery-code routes, so there is no
 * second Vercel project, no second repository, and no duplicated page code.
 *
 * This file decides *which* variant a visitor sees. It does not affect
 * attribution: every variant page still posts its own `variant` to
 * /api/checkout, and that value is what lands in enrollments.source_variant.
 */

/**
 * Hostname that serves the storefront. Leave unset to disable all rewriting,
 * which is what you want locally: `next dev` should keep using the app's own
 * paths so you can visit /money-mastery-code/v1 directly.
 */
const SALES_HOST = process.env.NEXT_PUBLIC_SALES_HOST;

/** Storefront variant -> the route that renders it. */
const VARIANT_ROUTES = {
  a: "/money-mastery-code/v1",
  b: "/money-mastery-code/v2",
  c: "/money-mastery-code/v3",
} as const;

type Variant = keyof typeof VARIANT_ROUTES;

/**
 * The test currently running. v1 is the control, v3 is the challenger, and
 * v2 is held out of rotation so it does not pollute the comparison.
 *
 * To test something else, edit this array. A single-entry array serves that
 * variant to everyone, which is how you fall back to a known-good page.
 */
const TEST_VARIANTS: Variant[] = ["a", "c"];

/**
 * Pins a visitor to the variant they were first shown, so that hitting the
 * root again, sharing the link, or returning from Paystack all land on the
 * same page. Long enough to outlast a typical buying window.
 */
const COOKIE = "mmc_variant";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/**
 * An anonymous id for the browser, for TikTok's external_id.
 *
 * This is the only customer identifier that can reach a PageView. Email cannot:
 * on a cold ad click nobody knows who the visitor is until they type an address
 * into the checkout form, which is the last step of the funnel. An id minted
 * here is the one thing available at the very first event.
 *
 * What it is NOT: a person. It is random, it is never derived from anything
 * about the visitor, and it is not linked to the email in any way TikTok can
 * see — the two meet only inside TikTok's own matching, and only if that same
 * person's Purchase event later arrives with an email hash.
 *
 * Set here rather than from a client component because this is the only place
 * in the request lifecycle that can set a cookie before the page renders. Doing
 * it in the browser would mean the first PageView went out with no id at all,
 * which is precisely the visit the id exists to cover.
 */
const VISITOR_COOKIE = "mmc_vid";

/** Matches TikTok's own cookie lifetime, so the two expire together. */
const VISITOR_MAX_AGE = 60 * 60 * 24 * 395;

/**
 * The TikTok click id from the ad URL, kept on our own first-party cookie.
 *
 * The pixel sets its own cookie, but that cookie is not readable by the
 * server at checkout time on every browser (ITP and ad blockers are exactly
 * the traffic this is meant to recover). Writing it here, before any client
 * JavaScript runs, means the server-side Purchase can still carry it.
 *
 * 13 months, the lifetime the privacy policy states for ttclid.
 */
const TTCLID_COOKIE = "mmc_ttclid";
const TTCLID_MAX_AGE = 60 * 60 * 24 * 395;

function isVariant(value: unknown): value is Variant {
  return typeof value === "string" && value in VARIANT_ROUTES;
}

/**
 * The only shape a TikTok click id is allowed to take before it becomes a
 * cookie. TikTok ids are long opaque tokens; anything else in `?ttclid=` is
 * either a mistake or an attempt to stuff a header, and neither belongs on
 * every subsequent request.
 */
function cleanTtclid(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^[A-Za-z0-9._~-]{10,200}$/.test(value) ? value : null;
}

/**
 * The hostname the request actually arrived on.
 *
 * Deliberately reads the raw header rather than `request.nextUrl.hostname`.
 * Next.js rewrites `nextUrl` to the address the server is bound to, so on a
 * local `next start` that is always "localhost" no matter what Host the
 * request carries. Behind Vercel the header is the true hostname, but going
 * through the header keeps this testable locally and identical in production.
 *
 * `x-forwarded-host` is preferred because it is what survives an upstream
 * proxy; the port is dropped because "mmc.betiangli.xyz:443" and
 * "mmc.betiangli.xyz" are the same site.
 */
function resolveHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = forwarded ?? request.headers.get("host") ?? "";

  return host.split(",")[0].split(":")[0].trim().toLowerCase();
}

/**
 * Which variant this request should see, and whether we needed to pick one.
 *
 * A short path forces a variant outright, e.g. mmc.betiangli.xyz/c for an ad
 * or a link in an email. Otherwise the cookie decides, and a visitor with no
 * cookie yet is assigned one. An unknown path falls through to the same
 * logic as the root, so the whole hostname behaves like a storefront.
 */
function resolveVariant(
  request: NextRequest
): { variant: Variant; shouldPin: boolean } {
  const slug = request.nextUrl.pathname.replace(/^\/+|\/+$/g, "");

  if (isVariant(slug)) {
    return { variant: slug, shouldPin: true };
  }

  const pinned = request.cookies.get(COOKIE)?.value;
  if (isVariant(pinned)) {
    return { variant: pinned, shouldPin: false };
  }

  return {
    variant: TEST_VARIANTS[Math.floor(Math.random() * TEST_VARIANTS.length)],
    shouldPin: true,
  };
}

export function proxy(request: NextRequest) {
  if (!SALES_HOST || resolveHost(request) !== SALES_HOST.toLowerCase()) {
    return NextResponse.next();
  }

  /*
   * The anonymous visitor id, on every storefront response rather than only the
   * ones that rewrite.
   *
   * It has to be issued before the page is served rather than alongside the
   * variant cookie, or it would be missing on exactly two responses that matter:
   * the /success page, which is excluded from rewriting and is where the
   * Purchase event is sent from, and any explicit /a /b /c link an ad points at.
   */
  const visitorId =
    request.cookies.get(VISITOR_COOKIE)?.value ?? crypto.randomUUID();

  // Read on every storefront request, not just the first: an ad click that
  // lands on /a carries it in the URL, and a later navigation drops the query
  // but keeps the cookie.
  const ttclid =
    cleanTtclid(request.nextUrl.searchParams.get("ttclid")) ??
    cleanTtclid(request.cookies.get(TTCLID_COOKIE)?.value);

  // Everything under /money-mastery-code/ is the app's own addressing and must
  // keep resolving on the sales hostname. That covers the Paystack callbackUrl,
  // which is built from the request origin plus /money-mastery-code/success,
  // and the generated Open Graph image, which link unfurlers fetch by its own
  // URL and which would otherwise be rewritten into a page of HTML.
  //
  // Matched as a prefix rather than listing paths, so a route added later is
  // reachable here by default instead of silently breaking.
  //
  // It also keeps these requests out of the test, so a buyer is never
  // re-shuffled onto a different page after they pay.
  if (request.nextUrl.pathname.startsWith("/money-mastery-code/")) {
    return withStorefrontCookies(NextResponse.next(), request, visitorId, ttclid);
  }

  const { variant, shouldPin } = resolveVariant(request);
  const response = NextResponse.rewrite(
    new URL(VARIANT_ROUTES[variant], request.url)
  );

  // Every visitor's root URL resolves to the same rewritten path, so Vercel
  // would otherwise cache one variant's HTML and hand it to everyone, quietly
  // collapsing the split to a single arm. Forcing a private response is what
  // keeps the test honest. It costs a cache hit on a landing page, which is a
  // fair trade for attribution that actually reflects who saw what.
  response.headers.set("Cache-Control", "private, no-store");

  if (shouldPin) {
    response.cookies.set(COOKIE, variant, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: true,
    });
  }

  return withStorefrontCookies(response, request, visitorId, ttclid);
}

/**
 * Puts the anonymous visitor id and the TikTok click id on a response, but
 * only where they are not already there.
 *
 * Rewriting an existing id would renumber a returning visitor on every request,
 * and TikTok would read that as a brand new person each time — destroying the
 * very history the id is kept for. Re-setting an unchanged cookie is also
 * pointless work on the hot path.
 */
function withStorefrontCookies(
  response: NextResponse,
  request: NextRequest,
  visitorId: string,
  ttclid: string | null,
): NextResponse {
  if (!request.cookies.get(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      path: "/",
      maxAge: VISITOR_MAX_AGE,
      sameSite: "lax",
      secure: true,
    });
  }

  if (ttclid && request.cookies.get(TTCLID_COOKIE)?.value !== ttclid) {
    response.cookies.set(TTCLID_COOKIE, ttclid, {
      path: "/",
      maxAge: TTCLID_MAX_AGE,
      sameSite: "lax",
      secure: true,
    });
  }

  return response;
}

export const config = {
  /**
   * Everything except API routes, build output, and image assets.
   *
   * The negative lookahead matters more than a positive path list: any future
   * storefront URL is picked up automatically instead of silently bypassing
   * the split. Images must be excluded because they are served straight out of
   * /public, and rewriting one to a variant route would 404 it.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|svg|webp|avif|gif|ico)$).*)",
  ],
};