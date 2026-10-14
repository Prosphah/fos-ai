"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type Faq = {
  q: string;
  a: string;
};

/**
 * The FAQ as a compact accordion: one question open at a time so the
 * section no longer reads as a wall of Q&A. Content stays in the DOM
 * for search engines; the collapse is height-only.
 */
export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null);

  return (
    <div>
      {items.map((faq, index) => {
        const isOpen = open === index;

        return (
          <div
            key={faq.q}
            className="border-b"
            style={{ borderColor: "var(--mm-line)" }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="sales-focus flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
                {faq.q}
              </h3>
              <span
                aria-hidden
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[20px] font-medium transition duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  color: "var(--sales-accent)",
                  background: "var(--sales-accent-soft)",
                  transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                <Plus size={16} />
              </span>
            </button>

            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="min-h-0">
                <p
                  className="max-w-[52ch] pb-6 text-[14px] leading-7"
                  style={{ color: "var(--sales-text-2)" }}
                >
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}