"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
}

interface PeriodicSyncRegistration {
  register(tag: string, options: { minInterval: number }): Promise<void>;
}

type ServiceWorkerRegistrationWithPeriodicSync = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncRegistration;
};

export function usePushSubscription() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (active) setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      if (active) {
        setState((prev) => ({ ...prev, isSupported: true, permission: Notification.permission }));
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (active) {
          setState((prev) => ({
            ...prev,
            isSubscribed: !!subscription,
            permission: Notification.permission,
            loading: false,
          }));
        }
      } catch {
        if (active) setState((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys) {
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          userAgent: navigator.userAgent,
        }),
      });

      if (!res.ok) {
        console.error("Failed to save subscription on server");
        if (subscription) await subscription.unsubscribe();
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }

      setState((prev) => ({ ...prev, isSubscribed: true, loading: false }));
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      setState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setState((prev) => ({ ...prev, isSubscribed: false, loading: false }));
        return true;
      }

      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();

      setState((prev) => ({ ...prev, isSubscribed: false, loading: false }));
      return true;
    } catch (err) {
      console.error("Unsubscribe failed:", err);
      setState((prev) => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  const syncReminders = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/push/reminder-sync", { method: "POST" });
      if (!res.ok) return;

      const data = await res.json();

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.active?.postMessage({
          type: "UPDATE_REMINDERS",
          payload: data.reminders || [],
        });
      }
    } catch (err) {
      console.error("Failed to sync reminders:", err);
    }
  }, []);

  const registerPeriodicSync = useCallback(async (): Promise<void> => {
    if (!("serviceWorker" in navigator) || !("PeriodicSyncManager" in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const periodicSync = (registration as ServiceWorkerRegistrationWithPeriodicSync).periodicSync;
      if (periodicSync) {
        const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
        if (status.state === "granted") {
          await periodicSync.register("daily-reminder-check", {
            minInterval: 60 * 1000,
          });
        }
      }
    } catch {
      // Periodic Background Sync not supported or not available
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    syncReminders,
    registerPeriodicSync,
  };
}
