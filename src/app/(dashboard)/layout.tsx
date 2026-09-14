import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { UserNameProvider } from "@/components/user-name-context";
import { NotificationsProvider } from "@/components/notifications-context";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userName = "";
  let notifications: { id: string; title: string; body: string | null; icon: string | null; url: string | null; type: string; is_read: boolean; created_at: string }[] = [];
  let unreadCount = 0;

  if (user) {
    const [profileResult, notifResult] = await Promise.all([
      supabase
        .from("financial_profiles")
        .select("first_name")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("notifications")
        .select("id, title, body, icon, url, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    userName = profileResult.data?.first_name || user.email?.split("@")[0] || "";
    notifications = notifResult.data || [];
    unreadCount = notifications.filter((n) => !n.is_read).length;
  }

  return (
    <UserNameProvider value={userName}>
      <NotificationsProvider initial={{ notifications, unreadCount, loading: false }}>
        {children}
      </NotificationsProvider>
    </UserNameProvider>
  );
}
