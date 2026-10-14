import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete
 *
 * Irreversibly erases the caller's account. Requires the account password
 * again in the request body, which means a stolen session cookie alone is not
 * enough to destroy someone's financial history.
 *
 * The erasure itself runs as a SECURITY DEFINER function so it is one
 * transaction across every table. If any step fails, nothing is deleted.
 */

const deleteSchema = z.object({
  password: z.string().min(1, "Enter your password."),
  confirm: z.literal("DELETE", { message: "Type DELETE to confirm." }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check your input." },
      { status: 400 }
    );
  }

  // Re-authenticate. Supabase returns the same generic error for a wrong
  // password and a missing account, which is what we want here.
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: parsed.data.password,
  });

  if (authError) {
    return NextResponse.json(
      { error: "That password is not correct." },
      { status: 403 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: deleted, error } = await admin.rpc("delete_account_data", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("delete_account_data failed:", error);
      return NextResponse.json(
        {
          error:
            "We could not delete your account. Nothing has been erased. Please try again.",
        },
        { status: 500 }
      );
    }

    // The auth record is gone, so the session is dead either way. Sign out to
    // clear the cookies the browser is still holding.
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      deleted: deleted ?? {},
    });
  } catch (err) {
    console.error("Account deletion threw:", err);
    return NextResponse.json(
      {
        error:
          "We could not delete your account. Nothing has been erased. Please try again.",
      },
      { status: 500 }
    );
  }
}