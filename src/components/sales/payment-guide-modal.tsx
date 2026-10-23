"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ArrowRight, X } from "lucide-react";

/**
 * The payment-method guide shown before the Flutterwave redirect.
 *
 * Flutterwave opens its checkout on Bank Transfer, and a buyer who wants to
 * pay by card or USSD has to find the small "Change payment method" link first.
 * This shows the two screenshots of that flow up front, so the buyer arrives
 * knowing where to look instead of abandoning the payment page.
 *
 * It is a step in the checkout, not a warning: the "Okay, I got it" CTA is what
 * actually starts the payment, so nothing is requested until it is pressed.
 * Closing (X, backdrop, or Escape) abandons the attempt and leaves the form
 * exactly as it was.
 */

const STEPS = [
  {
    src: "/checkout-guide/flw-guide-1.jpeg",
    width: 720,
    height: 1156,
    alt: 'Flutterwave\'s bank transfer screen, with the "Change payment method" text at the bottom highlighted by a green rectangle',
    caption:
      "To change your payment method, click the text in the rectangle as seen in this image below",
  },
  {
    src: "/checkout-guide/flw-guide-2.jpeg",
    width: 720,
    height: 1419,
    alt: 'Flutterwave\'s "How would you like to pay?" list of payment methods, with an arrow pointing at Bank Transfer',
    caption: "Choose whatever payment method you prefer",
  },
] as const;

export function PaymentGuideModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  // Escape closes the guide. It must not start the checkout: the CTA is the
  // only thing that spends money, and a stray key should not.
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // The page behind the overlay should not scroll while the guide is up. The
  // previous value is restored rather than assumed, so this cannot clobber a
  // lock some other component set.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-guide-title"
      className="fixed inset-0 z-[80] flex items-center justify-center px-3 py-4 sm:px-5"
    >
      <button
        type="button"
        aria-label="Close the payment guide"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
      />

      <div className="sales-card relative max-h-[94vh] w-full max-w-md overflow-y-auto rounded-3xl p-5 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="sales-focus absolute right-4 top-4 rounded-full p-1.5 transition-colors"
          style={{ color: "var(--sales-text-2)" }}
        >
          <X size={18} />
        </button>

        <h2
          id="payment-guide-title"
          className="pr-10 text-[19px] font-semibold tracking-tight"
        >
          Choosing how you pay
        </h2>
        <p
          className="mt-2 text-[13.5px] leading-6"
          style={{ color: "var(--sales-text-2)" }}
        >
          The payment page opens on Bank Transfer. If you would rather pay
          another way, here is how to switch before you pay.
        </p>

        <ol className="mt-5 space-y-5">
          {STEPS.map((step, index) => (
            <li key={step.src}>
              <p className="flex gap-2.5 text-[13.5px] font-medium leading-6">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: "var(--sales-accent)",
                    color: "var(--sales-accent-contrast)",
                  }}
                >
                  {index + 1}
                </span>
                <span>{step.caption}</span>
              </p>

              <div
                className="mt-3 overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--sales-border)" }}
              >
                <Image
                  src={step.src}
                  alt={step.alt}
                  width={step.width}
                  height={step.height}
                  sizes="(min-width: 640px) 384px, 90vw"
                  className="h-auto w-full"
                />
              </div>
            </li>
          ))}
        </ol>

        {/* Sticky, because the two portrait screenshots together are taller
            than a phone: the CTA has to stay reachable without scrolling back
            down through images the buyer has already seen. */}
        <div
          className="sticky bottom-0 -mx-5 mt-6 border-t px-5 pb-1 pt-4 sm:-mx-7 sm:px-7"
          style={{
            background: "var(--sales-surface)",
            borderColor: "var(--sales-border)",
          }}
        >
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="sales-focus flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-semibold transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
            style={{
              background: "var(--sales-accent)",
              color: "var(--sales-accent-contrast)",
            }}
          >
            Okay, I got it
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
