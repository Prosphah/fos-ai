"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/login");
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.875rem",
        color: "var(--text-3)",
        textDecoration: "none",
        marginBottom: "32px",
        border: "none",
        padding: 0,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}