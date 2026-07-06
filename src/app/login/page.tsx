"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      console.error(error.message);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Login to FOS-AI</h1>

      <input
        className="border p-2 w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        className="bg-black text-white px-4 py-2"
        onClick={signIn}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Magic Link"}
      </button>
    </div>
  );
}