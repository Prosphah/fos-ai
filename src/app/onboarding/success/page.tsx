"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else {
      router.replace("/briefing");
    }
  }, [countdown, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center px-4 py-8 sm:px-6">
      <div className="w-full text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">You&apos;re all set!</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your financial profile is complete. We&apos;re building your personalized dashboard now.
        </p>

        <p className="mt-8 text-sm text-gray-400">
          Redirecting to your dashboard in {countdown} seconds…
        </p>

        <Button
          className="mt-4"
          size="lg"
          onClick={() => router.replace("/briefing")}
        >
          Go to Dashboard
        </Button>
      </div>
    </main>
  );
}
