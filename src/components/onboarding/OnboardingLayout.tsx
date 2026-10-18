"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { LogoIcon } from "@/components/brand/LogoIcon";

interface Props {
  children: ReactNode;
}

export function OnboardingLayout({ children }: Props) {
  return (
    <main className="relative flex min-h-screen items-start justify-center px-4 py-8 min-[560px]:px-6 min-[560px]:py-12">
      <div className="relative z-10 w-full max-w-2xl">
        {/* Viewport variants here, not container ones. The query container is
            the div BELOW this card, so a @min-[] variant on the card or on
            main would have no container to measure against and would never
            apply. These are page gutters, which track the window anyway. */}
        <div className="w-full rounded-[26px] border border-outline bg-surface p-6 min-[560px]:rounded-[30px] min-[560px]:p-10">
          {/* The query container for every field breakpoint inside. Anchoring it
              to the content box means the layout responds to the width of the
              form, not the width of the browser window. */}
          <div className="@container">{children}</div>

          <div className="mt-7 flex flex-col items-center gap-2.5 px-2 text-center">
            <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
              We never sell your data. You can change anything later in Settings.
            </p>
            <Link
              href="/privacy"
              className="text-[12.5px] text-muted-foreground underline decoration-outline underline-offset-2 transition-colors hover:text-text-secondary"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export function OnboardingBrand() {
  return (
    <div className="mb-7 flex items-center gap-2.5">
      <div className="grid h-7 w-7 place-items-center rounded-[9px] bg-gradient-to-br from-accent to-[#4F3DC9] font-display text-sm font-extrabold text-white">
        <LogoIcon size={16} />
      </div>
      <span className="font-display text-sm font-bold tracking-[-0.01em] text-text-primary">
        FOS&middot;AI
      </span>
    </div>
  );
}