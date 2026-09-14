"use client";

import { useEffect, useRef } from "react";
import { Bell, X, Check, TrendingUp, AlertCircle, Info, Gift } from "lucide-react";
import type { Notification } from "@/components/notifications-context";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (ids: string[]) => void;
}

interface DateGroup {
  label: string;
  items: Notification[];
}

function groupByDate(notifications: Notification[]): DateGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const groups: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const d = new Date(n.created_at);
    let key: string;

    if (d >= todayStart) {
      key = "Today";
    } else if (d >= yesterdayStart) {
      key = "Yesterday";
    } else {
      key = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function typeIcon(type: string) {
  switch (type) {
    case "reminder":
      return <TrendingUp size={16} color="var(--accent)" />;
    case "alert":
      return <AlertCircle size={16} color="var(--rose)" />;
    case "tip":
      return <Info size={16} color="var(--accent)" />;
    case "reward":
      return <Gift size={16} color="var(--amber)" />;
    default:
      return <Bell size={16} color="var(--text-3)" />;
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 72,
          height: 72,
          background: "var(--accent-softer)",
          marginBottom: 20,
        }}
      >
        <Bell size={32} color="var(--accent)" strokeWidth={1.5} />
      </div>
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--text-1)",
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        All caught up
      </h3>
      <p
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-2)",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: 240,
        }}
      >
        You&apos;ll see reminders, updates, and alerts here when there&apos;s something new.
      </p>
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: () => void;
}) {
  const handleClick = () => {
    if (!notification.is_read) {
      onRead();
    }
    if (notification.url) {
      window.location.href = notification.url;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors"
      style={{
        background: notification.is_read ? "transparent" : "var(--accent-softer)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--glass-bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = notification.is_read ? "transparent" : "var(--accent-softer)";
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: 34,
          height: 34,
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          marginTop: 2,
        }}
      >
        {typeIcon(notification.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: notification.is_read ? 500 : 600,
              color: "var(--text-1)",
              lineHeight: 1.3,
            }}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span
              className="shrink-0"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent-glow)",
                marginTop: 4,
              }}
            />
          )}
        </div>
        {notification.body && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-2)",
              lineHeight: 1.4,
              marginTop: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {notification.body}
          </p>
        )}
        <p
          style={{
            fontSize: "0.6875rem",
            color: "var(--text-3)",
            marginTop: 4,
          }}
        >
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAllRead,
  onMarkRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const grouped = groupByDate(notifications);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        aria-hidden={!open}
        inert={!open}
        className="fixed top-0 right-0 z-50 flex h-full flex-col transition-transform duration-300"
        style={{
          width: "min(380px, 100vw)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--glass-border)",
          boxShadow: "-8px 0 40px rgba(0, 0, 0, 0.15)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between"
          style={{
            padding: "16px 20px",
            paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
            borderBottom: "1px solid var(--glass-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "var(--text-1)",
              }}
            >
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span
                className="flex items-center justify-center"
                style={{
                  minWidth: 20,
                  height: 20,
                  padding: "0 6px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors"
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-softer)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Check size={13} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: 32,
                height: 32,
                color: "var(--text-2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--glass-bg-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "8px 12px" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "2.5px solid var(--glass-border)",
                  borderTopColor: "var(--accent)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p
                    className="sticky top-0 z-10"
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      padding: "6px 8px",
                      background: "var(--bg)",
                    }}
                  >
                    {group.label}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onRead={() => onMarkRead([n.id])}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
