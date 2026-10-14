import type { ReactNode } from "react";

export default function MoneyMasteryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="sales-root min-h-screen font-sans">{children}</div>
  );
}