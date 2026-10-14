"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { AppLockProvider } from "@/components/app-lock-provider";

interface Props {
  children: ReactNode;
}

export function Providers({ children }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppLockProvider>{children}</AppLockProvider>
    </NextThemesProvider>
  );
}
