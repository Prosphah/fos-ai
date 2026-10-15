import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";

import {
  getStorefrontUrl,
  getTier,
  getWhatsAppUrl,
} from "@/lib/money-mastery";
import { verifyTransaction } from "@/lib/paystack";
import { parseFullName } from "@/lib/validation/checkout";

export const metadata: Metadata = {
  title: "You are enrolled | Money Mastery Code",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

/**
 * First name only, for the greeting.
 *
 * Paystack echoes back whatever the buyer typed, so this is a name of unknown
 * provenance rendered into a heading. Using only the first token limits how
 * much of it is echoed, and means a single stray comma or double space cannot
 * turn the greeting into a sentence. Falls back to null so the page drops to a
 * neutral heading rather than rendering something odd.
 */
function firstName(fullName: string | null): string | null {
  if (!fullName) return null;

  const [first] = fullName.split(" ");
  if (!first) return null;

  return first.length <= 40 ? first : null;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16 font-sans">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}

/**
 * Back to the sales page.
 *
 * The href is passed in by the enrolled state, which knows which variant the
 * buyer came from. The three states above a verified payment have no
 * transaction to read that from, so they fall back to the storefront root.
 */
function BackToPricing({ href = getStorefrontUrl() }: { href?: string }) {
  return (
    <Link
      href={href}
      className="sales-focus inline-flex items-center gap-2 text-[14px] font-medium"
      style={{ color: "var(--sales-accent)" }}
    >
      Back to Money Mastery Code
      <ArrowRight size={16} />
    </Link>
  );
}

export default async function SuccessPage({ searchParams }: PageProps) {
  const { reference } = await searchParams;

  if (!reference) {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            No payment reference found
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            If you just completed a payment, email me from the address you paid with
            and I will confirm your access manually.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  const transaction = await verifyTransaction(reference);

  if (!transaction) {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin"
            style={{ color: "var(--sales-accent)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Confirming your payment
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            This can take a few seconds. Refresh in a moment, and if nothing has
            changed in a minute, email me and I will sort it out.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  if (transaction.status !== "success") {
    return (
      <Shell>
        <div className="sales-card rounded-3xl p-9 text-center">
          <TriangleAlert
            size={30}
            className="mx-auto"
            style={{ color: "var(--sales-warn)" }}
          />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Payment not completed
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px] leading-7"
            style={{ color: "var(--sales-text-2)" }}
          >
            This transaction came through as {transaction.status}. If money left your
            account, email me with reference {transaction.reference} and I will check
            it straight away.
          </p>
          <div className="mt-8">
            <BackToPricing />
          </div>
        </div>
      </Shell>
    );
  }

  const tier = getTier(String(transaction.metadata?.tier ?? ""));

  // Read back out of Paystack rather than from anything the browser sent, so
  // the greeting matches the name recorded against the payment rather than
  // anything that could have been edited into the URL.
  const fullName = parseFullName(transaction.metadata?.full_name);
  const buyer = firstName(fullName);

  /* Access is granted by hand, so the page's job is to make that one message
   * easy to send and impossible to send incomplete. The reference is the part
   * that matters: it is the join key between this conversation and the
   * payment, so it goes in the composed message rather than being asked for in
   * a follow-up. */
  const requestMessage = [
    "Hi, I just paid for the Money Mastery Code.",
    fullName ? `My name is ${fullName}.` : null,
    `The email on the payment is ${transaction.email}.`,
    `Reference: ${transaction.reference}.`,
    "I'd like to request access to the lectures.",
  ]
    .filter(Boolean)
    .join(" ");

  // WhatsApp when a number is configured, email when one is not. A button
  // that opens nothing is the same as no button, and the buyer has just paid.
  const whatsappUrl = getWhatsAppUrl(requestMessage);
  const requestUrl =
    whatsappUrl ??
    `mailto:refunds@betiangli.xyz?subject=${encodeURIComponent(
      "Money Mastery Code — access request"
    )}&body=${encodeURIComponent(requestMessage)}`;

  return (
    <Shell>
      <div className="sales-card rounded-3xl p-8 sm:p-11">
        <div className="text-center">
          <CheckCircle2
            size={38}
            className="mx-auto"
            style={{ color: "var(--sales-accent)" }}
          />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">
            {buyer ? `Thank you, ${buyer}.` : "You are enrolled."}
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg text-[16px] leading-8"
            style={{ color: "var(--sales-text-2)" }}
          >
            Payment confirmed{tier ? ` for ${tier.name}` : ""}. Reference{" "}
            <span style={{ color: "var(--sales-text-1)" }}>{transaction.reference}</span>.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <div
            className="flex gap-4 rounded-2xl border p-5"
            style={{
              borderColor: "var(--sales-border)",
              background: "var(--sales-accent-softer)",
            }}
          >
            <GraduationCap size={20} className="mt-0.5 shrink-0" style={{ color: "var(--sales-accent)" }} />
            <div>
              <p className="text-[15px] font-semibold">Your lectures</p>
              <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                Every participant is granted access by me, and added to the community. Check your email for the access link, or message me
                using the button below and I will send you the access link, usually within 10 minutes and
                always the same day.
              </p>
            </div>
          </div>

          <a
            href={requestUrl}
            target={whatsappUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="sales-focus flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition hover:-translate-y-0.5"
            style={{
              background: "var(--sales-accent)",
              color: "var(--sales-accent-contrast)",
            }}
          >
            {whatsappUrl ? (
              <MessageCircle size={17} />
            ) : (
              <Mail size={17} />
            )}
            {whatsappUrl ? "Request access on WhatsApp" : "Request access by email"}
            <ArrowRight size={17} />
          </a>

          <p
            className="text-center text-[13px] leading-6"
            style={{ color: "var(--sales-text-3)" }}
          >
            Your name, email and reference go into the message, so there is
            nothing left to fill in.
          </p>

          {tier?.id === "course_fosai" ? (
            <div
              className="flex gap-4 rounded-2xl border p-5"
              style={{
                borderColor: "var(--sales-border)",
                background: "var(--sales-accent-softer)",
              }}
            >
              <Mail size={20} className="mt-0.5 shrink-0" style={{ color: "var(--sales-accent)" }} />
              <div>
                <p className="text-[15px] font-semibold">Your FOS·AI access</p>
                <p className="mt-1.5 text-[14px] leading-6" style={{ color: "var(--sales-text-2)" }}>
                  An invitation to create your account is on its way to{" "}
                  {transaction.email}. Accept it, set a password, and your workspace
                  is waiting.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <p
          className="mt-8 text-[13.5px] leading-7"
          style={{ color: "var(--sales-text-3)" }}
        >
          Watch the lectures in order. Start with the Money Management code even if
          you came for the investing content. Message or email me any time in the
          first 180 days, including if you decide it was not for you.
        </p>

        <div className="mt-9 text-center">
          <BackToPricing
            href={getStorefrontUrl(
              String(transaction.metadata?.source_variant ?? "")
            )}
          />
        </div>
      </div>
    </Shell>
  );
}