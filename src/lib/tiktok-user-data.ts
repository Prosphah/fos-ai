import crypto from "node:crypto";

/**
 * Normalisation for TikTok Advanced Matching.
 *
 * Server only. Uses node:crypto, so it cannot be imported from a client
 * component — the browser half receives an already-hashed value as a prop
 * instead. That is not a workaround: SHA-256 is deterministic, so hashing the
 * same address here and hashing it in the browser produce the same digest, and
 * one implementation is better than two that can drift.
 */

/**
 * Hashes a value the way TikTok's Events API expects it.
 *
 * The rules, which are not interchangeable and not all obvious:
 *
 *   - SHA-256, lowercase hex. TikTok compares digests, not addresses, so a
 *     digest that is uppercase or base64 matches nothing and fails silently.
 *   - No salt, and none may ever be added. Salting exists to make guessing a
 *     preimage expensive; here it would make the same person hash differently
 *     on the two devices they buy from, and TikTok would see two strangers.
 *
 * `normalise` is applied first because TikTok hashes the normalised form. Two
 * people who typed "Ada@Example.com" and "ada@example.com" are one buyer, and
 * this is the only place that knows they are the same.
 */
export function hashForTikTok(value: string, normalise: (v: string) => string): string {
  return crypto.createHash("sha256").update(normalise(value)).digest("hex");
}

/**
 * Email, in the form TikTok hashes it: trimmed and lowercased.
 *
 * Whitespace inside the address is left alone. A value with a space in it is
 * malformed, and quietly repairing it would mean sending TikTok an address the
 * buyer never typed.
 */
export function hashEmailForTikTok(email: string): string {
  return hashForTikTok(email, (value) => value.trim().toLowerCase());
}

/**
 * The anonymous visitor id, hashed for use as external_id.
 *
 * Hashed for the same reason the email is, with the same consequences: the
 * browser holds the raw id and TikTok only ever sees the digest. That is not
 * strictly necessary — the id is random and identifies nobody — but keeping one
 * rule for every field sent to TikTok means there is no case where a raw value
 * goes out by accident, which is the failure that would actually matter.
 */
export function hashVisitorIdForTikTok(visitorId: string): string {
  return hashForTikTok(visitorId, (value) => value.trim());
}

/**
 * Phone, in the form TikTok hashes it: digits only, in E.164.
 *
 * Kept for the day a phone number is collected. It is deliberately not wired to
 * anything today because no part of this codebase has ever asked a buyer for
 * one, and there is nothing to hash.
 *
 * If a phone field is added: strip everything that is not a digit, then treat
 * the result as needing a country code. A Nigerian number typed as
 * "0803 123 4567" and the same number as "+2348031234567" must produce one
 * digest, and only normalising to E.164 does that. Guessing the country from a
 * local prefix is how the same person ends up in the audience twice.
 */
export function normalisePhoneForTikTok(phone: string): string {
  return phone.replace(/\D/g, "");
}
