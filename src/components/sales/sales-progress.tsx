"use client";

/**
 * Read-progress bar pinned to the top of the storefront.
 *
 * The page is long and the argument builds in order, so the reader should be
 * able to see how much of it is left. Position comes from a framer-motion
 * scroll value rather than a window scroll listener, which keeps this off
 * React's render path entirely — no setState, no re-render per frame.
 *
 * Hides entirely under prefers-reduced-motion: a bar that only tracks scroll
 * is decoration, and reduced-motion users have asked for less of it.
 */

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export function SalesProgressBar() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="sales-progress"
      style={{ scaleX, transformOrigin: "left center" }}
    />
  );
}