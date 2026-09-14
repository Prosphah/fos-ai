"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  icon: string | null;
  url: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

interface NotificationsContextValue extends NotificationsData {
  refetch: () => Promise<void>;
  markAsRead: (ids?: string[]) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  refetch: async () => {},
  markAsRead: async () => {},
});

export function NotificationsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: NotificationsData;
}) {
  const [state, setState] = useState<NotificationsData>(initial);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setState({
        notifications: data.notifications || [],
        unreadCount: data.unreadCount || 0,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const markAsRead = useCallback(
    async (ids?: string[]) => {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : { all: true }),
      });

      if (res.ok) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            ids ? (ids.includes(n.id) ? { ...n, is_read: true } : n) : { ...n, is_read: true }
          ),
          unreadCount: ids
            ? prev.notifications.filter((n) => !n.is_read && !ids.includes(n.id)).length
            : 0,
        }));
      }
    },
    []
  );

  return (
    <NotificationsContext.Provider value={{ ...state, refetch, markAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
