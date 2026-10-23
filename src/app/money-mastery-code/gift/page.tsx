import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, Check, Gift } from "lucide-react";

import { GiftCheckoutForm } from "@/components/sales/gift-checkout-form";
import {
  COURSE_TIERS,
  asStorefrontVariant,
  formatNaira,
  getStorefrontUrl,
  giftAmount,
  type TierConfig,
} from "@/lib/money-mastery";
import { getPaymentProviderName } from "@/lib/payment-registry";

export const metadata: Metadata = {
  title: "Gift the Money Mastery Code",
  description:
    "Give someone the Money Mastery Code workshop for 20% less. Their access is emailed to them the moment the payment is confirmed.",
  // A transactional page carrying a standing discount. It should reach the
  // people sent here, not compete with the sales pages in search.
  robots: { index: false, follow: true },
};

const container = "mx-auto w-full max-w-5xl px-5 lg:px-8";

/**
 * One gifter's option.
 *
 * The list price is shown struck through beside the gift price rather than
 * replaced by it: the buyer needs to see the discount to trust it, and the
 * strike is the same ₦15,000 / ₦23,000 the sales page quotes.
 */
function GiftOption({
  tier,
  featured,
  provider,
  variant,
}: {
  tier: TierConfig;
  featured: boolean;
  provider: "paystack" | "flutterwave";
  variant?: "a" | "b" | "c";
}) {
  const price = formatNaira(giftAmount(tier.amount));

  const cardStyle = featured
    ? {
        background: "#171a13",
        borderColor: "var(--sales-accent)",
        boxShadow:
          "0 0 0 1px rgba(213,255,101,0.28), 0 26px 64px -26px rgba(213,255,101,0.42), 0 22px 50px rgba(23,26,19,0.16)",
      }
    : {
        background: "var(--sales-surface)",
        borderColor: "var(--sales-border)",
      };

  return (
    <article
      className={`flex flex-col rounded-[24px] p-7 sm:p-8 ${
        featured ? "border-2" : "border"
      }`}
      style={cardStyle}
    >
      {featured ? (
        <span
          className="self-start rounded-full px-2.5 py-1.5 text-[10px] font-black tracking-[0.04em]"
          style={{ background: "var(--sales-accent)", color: "#17190f" }}
        >
          COURSE + TOOLS
        </span>
      ) : null}

      <h2
        className={`text-[21px] font-black tracking-[-0.035em] ${
          featured ? "mt-3" : ""
        }`}
      >
        {tier.name}
      </h2>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[clamp(34px,4.6vw,46px)] font-black leading-[1.05] tracking-[-0.03em] tabular-nums">
          {price}
        </span>
        <span
          className="text-[15px] line-through"
          style={{ color: "var(--sales-text-3)" }}
        >
          {tier.displayPrice}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{
            background: "var(--sales-accent-soft)",
            color: "var(--sales-accent)",
          }}
        >
          20% off
        </span>
      </div>

      <p
        className="mt-3 text-[12.5px] leading-5"
        style={{ color: featured ? "#92988a" : "var(--sales-text-3)" }}
      >
        {tier.tagline}. Bought as a gift.
      </p>

      <ul
        className="mt-7 space-y-2.5 border-t pt-6 text-[13px]"
        style={{
          borderColor: featured ? "var(--mm-line)" : "var(--sales-border)",
          color: featured ? "#b8bcb1" : "var(--sales-text-2)",
        }}
      >
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-2.5">
            <Check
              size={15}
              strokeWidth={3}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--sales-accent)" }}
            />
            <span className="leading-6">{feature}</span>
          </li>
        ))}
      </ul>

      <GiftCheckoutForm
        tier={tier}
        label={`Gift it for ${price}`}
        provider={provider}
        variant={variant}
      />
    </article>
  );
}

export default async function GiftPage() {
  const course = COURSE_TIERS.find((t) => t.id === "course") ?? COURSE_TIERS[0];
  const bundle = COURSE_TIERS.find((t) => t.featured) ?? COURSE_TIERS[1];

  // The buyer arrived from one of the variants, so the sale is attributed to
  // whichever page they were shown; "control" when no cookie exists.
  const provider = getPaymentProviderName();
  const variant =
    asStorefrontVariant((await cookies()).get("mmc_variant")?.value) ?? undefined;

  return (
    <div className="font-sans text-[#f4f3eb]">
      <main className={`${container} py-14 lg:py-20`}>
        <Link
          href={getStorefrontUrl(variant)}
          className="sales-focus inline-flex items-center gap-2 text-[13px] font-medium"
          style={{ color: "var(--sales-text-2)" }}
        >
          <ArrowLeft size={15} />
          Back to Money Mastery Code
        </Link>

        <header className="mt-8 max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-black uppercase tracking-[0.12em]"
            style={{
              background: "var(--sales-accent-soft)",
              color: "var(--sales-accent)",
            }}
          >
            <Gift size={13} />
            Gift it · 20% off
          </span>

          <h1 className="mt-5 text-[clamp(34px,5.4vw,54px)] font-black leading-[1.03] tracking-[-0.03em]">
            Give someone the Money Mastery Code.
          </h1>

          <p
            className="mt-5 text-[16px] leading-8"
            style={{ color: "var(--sales-text-2)" }}
          >
            You pay the gift price. Their access — and, with the bundle, their
            own FOS·AI account — is sent to the email you enter below. Nothing
            else needs setting up, on your side or theirs.
          </p>
        </header>

        <div className="mt-12 grid items-start gap-5 lg:grid-cols-2">
          <GiftOption
            tier={course}
            featured={false}
            provider={provider}
            variant={variant}
          />
          <GiftOption
            tier={bundle}
            featured
            provider={provider}
            variant={variant}
          />
        </div>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--sales-border)",
              background: "var(--sales-surface)",
            }}
          >
            <p className="text-[14px] font-semibold">When do they find out?</p>
            <p
              className="mt-1.5 text-[13.5px] leading-6"
              style={{ color: "var(--sales-text-2)" }}
            >
              As soon as your payment is confirmed, their access details are
              emailed to them. Tell them to check their inbox after you pay —
              and their spam folder, just in case.
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--sales-border)",
              background: "var(--sales-surface)",
            }}
          >
            <p className="text-[14px] font-semibold">
              What if they already use FOS·AI?
            </p>
            <p
              className="mt-1.5 text-[13.5px] leading-6"
              style={{ color: "var(--sales-text-2)" }}
            >
              The bundle is linked to the FOS·AI account that already exists
              for their address. No second account, no invitation to accept —
              they just keep signing in as usual.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
