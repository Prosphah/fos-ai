/**
 * Checkout input validation.
 *
 * These run on values that arrive from a public form and then travel through
 * payment metadata before landing in the database, so they are used on both
 * sides of that journey: at /api/checkout to reject bad input up front, and
 * again in the webhook so an unrecognised value cannot reach the database.
 */

/** Comfortably longer than any real name, and well inside both providers' metadata limits. */
export const FULL_NAME_MAX = 120;

/**
 * Normalises a buyer's full name, or returns null if it is not usable.
 *
 * Control characters and format characters (zero-width joiners, bidi
 * overrides) are stripped because they are invisible in a database row and in
 * a CSV export, and a name containing them breaks sorting and any later
 * rendering. Whitespace is collapsed so that "  Ada   Lovelace " and
 * "Ada Lovelace" are one value rather than two spellings of one person.
 *
 * Rejection is deliberate over truncation. An over-long name is a bug or an
 * attempt to inject one, and silently storing the first 120 characters would
 * produce a plausible-looking wrong name, which is worse than a missing one.
 *
 * Permissive about letters on purpose. Nigerian and international names carry
 * hyphens, apostrophes and non-Latin scripts; rejecting those would lock out
 * real buyers. Only structure is enforced, never the shape of a name.
 */
export function parseFullName(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const cleaned = value
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  // Requires at least one real letter, so that "", "!!!" and "---" are not
  // mistaken for a name.
  if (cleaned.length === 0 || !/\p{L}/u.test(cleaned)) return null;
  if (cleaned.length > FULL_NAME_MAX) return null;

  return cleaned;
}

/**
 * Normalises a phone number to E.164 digits, or returns null.
 *
 * Phone is optional — it exists for TikTok Advanced Matching and as a second
 * way to reach a buyer about access — so an unusable value is dropped rather
 * than failing the checkout.
 *
 * A leading 0 is read as Nigerian, which is the only market this storefront
 * sells in: "0803 123 4567" and "+234 803 123 4567" must produce one digest,
 * not two identities in TikTok's audience.
 */
export function parsePhoneForE164(value: unknown): string | null {
  if (typeof value !== "string") return null;

  let digits = value.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }

  // E.164 allows 8-15 digits; 10 is the shortest real Nigerian number with a
  // country code and guards against a partial entry being hashed as a person.
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}