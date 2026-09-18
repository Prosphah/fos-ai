import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DB_NAME = "fos-ai-reminders";
const DB_VERSION = 1;
const STORE_NAME = "reminders";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function waitForTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("Transaction aborted"));
    tx.onerror = () => reject(tx.error);
  });
}

function getAllReminders(): Promise<ReminderEntry[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

interface ReminderEntry {
  userId: string;
  enabled: boolean;
  time: string;
  days: number[];
  timezone?: string;
  lastFiredDate?: string;
}

function getTimeInTimezone(tz: string): { hours: number; minutes: number; day: number; dateKey: string } {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const weekdayStr = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
    const year = parts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parts.find((p) => p.type === "month")?.value ?? "01";
    const dayOfMonth = parts.find((p) => p.type === "day")?.value ?? "01";

    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const day = dayMap[weekdayStr] ?? 0;
    const dateKey = `${year}-${month}-${dayOfMonth}`;

    return { hours: hour, minutes: minute, day, dateKey };
  } catch {
    const now = new Date();
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      day: now.getDay(),
      dateKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    };
  }
}

async function checkAndFireReminders(): Promise<void> {
  try {
    const reminders = await getAllReminders();

    for (const reminder of reminders) {
      if (!reminder.enabled) continue;

      const tz = reminder.timezone || "UTC";
      const { hours, minutes, day, dateKey } = getTimeInTimezone(tz);

      if (!reminder.days.includes(day)) continue;

      const [rh, rm] = reminder.time.split(":").map(Number);
      const currentMinutes = hours * 60 + minutes;
      const reminderMinutes = rh * 60 + rm;

      if (currentMinutes >= reminderMinutes && reminder.lastFiredDate !== dateKey) {
        await self.registration.showNotification("Have you recorded your transactions?", {
          body: "Tap to open Money Manager and log today's cash movements.",
          icon: "/logo.png",
          badge: "/logo.png",
          data: { url: "/money-manager" },
          tag: `daily-reminder-${reminder.userId}`,
        });

        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ ...reminder, lastFiredDate: dateKey });
        await waitForTransaction(tx);
      }
    }
  } catch (err) {
    console.error("[SW] Failed to check reminders:", err);
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title: string; body?: string; url?: string; tag?: string; icon?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: event.data.text() };
  }

  const options: NotificationOptions = {
    body: payload.body || "",
    icon: payload.icon || "/logo.png",
    badge: "/logo.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "fos-notification",
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && "url" in client) {
          if (new URL(client.url).pathname === url) {
            return client.focus();
          }
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("periodicsync", (event) => {
  const syncEvent = event as any;
  if (syncEvent.tag === "daily-reminder-check") {
    syncEvent.waitUntil(checkAndFireReminders());
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "UPDATE_REMINDERS") {
    event.waitUntil(
      (async () => {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const entries: ReminderEntry[] = event.data.payload || [];
        store.clear();
        for (const entry of entries) {
          store.put(entry);
        }
        await waitForTransaction(tx);
      })()
    );
  }

  if (event.data?.type === "CHECK_REMINDERS") {
    event.waitUntil(checkAndFireReminders());
  }
});

serwist.addEventListeners();
