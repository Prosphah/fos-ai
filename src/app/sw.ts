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
  lastFiredDate?: string;
}

async function checkAndFireReminders(): Promise<void> {
  try {
    const reminders = await getAllReminders();
    const now = new Date();
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const reminder of reminders) {
      if (!reminder.enabled) continue;
      if (!reminder.days.includes(currentDay)) continue;

      const [hours, minutes] = reminder.time.split(":").map(Number);
      const reminderMinutes = hours * 60 + minutes;

      const today = now.toISOString().slice(0, 10);
      if (currentMinutes >= reminderMinutes && reminder.lastFiredDate !== today) {
        await self.registration.showNotification("Have you recorded your transactions?", {
          body: "Tap to open Money Manager and log today's cash movements.",
          icon: "/logo.png",
          badge: "/logo.png",
          data: { url: "/money-manager" },
          tag: `daily-reminder-${reminder.userId}`,
        });

        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put({ ...reminder, lastFiredDate: today });
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
      })()
    );
  }

  if (event.data?.type === "CHECK_REMINDERS") {
    event.waitUntil(checkAndFireReminders());
  }
});

serwist.addEventListeners();
