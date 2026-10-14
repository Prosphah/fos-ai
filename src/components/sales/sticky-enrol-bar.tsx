"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Last-chance capture on mobile only.
 *
 * Deliberately not a persistent bar. It stays hidden until the reader has
 * scrolled past the pricing section, then follows them through the guarantee
 * and the FAQ, and gets out of the way again at the final call to action so
 * it never competes with another ask.
 *
 * It also hides whenever the guarantee is showing on screen, so the two
 * never sit on top of each other.
 */

const HIDE_IDS = ["mm-final", "mm-footer"];

export function StickyEnrolBar() {
  const [pastPricing, setPastPricing] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const pricing = document.getElementById("mm-pricing-done");
    if (pricing) {
      const observer = new IntersectionObserver(
        ([entry]) => setPastPricing(entry.isIntersecting),
        { threshold: 0 },
      );
      observer.observe(pricing);
      observers.push(observer);
    }

    for (const id of HIDE_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => setBlocked(entry.isIntersecting),
        { threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  const visible = pastPricing && !blocked;

  return (
    <div
      aria-hidden={!visible}
      className="mm-sticky-bar pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: visible ? "translateY(0)" : "translateY(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.3s linear",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          background: "color-mix(in srgb, var(--sales-bg) 92%, transparent)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderTop: "1px solid var(--sales-border)",
        }}
      >
        <div className="min-w-0">
          <p className="truncate text-[11px]" style={{ color: "var(--sales-text-3)" }}>
            Course and FOS·AI
          </p>
          <p className="font-display text-[17px] font-semibold tracking-tight tabular-nums">
            ₦23,000
          </p>
        </div>

        <a
          href="#pricing"
          tabIndex={visible ? undefined : -1}
          className="sales-focus ml-auto flex min-h-11 shrink-0 items-center gap-2 rounded-full px-5 text-[14px] font-semibold active:scale-[0.98]"
          style={{ background: "var(--sales-accent)", color: "var(--sales-accent-contrast)" }}
        >
          Enrol now
          <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}
