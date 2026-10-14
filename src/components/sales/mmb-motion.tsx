"use client";

/**
 * Motion leaves for the Money Mastery Code variant B storefront.
 *
 * Everything here is an isolated client island. The page itself stays a
 * Server Component and ships static HTML; only these four leaves hydrate.
 *
 * Two rules drive the implementation:
 *
 * 1. Never a window scroll listener. Scroll progress and the sticky CTA read
 *    `useScroll()` motion values, which run outside React's render cycle.
 *    The only `setState` here fires on a threshold *crossing*, not on every
 *    frame.
 * 2. Every effect collapses under `prefers-reduced-motion`. Reveals resolve to
 *    their resting state, counters jump to the final number, the progress bar
 *    hides, and the sticky CTA is still reachable (it just never animates).
 */

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Reveal ──────────────────────────────────────────────────────── */

/**
 * Enters once when scrolled into view. The workhorse: sections, cards, list
 * rows and pull quotes all wrap in this rather than each carrying its own
 * observer.
 */
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className = "",
  style,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "p" | "h2" | "h3" | "li" | "span" | "figure" | "blockquote";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    // No motion, but keep the exact same element and box.
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/**
 * A grid item that enters with a stagger.
 *
 * Deliberately self-contained rather than a variants child of a RevealGroup.
 * Variant propagation through a `whileInView` parent left the whole grid
 * parked at `opacity: 0`, so each item owns its own trigger and takes its
 * delay from `index`. Slower to write, but it cannot silently vanish.
 */
export function RevealItem({
  children,
  index = 0,
  stagger = 0.06,
  className = "",
  style,
  as = "div",
}: {
  children: ReactNode;
  index?: number;
  stagger?: number;
  className?: string;
  style?: CSSProperties;
  as?: "div" | "li" | "figure" | "article" | "span" | "p";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay: index * stagger, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

/* ── CountUp ─────────────────────────────────────────────────────── */

/**
 * Counts from zero to `value` the first time it scrolls into view. Rendered as
 * text only, so the final number is in the HTML for crawlers either way.
 */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  // Null until the animation starts. Reduced-motion never sets it, so the
  // final number is simply derived rather than pushed through an effect.
  const [animated, setAnimated] = useState<number | null>(null);
  const shown = animated ?? (reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;

    const controls = animate(0, value, {
      duration: 0.9,
      ease: EASE,
      onUpdate: (latest) => setAnimated(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref}>{shown}{suffix}</span>
  );
}

/* ── Scroll progress ─────────────────────────────────────────────── */

/** The 6px tri-colour bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="mmb-progress"
      style={{ scaleX, transformOrigin: "left center" }}
    />
  );
}

/* ── Sticky CTA ──────────────────────────────────────────────────── */

/**
 * The floating enrol button.
 *
 * Two conditions, both deliberate:
 *  - It appears only after the reader is past the hero, so it never competes
 *    with the hero's own ask.
 *  - It disappears while the package cards are on screen, because those cards
 *    already contain the checkout form. Two identical asks on screen at once
 *    is the thing this avoids.
 *
 * Scroll position comes from a motion value. `useMotionValueEvent` fires per
 * frame, but the setState below is guarded by the previous value, so React
 * re-renders only on the two frames where the answer actually changes.
 */
export function StickyCta({ href, label }: { href: string; label: string }) {
  const { scrollY } = useScroll();
  const [pastHero, setPastHero] = useState(false);
  const [atPackages, setAtPackages] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > window.innerHeight * 0.8;
    setPastHero((current) => (current === next ? current : next));
  });

  useEffect(() => {
    const packages = document.getElementById("packages");
    if (!packages) return;

    const observer = new IntersectionObserver(
      ([entry]) => setAtPackages(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(packages);

    return () => observer.disconnect();
  }, []);

  const visible = pastHero && !atPackages;

  return (
    <a
      id="stk"
      href={href}
      tabIndex={visible ? undefined : -1}
      aria-hidden={!visible}
      className="mmb-sticky-cta"
      style={{
        transform: visible ? "translateY(0)" : "translateY(160%)",
        opacity: visible ? 1 : 0,
        transition:
          "transform .35s cubic-bezier(.16,1,.3,1), opacity .2s linear",
      }}
    >
      {label}
    </a>
  );
}