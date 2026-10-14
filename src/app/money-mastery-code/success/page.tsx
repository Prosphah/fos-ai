import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  TriangleAlert,
} from "lucide-react";

import { getCourseAccessUrl, getTier } from "@/lib/money-mastery";
import { verifyTransaction } from "@/lib/paystack";

export const metadata: Metadata = {
  title: "You are enrolled | Money Mastery Code",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ reference?: string }>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16 font-sans">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}

function BackToPricing() {
  return (
    <Link
      href="/money-mastery-code#pricing"
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
  const accessUrl = getCourseAccessUrl();

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
            You are enrolled.
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
                The recording link is on its way to {transaction.email}. If it has
                not arrived within a few minutes, check your spam folder, then email
                me and I will resend it.
              </p>
            </div>
          </div>

          {accessUrl ? (
            <a
              href={accessUrl}
              target="_blank"
              rel="noreferrer"
              className="sales-focus flex items-center justify-center gap-2 rounded-full px-6 py-4 text-[15px] font-semibold transition hover:-translate-y-0.5"
              style={{
                background: "var(--sales-accent)",
                color: "var(--sales-accent-contrast)",
              }}
            >
              Open your lectures
              <ArrowRight size={17} />
            </a>
          ) : null}

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
          you came for the investing content. Email me any time in the first 180
          days, including if you decide it was not for you.
        </p>

        <div className="mt-9 text-center">
          <BackToPricing />
        </div>
      </div>
    </Shell>
  );
}