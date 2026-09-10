"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Percent } from "lucide-react";
import { RoiCalculator } from "./RoiCalculator";

interface RoiCalculatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoiCalculatorSheet({ open, onOpenChange }: RoiCalculatorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        centerOnDesktop
        showCloseButton
        style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(24px)" }}
      >
        <SheetHeader className="flex flex-row items-center gap-3 p-5 pb-2">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--accent), #4F3DC9)",
              color: "#fff",
              boxShadow: "0 4px 16px var(--accent-glow)",
              flexShrink: 0,
            }}
          >
            <Percent size={20} />
          </div>
          <div className="flex flex-col gap-0.5">
            <SheetTitle
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.125rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
              }}
            >
              ROI Calculator
            </SheetTitle>
            <SheetDescription
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-2)",
              }}
            >
              Projecting how your investment could grow — just estimates, not
              financial advice.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="scrollbar-thin" style={{ padding: "0 20px 28px", maxHeight: "calc(85vh - 120px)", overflowY: "auto" }}>
          <RoiCalculator />
        </div>
      </SheetContent>
    </Sheet>
  );
}