export type CourseTier = "course" | "course_fosai";

/**
 * Storefront variant -> the route that renders it. Mirrors VARIANT_ROUTES in
 * src/proxy.ts, which is what makes the sales hostname serve these paths.
 */
export type StorefrontVariant = "a" | "b" | "c";

const VARIANT_ROUTES: Record<StorefrontVariant, string> = {
  a: "/money-mastery-code/v1",
  b: "/money-mastery-code/v2",
  c: "/money-mastery-code/v3",
};

export type TierConfig = {
  id: CourseTier;
  name: string;
  tagline: string;
  /** Amount in kobo. */
  amount: number;
  displayPrice: string;
  features: string[];
  featured: boolean;
  badge?: string;
  note: string;
};

export const COURSE_TIERS: TierConfig[] = [
  {
    id: "course",
    name: "Money Mastery Code",
    tagline: "The course",
    amount: 1_500_000,
    displayPrice: "\u20a615,000",
    features: [
      "All 8 recorded lectures, about 1 hour each",
      "The Money Making, Management and Multiplication codes",
      "Course slides for quick reference on every lecture",
      "The Selling Code bonus module",
      "Access to the support WhatsApp community",
      "Future updates to the course, at no extra cost",
      "Lifetime access to the course material",
    ],
    featured: false,
    note: "One payment. Yours for good.",
  },
  {
    id: "course_fosai",
    name: "Money Mastery Code + FOS\u00b7AI",
    tagline: "The complete system",
    amount: 2_300_000,
    displayPrice: "\u20a623,000",
    features: [
      "Everything in the course",
      "Permanent FOS\u00b7AI access, the financial operating system behind the principles",
      "Accounts, transactions and budgets in one workspace",
      "A financial health score built from your own numbers",
      "All 9 calculators, from compound interest to PAYE",
      "AI stock research on NGX and US markets",
      "Every FOS\u00b7AI capability released from now on, at no extra cost",
    ],
    featured: true,
    badge: "Most complete",
    note: "The course teaches it. FOS\u00b7AI is where you run it.",
  },
];

export function getTier(id: string | null | undefined): TierConfig | undefined {
  if (!id) return undefined;
  return COURSE_TIERS.find((tier) => tier.id === id);
}

export function formatNaira(amountInKobo: number): string {
  return `\u20a6${(amountInKobo / 100).toLocaleString("en-NG")}`;
}

/**
 * An amount in kobo as the number a platform expects to read.
 *
 * Prices are held in kobo because that is what Paystack is denominated in,
 * but every advertising and analytics API is denominated in major units: a
 * tier stored as 1_500_000 is 15000 to them. Getting this wrong reports
 * revenue a hundred times too large, which is a mistake no dashboard flags
 * for you.
 */
export function majorUnits(amountInKobo: number): number {
  return amountInKobo / 100;
}

/**
 * The gift price: 20% off the list price, in kobo.
 *
 * Computed from the tier rather than stored as a second constant so the two
 * prices cannot drift apart. The gift page renders it next to the original,
 * the checkout route charges it, and the fulfilment guard expects it — all
 * three read this one function.
 */
export function giftAmount(amountInKobo: number): number {
  return Math.round(amountInKobo * 0.8);
}

/**
 * A client-supplied variant, whitelisted rather than passed through.
 *
 * The value lands in Paystack metadata and then in enrollments.source_variant,
 * so it must never be an arbitrary string off the wire. Unrecognised values
 * become null rather than being guessed at, which is also what "control" — the
 * value the checkout route records when the client sent nothing usable —
 * resolves to.
 */
export function asStorefrontVariant(
  value: unknown,
): StorefrontVariant | null {
  return value === "a" || value === "b" || value === "c" ? value : null;
}

/**
 * Where buyers are sent to watch the lectures.
 *
 * The recordings live on Google Drive. Set COURSE_ACCESS_URL once the folder is
 * fronted by a custom domain.
 *
 * Currently unreferenced: access is granted by hand, so the success page asks
 * the buyer to message rather than handing out a link anyone could forward.
 * Kept because the moment a direct link is wanted again it is one line, and
 * the env var is already set.
 */
