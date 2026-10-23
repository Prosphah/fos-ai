"use client";

import { useEffect } from "react";

/**
 * Sends the browser back to the sales page after a short pause.
 *
 * Rendered alongside a manual link, never instead of one: a page that counts
 * down and then fails to move is worse than a page that simply offers a way
 * back. It is only mounted on states where no payment succeeded.
 *
 * `replace` rather than `assign` on purpose: the abandoned checkout URL is a
 * dead end, and replacing it means the back button does not return the buyer
 * to a page that would only bounce them again.
 *
 * The timer is cleared on unmount so a buyer who taps the manual link first
 * does not get a second navigation a moment later.
 */
export function AutoRedirect({
  href,
  delayMs = 4000,
}: {
  href: string;
  delayMs?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(href);
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [href, delayMs]);

  return null;
}
