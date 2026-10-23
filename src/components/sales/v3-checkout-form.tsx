"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { PaymentGuideModal } from "@/components/sales/payment-guide-modal";
import { majorUnits, type TierConfig } from "@/lib/money-mastery";
import { trackTikTokEvent } from "@/lib/tiktok";

type Status = "idle" | "loading" | "error";

/**
 * v3 checkout.
 *
 * Same /api/checkout endpoint as the other two storefront variants, so the
 * payment provider, the webhook and the enrollments table are untouched. Only the
 * surface is new: variant C's ground is forest green with a volt-lime
 * call to action, and neither the near-black palette of variant A nor
 * variant B's mint is available here to inherit.
 *
 * Two things are deliberate:
 *
 * 1. `variant: "c"`, so a sale made here is attributable to this page the
 *    same way "a" and "b" are. The route whitelists it; an unrecognised
 *    value would be stored as null and quietly pool into the control.
 * 2. The inputs sit above the button rather than beside it. Both price
 *    cards stack to full width on a phone, and a side-by-side row leaves the
 *    fields about half the width of the card, which is where people give up on
 *    typing.
 */
export function CheckoutForm({
  tier,
  label,
  variant = "c",
  provider,
}: {
  tier: TierConfig;
  label: string;
  variant?: "a" | "b" | "c";
  /**
   * The payment provider the checkout route will use, decided on the server.
   * The pre-checkout guide is Flutterwave-specific, so it is shown only when
   * that is the active provider.
   */
  provider?: "paystack" | "flutterwave";
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const showPaymentGuide = provider === "flutterwave";

  async function beginCheckout() {
    setStatus("loading");
    setError("");

    // Fallback for previews and direct /v3 visits, where the proxy does not
    // run and therefore never wrote the click id to a cookie.
    const ttclid =
      new URLSearchParams(window.location.search).get("ttclid") ?? undefined;

    // Fires here for the reason given in ../checkout-form.tsx: onSubmit only
    // runs on a valid submission, and the API round trip buys the pixel time to
    // send before the redirect tears the page down.
    trackTikTokEvent("InitiateCheckout", {
      currency: "NGN",
      value: majorUnits(tier.amount),
      content_type: "product",
      content_ids: [tier.id],
      content_name: tier.name,
      content_category: "education",
      quantity: 1,
      variant,
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tier.id, email, fullName, phone, ttclid, variant }),
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

  /**
   * The submit handler opens the guide; the CTA is what starts checkout.
   *
   * See ../checkout-form.tsx for the reasoning: onSubmit only fires on a valid
   * form, and closing the guide must leave no half-started payment behind.
   */
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

  return (
    <form onSubmit={startCheckout} style={{ marginTop: "auto" }}>
      {/* Name first, then email. Required, because it is what the enrolment
          and the invited FOS*AI account are identified by. It also goes first
          deliberately: browsers that autofill a name almost always fill the
          email alongside it, so the order decides how much typing is left. */}
      <label htmlFor={`v3-name-${tier.id}`} className="field-label">
        Your full name
      </label>

      <input
        id={`v3-name-${tier.id}`}
        type="text"
        required
        autoComplete="name"
        placeholder="Ada Lovelace"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        className="field"
      />

      <label
        htmlFor={`v3-email-${tier.id}`}
        className="field-label"
        style={{ marginTop: "0.9rem" }}
      >
        Where we send your access
      </label>

      <input
        id={`v3-email-${tier.id}`}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="field"
      />

      {/* Optional: see ../checkout-form.tsx for why this is not required. */}
      <label
        htmlFor={`v3-phone-${tier.id}`}
        className="field-label"
        style={{ marginTop: "0.9rem" }}
      >
        WhatsApp number{" "}
        <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
      </label>

      <input
        id={`v3-phone-${tier.id}`}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0803 123 4567"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        className="field"
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn btn--block"
        style={{ marginTop: "1rem" }}
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
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : (
        <p className="form-note">
          One payment by card, bank transfer or USSD. 180 days to change
          your mind.
        </p>
      )}

      {/* Fixed-positioned, so living inside the form costs nothing; see
          ../payment-guide-modal.tsx. */}
      <PaymentGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirm={confirmGuide}
      />
    </form>
  );
}