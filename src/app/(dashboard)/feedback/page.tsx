"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { submitFeedback } from "@/app/actions/feedback";

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: "6px",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  minHeight: "44px",
};

const labelStyle = {
  fontSize: "0.8125rem",
  fontWeight: 600 as const,
  color: "var(--text-1)",
};

export default function FeedbackPage() {
  const [area, setArea] = useState("briefing");
  const [feedbackType, setFeedbackType] = useState("improvement");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setResult({});

    try {
      const response = await submitFeedback({ area, feedbackType, message });
      setResult(response);
      if (response.success) setMessage("");
    } catch {
      setResult({ error: "Could not submit feedback. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-text-primary">Feedback</h1>
        <p className="mt-2 text-base text-text-secondary">
          Tell us what is working, what is getting in the way, or what you want next.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          borderRadius: "var(--radius)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <div>
          <label htmlFor="feedback-area" style={labelStyle}>What part of FOS·AI is this about?</label>
          <select id="feedback-area" value={area} onChange={(event) => setArea(event.target.value)} style={inputStyle} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <option value="briefing">Briefing</option>
            <option value="money_manager">Money Manager</option>
            <option value="assistant">FOS AI assistant</option>
            <option value="tools">Tools and calculators</option>
            <option value="settings">Settings and account</option>
            <option value="other">Something else</option>
          </select>
        </div>

        <div>
          <label htmlFor="feedback-type" style={labelStyle}>What kind of feedback is this?</label>
          <select id="feedback-type" value={feedbackType} onChange={(event) => setFeedbackType(event.target.value)} style={inputStyle} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <option value="improvement">An improvement</option>
            <option value="feature_request">A feature request</option>
            <option value="bug">A problem or bug</option>
            <option value="other">Something else</option>
          </select>
        </div>

        <div>
          <label htmlFor="feedback-message" style={labelStyle}>Your feedback</label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What should we know?"
            rows={7}
            maxLength={4000}
            minLength={10}
            required
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <p style={{ marginTop: "6px", fontSize: "0.6875rem", color: "var(--text-3)", textAlign: "right" }}>
            {message.length}/4000
          </p>
        </div>

        {result.error && <p style={{ fontSize: "0.875rem", color: "var(--rose)" }}>{result.error}</p>}
        {result.success && <p style={{ fontSize: "0.875rem", color: "var(--mint)" }}>Thanks. Your feedback has been submitted.</p>}

        <button
          type="submit"
          disabled={submitting}
          style={{
            alignSelf: "flex-end",
            padding: "10px 24px",
            borderRadius: "var(--radius-sm)",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit feedback"}
        </button>
      </form>
    </AppShell>
  );
}