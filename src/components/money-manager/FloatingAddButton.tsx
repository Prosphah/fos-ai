"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RecordTransactionSheet } from "./RecordTransactionSheet";

export function FloatingAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center justify-center lg:bottom-8 lg:right-8 bottom-24 right-4"
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, var(--accent), #6D28D9)",
          color: "#fff",
          boxShadow: "0 4px 24px var(--accent-glow), 0 0 0 1px rgba(139, 92, 246, 0.3)",
          transition: "transform 0.25s var(--ease), box-shadow 0.25s var(--ease)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.boxShadow = "0 6px 32px var(--accent-glow), 0 0 0 1px rgba(139, 92, 246, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 24px var(--accent-glow), 0 0 0 1px rgba(139, 92, 246, 0.3)";
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
        aria-label="Record transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <RecordTransactionSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
