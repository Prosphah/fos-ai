import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1>FOS-AI</h1>
      <p>Welcome back</p>
    </div>
  );
}