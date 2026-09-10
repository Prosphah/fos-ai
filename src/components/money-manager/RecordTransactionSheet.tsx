"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TransactionForm } from "./TransactionForm";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function RecordTransactionSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl border-t"
        style={{
          borderColor: "var(--glass-border)",
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <SheetHeader className="px-5 pt-3 pb-0">
          <SheetTitle style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-1)" }}>
            Record Transaction
          </SheetTitle>
          <SheetDescription style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>
            Track your income, expenses, or transfers
          </SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-5 pb-8 pt-2" style={{ maxHeight: "calc(85vh - 80px)" }}>
          <TransactionForm
            onSuccess={onClose}
            defaultType="expense"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
