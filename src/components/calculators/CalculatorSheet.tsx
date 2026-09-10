"use client";

import { type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { type LucideIcon } from "lucide-react";

interface CalculatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient?: string;
  iconShadow?: string;
  children: ReactNode;
}

export function CalculatorSheet({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconGradient = "linear-gradient(135deg, var(--accent), #4F3DC9)",
  iconShadow = "0 4px 16px var(--accent-glow)",
  children,
}: CalculatorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        centerOnDesktop
        showCloseButton
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(24px)",
        }}
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
              background: iconGradient,
              color: "#fff",
              boxShadow: iconShadow,
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
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
              {title}
            </SheetTitle>
            <SheetDescription
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-2)",
              }}
            >
              {description}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div
          className="scrollbar-thin"
          style={{
            padding: "0 20px 28px",
            maxHeight: "calc(85vh - 120px)",
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