export function getCourseAccessUrl(): string | null {
  const value = process.env.COURSE_ACCESS_URL?.trim();
  return value ? value : null;
}

/**
 * A WhatsApp deep link that opens a conversation with the message already
 * typed out.
 *
 * NEXT_PUBLIC_WHATSAPP_NUMBER is the instructor's number in international
 * format. wa.me does not accept a leading `+`, a space or a dash, so the value
 * is stripped to digits rather than trusted: a number pasted as "+234 801 234
 * 5678" is the obvious way to write it and it produces a dead link if taken
 * verbatim.
 *
 * Returns null when the number is unset so a caller can fall back to email
 * rather than rendering a button that opens nothing.
 */
export function getWhatsAppUrl(message: string): string | null {
  const digits = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");

  return digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : null;
}

/**
 * The storefront root, for a buyer who needs to go back to the sales page.
 *
 * `/money-mastery-code` is not a route: only the three variant directories
 * under it are, so linking there answers 404 — which is exactly what a buyer
 * returning from Paystack sees first.
 *
 * `sourceVariant` is the value the purchase was attributed to, and it decides
 * where the link goes when there is no sales host:
 *
 *   - On the sales hostname the root *is* the storefront. src/proxy.ts
 *     rewrites it onto whichever variant the `mmc_variant` cookie pinned, so
 *     this is where a "back to the sales page" link belongs.
 *   - In local development no rewriting happens, and there is no storefront
 *     route at all, so the variant recorded against the purchase is used
 *     rather than dropping the buyer on the app's home page.
 */
export function getStorefrontUrl(sourceVariant?: string): string {
  const host = process.env.NEXT_PUBLIC_SALES_HOST?.trim();

  if (host) return `https://${host}/`;

  const variant = asStorefrontVariant(sourceVariant);

  return variant ? VARIANT_ROUTES[variant] : VARIANT_ROUTES.c;
}

/**
 * The storefront address a specific variant lives at, for platforms that want
 * a landing page recorded against a conversion.
 *
 * This exists because a completed purchase is reported to TikTok from the
 * server, where there is no browser to read a URL off. Without it the
 * conversion arrives with no page attached and TikTok has nowhere to file it
 * in the landing page breakdown.
 *
 * Falls back to the storefront root when the variant is unknown, which is what
 * "control" means here: a sale made from a page we could not name.
 */
export function getStorefrontVariantUrl(sourceVariant?: string): string {
  const host = process.env.NEXT_PUBLIC_SALES_HOST?.trim();
  const variant = asStorefrontVariant(sourceVariant);

  if (!host) return variant ? VARIANT_ROUTES[variant] : VARIANT_ROUTES.c;

  // src/proxy.ts reads a bare single-letter path as a forced variant, so this
  // is a real, shareable address. Pointing at the root instead would be
  // re-rolling the dice on whoever clicks it.
  return variant ? `https://${host}/${variant}` : `https://${host}/`;
}

/**
 * The section of each variant that holds the checkout forms, for returning a
 * buyer who did not complete a payment to the exact place they left from.
 *
 * v2 has no anchor because its pricing block does not carry an id; a variant
 * whose page is later given one can be added here in a line.
 */
const VARIANT_RESUME_ANCHORS: Record<StorefrontVariant, string> = {
  a: "#pricing",
  b: "",
  c: "#options",
};

/**
 * Where to send a buyer who abandoned or cancelled a payment.
 *
 * The variant is preferred over the address the browser happens to be on: the
 * buyer may have opened checkout from a forced /c link while carrying an older
 * cookie, and the recorded purchase is the one they were shown. With no
 * variant at all this falls back to the storefront root, which is the same
 * place "Back to Money Mastery Code" goes.
 */
export function getStorefrontResumeUrl(sourceVariant?: string): string {
  const variant = asStorefrontVariant(sourceVariant);
  if (!variant) return getStorefrontUrl();

  return `${getStorefrontVariantUrl(variant)}${VARIANT_RESUME_ANCHORS[variant]}`;
}
