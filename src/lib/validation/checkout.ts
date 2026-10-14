/**
 * Checkout input validation.
 *
 * These run on values that arrive from a public form and then travel through
 * Paystack metadata before landing in the database, so they are used on both
 * sides of that journey: at /api/checkout to reject bad input up front, and
 * again in the webhook so an unrecognised value cannot reach the database.
 */

/** Comfortably longer than any real name, and well inside Paystack's 500-character metadata value limit. */
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