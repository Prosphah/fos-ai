"use client";

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

declare global {
  interface Window {
    serwist: Serwist;
  }
}

async function syncRemindersToSW(): Promise<void> {
  try {
    const res = await fetch("/api/push/reminder-sync", { method: "POST" });
    if (!res.ok) return;

    const data = await res.json();
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: "UPDATE_REMINDERS",
      payload: data.reminders || [],
    });
  } catch {
    // Not logged in or offline — will sync on next visit
  }
}

async function registerPeriodicSync(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PeriodicSyncManager" in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const periodicSync = (registration as ServiceWorkerRegistration & { periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } }).periodicSync;
    if (periodicSync) {
      const status = await navigator.permissions.query({ name: "periodic-background-sync" as PermissionName });
      if (status.state === "granted") {
        await periodicSync.register("daily-reminder-check", { minInterval: 60 * 1000 });
      }
    }
  } catch {
    // Periodic Background Sync not supported
  }
}

export function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const serwist = new Serwist("/sw.js", { scope: "/" });
    serwist.register();

    navigator.serviceWorker.ready.then(() => {
      syncRemindersToSW();
      registerPeriodicSync();
    });
  }, []);

  return null;
}
