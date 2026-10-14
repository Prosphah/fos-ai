import type { Metadata } from "next";

/**
 * Canonical addressing for a site that answers to two hostnames.
 *
 * The storefront is served from NEXT_PUBLIC_SALES_HOST and the app from
 * NEXT_PUBLIC_SITE_URL, but they are one deployment. Every storefront route is
 * therefore reachable at two addresses, which is exactly the duplicate-content
 * situation canonical URLs exist to collapse.
 */

/**
 * Reads an env var, treating a blank value as absent.
 *
 * `??` is not enough. `.env.example` ships `NEXT_PUBLIC_SITE_URL=` with nothing
 * after the equals, so a fresh clone has the variable *set* to an empty string
 * rather than undefined. Nullish coalescing would sail straight past that and
 * hand an empty string to `new URL`, which throws and takes the whole build
 * down with a stack pointing at generated code.
 */
function envOr(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

/** The app's own origin. Also the Paystack callback origin. */
export const SITE_ORIGIN = envOr("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/**
 * Where the storefront is meant to be indexed.
 *
 * Falls back to the app origin when no sales host is configured, which is the
 * local case: with the variable unset the proxy does no rewriting at all, so
 * canonical URLs should keep pointing at the address actually being served
 * rather than at a domain that does not resolve.
 */
export const SALES_ORIGIN = process.env.NEXT_PUBLIC_SALES_HOST?.trim()
  ? `https://${process.env.NEXT_PUBLIC_SALES_HOST.trim()}`
  : SITE_ORIGIN;

const TITLE = "Money Mastery Code";
const DESCRIPTION =
  "Eight recorded lectures on making money, managing what you earn, and putting it to work. Budgeting, debt, tracking, gold, stocks and Treasury bills, taught from zero. From N15,000.";

const OG_ALT =
  "Money Mastery Code — make money, manage money, multiply money. Eight recorded lectures, from N15,000.";

/**
 * The generated card lives at /money-mastery-code/opengraph-image, rendered by
 * opengraph-image.tsx in that directory.
 *
 * Referenced explicitly rather than left to the file convention. The route is
 * generated and served correctly either way, but relying on the convention to
 * attach it to a parent layout's children did not emit the tag, and a
 * storefront card is the one asset where a silent miss costs real traffic.
 */
const OG_PATH = "/money-mastery-code/opengraph-image";

/**
 * Whether the storefront may be indexed.
 *
 * Off while the A/B test is running. Every root visit is served one of two
 * pages at random, so a crawler with no cookie would see a different page on
 * every visit and could index either one against the address you would rather
 * rank.
 *
 * Flip this to true once a winner is chosen AND TEST_VARIANTS in src/proxy.ts
 * is pinned to that single page. Do one without the other and you either serve
 * a random page on a stable URL, or index a URL that is no longer what most
 * visitors see.
 */
const STOREFRONT_INDEXABLE = false;

/**
 * Metadata shared by all three storefront variants.
 *
 * They are the same product at three positions in the test, so all three
 * canonicalise to the one storefront URL rather than competing with each
 * other. The three are kept indexable-separately only after the test resolves,
 * at which point two of them are deleted anyway.
 */
export function storefrontMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: SALES_ORIGIN,
    },
    robots: STOREFRONT_INDEXABLE
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: SALES_ORIGIN,
      title: `${TITLE} | Make money. Manage money. Multiply money.`,
      description: DESCRIPTION,
      siteName: TITLE,
      locale: "en_NG",
      images: [
        { url: OG_PATH, width: 1200, height: 630, alt: OG_ALT },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${TITLE} | Make money. Manage money. Multiply money.`,
      description: DESCRIPTION,
      images: [OG_PATH],
    },
  };
}