"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { PaymentGuideModal } from "@/components/sales/payment-guide-modal";
import { majorUnits, type TierConfig } from "@/lib/money-mastery";
import { trackTikTokEvent } from "@/lib/tiktok";

type Status = "idle" | "loading" | "error";

export function CheckoutForm({
  tier,
  label,
  tone = "dark",
  theme = "default",
  variant,
  provider,
}: {
  tier: TierConfig;
  label?: string;
  tone?: "dark" | "light";
  /**
   * "default" is the near-black variant A palette. "mmb" swaps the lime
   * accent for the variant B mint, and retints the light card's hard-coded
   * greys onto variant B's paper-and-ink tokens. Nothing else differs, so
   * both variants share one form and one checkout path.
   */
  theme?: "default" | "mmb";
  /** Which storefront page this purchase came from, for A/B attribution. */
  variant?: "a" | "b";
  /**
   * The payment provider the checkout route will use, decided on the server.
   * The guide is Flutterwave-specific, so it is shown only when that is the
   * active provider; switching the env var back to Paystack hides it with no
   * client change.
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

    /*
     * The proxy writes this into a cookie on the landing request, but the
     * proxy only runs on the sales hostname. Reading it from the URL here is
     * the fallback that keeps local previews and direct /v1 visits attributed
     * too. The server prefers its own cookie over this value.
     */
    const ttclid =
      new URLSearchParams(window.location.search).get("ttclid") ?? undefined;

    /*
     * InitiateCheckout, fired here rather than just before the redirect below.
     *
     * `onSubmit` only runs once the browser is satisfied both required fields,
     * so this counts real attempts and not button taps, and the API round trip
     * that follows leaves the pixel time to send before `window.location.href`
     * tears the page down. Firing it after the response instead would put the
     * event in the same moment as the navigation, and the navigation wins.
     */
    trackTikTokEvent("InitiateCheckout", {
      currency: "NGN",
      value: majorUnits(tier.amount),
      content_type: "product",
      content_ids: [tier.id],
      content_name: tier.name,
      content_category: "education",
      quantity: 1,
      ...(variant ? { variant } : {}),
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
      setError(caught instanceof Error ? caught.message : "Checkout could not start.");
    }
  }

  /**
   * The submit handler is the gate in front of the guide, not the request.
   *
   * onSubmit only fires once the browser is satisfied every required field is
   * filled, so the guide is never opened over an unfinished form — and closing
   * it leaves that form untouched, with no half-started checkout behind it.
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

  const light = tone === "light";
  const mmb = theme === "mmb";

  const accent = mmb ? "var(--mmb-g)" : "var(--sales-accent)";
  const accentContrast = mmb ? "#0a1411" : "var(--sales-accent-contrast)";

  // Variant B's paper ground is lighter than variant A's, so its helper text
  // needs a darker grey to hold 4.5:1.
  const quietTone = light ? (mmb ? "#3f463c" : "#64685d") : "var(--sales-text-3)";

  const labelStyle = {
    marginBottom: "8px",
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: quietTone,
  } as const;

  const inputStyle = light
    ? {
        background: "#ffffff",
        borderColor: mmb ? "var(--mmb-ink)" : "#c6cabe",
        borderWidth: mmb ? 2 : 1,
        color: "#171914",
      }
    : {
        background: mmb ? "rgba(255,255,255,0.06)" : "var(--sales-surface-hover)",
        borderColor: mmb ? "rgba(255,255,255,0.32)" : "var(--sales-border)",
        color: mmb ? "#ffffff" : "var(--sales-text-1)",
      };

  const inputClass =
    "sales-focus w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition-colors";

  return (
    <form onSubmit={startCheckout} className="mt-7">
      {/* Name first, then email. Required, because it is what the enrolment
          and the invited FOS*AI account are identified by. It also goes first
          deliberately: browsers that autofill a name almost always fill the
          email alongside it, so the order decides how much typing is left. */}
      <label htmlFor={`name-${tier.id}`} style={labelStyle}>
        Your full name
      </label>

      <input
        id={`name-${tier.id}`}
        type="text"
        required
        autoComplete="name"
        placeholder="Ada Lovelace"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <label
        htmlFor={`email-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        Where we send your access
      </label>

      <input
        id={`email-${tier.id}`}
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      {/* Optional on purpose. Every required field at checkout costs sales,
          and the email already carries access. The number is used to reach the
          buyer if email bounces and to improve TikTok's event matching, so it
          is worth asking for but not worth blocking a payment over. */}
      <label
        htmlFor={`phone-${tier.id}`}
        style={{ ...labelStyle, marginTop: "0.9rem" }}
      >
        WhatsApp number <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span>
      </label>

      <input
        id={`phone-${tier.id}`}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="0803 123 4567"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        className={inputClass}
        style={inputStyle}
      />

      <button
        type="submit"
        disabled={status === "loading"}
        className="sales-focus mt-3 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-semibold transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ background: accent, color: accentContrast }}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={17} className="animate-spin" />
            Opening secure checkout
          </>
        ) : (
          <>
            {label ?? (tier.featured ? "Get the course and FOS·AI" : "Get the course")}
            <ArrowRight size={17} />
          </>
        )}
      </button>

      {status === "error" ? (
        <p
          role="alert"
          className="mt-3 text-[13px] leading-5"
          style={{ color: light ? "#b45309" : "var(--sales-warn)" }}
        >
          {error}
        </p>
      ) : (
        <p
          className="mt-3 text-[12px] leading-5"
          style={{ color: quietTone }}
        >
          One payment by card, bank transfer or USSD. 180 days to change your mind.
        </p>
      )}

      {/* Inside the form rather than beside it so the guide travels with the
          component; it is fixed-positioned, so its DOM home does not affect
          where it lands on screen. */}
      <PaymentGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onConfirm={confirmGuide}
      />
    </form>
  );
}