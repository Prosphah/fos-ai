"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { PaymentGuideModal } from "@/components/sales/payment-guide-modal";
import { giftAmount, majorUnits, type TierConfig } from "@/lib/money-mastery";
import { trackTikTokEvent } from "@/lib/tiktok";

type Status = "idle" | "loading" | "error";

/**
 * Gift checkout.
 *
 * Four fields, in two pairs, because two people are involved. The recipient's
 * name and email become the checkout's identity — the enrolment, the FOS*AI
 * invitation and the access email all go to them — while the payer's details
 * are what the payment receipt addresses and what support falls back to. The
 * two must not be conflated, which is why neither pair is inferred from the
 * other.
 *
 * Same /api/checkout endpoint as every other storefront form; the discount is
 * applied there, from the tier, so the price on the button and the charge can
 * never disagree.
 */
export function GiftCheckoutForm({
  tier,
  label,
  provider,
  variant,
}: {
  tier: TierConfig;
  label: string;
  /** The provider checkout will use, decided on the server. */
  provider?: "paystack" | "flutterwave";
  variant?: "a" | "b" | "c";
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const showPaymentGuide = provider === "flutterwave";
  const price = giftAmount(tier.amount);

  async function beginCheckout() {
    setStatus("loading");
    setError("");

    const ttclid =
      new URLSearchParams(window.location.search).get("ttclid") ?? undefined;

    // Reported at the gift price, and labelled so a gift sale is separable
    // from a full-price one in TikTok's breakdowns.
    trackTikTokEvent("InitiateCheckout", {
      currency: "NGN",
      value: majorUnits(price),
      content_type: "product",
      content_ids: [tier.id],
      content_name: `${tier.name} (gift)`,
      content_category: "education",
      quantity: 1,
      ...(variant ? { variant } : {}),
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tier.id,
          gift: true,
          giftRecipientName: recipientName,
          giftRecipientEmail: recipientEmail,
          purchaserName,
          purchaserEmail,
          ttclid,
          variant,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout could not start.");
      }

      window.location.href = payload.url;
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof Error ? caught.message : "Checkout could not start.",
      );
    }
  }

  /** See ../checkout-form.tsx: the guide gates the request, not the form. */
  function startCheckout(event: React.FormEvent) {
    event.preventDefault();

    if (showPaymentGuide) {
      setGuideOpen(true);
      return;
    }

    void beginCheckout();
  }

  function confirmGuide() {
    setGuideOpen(false);
    void beginCheckout();
  }

  const inputClass =
    "sales-focus w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition-colors";

  const inputStyle = {
    background: "var(--sales-surface-hover)",
    borderColor: "var(--sales-border)",
    color: "var(--sales-text-1)",
  } as const;

  const labelStyle = {
    marginBottom: "8px",
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "var(--sales-text-3)",
  } as const;

  const groupStyle = {
    marginTop: "1.6rem",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--sales-text-2)",
  } as const;

  return (
    <form onSubmit={startCheckout} className="mt-7">
      <p style={groupStyle}>1 · Who is it for?</p>

      <label
        htmlFor={`gift-recipient-name-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        Their full name
      </label>

      {/* Autocomplete is left off on the recipient's fields on purpose:
          browsers would happily fill the payer's own name and address into
          them, which is the exact mistake the two-field-pair layout exists to
          prevent. */}
      <input
        id={`gift-recipient-name-${tier.id}`}
        type="text"
        required
        autoComplete="off"
        placeholder="Ada Lovelace"
        value={recipientName}
        onChange={(event) => setRecipientName(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <label
        htmlFor={`gift-recipient-email-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        Their email — their access goes here
      </label>

      <input
        id={`gift-recipient-email-${tier.id}`}
        type="email"
        required
        autoComplete="off"
        inputMode="email"
        placeholder="them@example.com"
        value={recipientEmail}
        onChange={(event) => setRecipientEmail(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <p style={groupStyle}>2 · Your details</p>

      <label
        htmlFor={`gift-purchaser-name-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        Your full name
      </label>

      <input
        id={`gift-purchaser-name-${tier.id}`}
        type="text"
        required
        autoComplete="name"
        placeholder="Your name"
        value={purchaserName}
        onChange={(event) => setPurchaserName(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <label
        htmlFor={`gift-purchaser-email-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        Your email — your receipt goes here
      </label>

      <input
        id={`gift-purchaser-email-${tier.id}`}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={purchaserEmail}
        onChange={(event) => setPurchaserEmail(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="sales-focus mt-4 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-semibold transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: "var(--sales-accent)",
          color: "var(--sales-accent-contrast)",
        }}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Opening secure checkout
          </>
        ) : (
          <>
            {label}
            <ArrowRight size={17} />
          </>
        )}
      </button>

      {status === "error" ? (
        <p
          role="alert"
          className="mt-3 text-[13px] leading-5"
          style={{ color: "var(--sales-warn)" }}
        >
          {error}
        </p>
      ) : (
        <p
          className="mt-3 text-[12px] leading-5"
          style={{ color: "var(--sales-text-3)" }}
        >
          One payment by card, bank transfer or USSD. Their access is emailed
          as soon as the payment is confirmed.
        </p>
      )}

      <PaymentGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirm={confirmGuide}
      />
    </form>
  );
}
