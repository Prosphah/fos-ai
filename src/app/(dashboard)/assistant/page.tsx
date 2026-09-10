import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function AssistantPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto", width: "100%" }}>
        <Link
          href="/briefing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-3)",
            fontSize: "0.8125rem",
            textDecoration: "none",
            marginBottom: "28px",
          }}
        >
          <ArrowLeft size={15} />
          Back to briefing
        </Link>

        <section
          style={{
            minHeight: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "40px 24px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              marginBottom: "24px",
            }}
          >
            <MessageCircle size={32} />
          </div>
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--accent)",
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={13} />
            Coming soon
          </p>
          <h1
            style={{
              marginTop: "10px",
              color: "var(--text-1)",
              fontFamily: "var(--font-display-family)",
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            Ask Coach
          </h1>
          <p
            style={{
              maxWidth: "420px",
              marginTop: "12px",
              color: "var(--text-2)",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
            }}
          >
            Your personal finance guide is being prepared. Soon you&apos;ll be able
            to ask questions and get practical guidance grounded in your goals.
          </p>
        </section>
      </div>
    </AppShell>
  );
}