"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Calendar, ChevronRight, MessageSquare } from "lucide-react";
import { getProfileName } from "@/app/actions/profile";

const subscribeNoop = () => () => {};

export function Topbar() {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    getProfileName().then((p) => {
      if (p.firstName) setUserName(p.firstName);
    });
  }, []);

  const today = useSyncExternalStore(subscribeNoop, () => new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date()), () => "");
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between"
      style={{
        padding: "16px 20px",
        paddingTop: "calc(16px + env(safe-area-inset-top, 0px))",
        background: "var(--glass-bg)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        borderBottom: "1px solid var(--glass-border)",
        transition: "background 0.3s var(--ease), border-color 0.3s var(--ease)",
      }}
    >
      {/* Left side */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* Mobile: avatar + name + settings stacked */}
        <div
          className="flex items-center gap-[10px] lg:hidden"
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-xs)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display-family)",
              fontWeight: 700,
              fontSize: "0.8125rem",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {(userName?.[0] ?? "T").toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                lineHeight: 1.2,
                color: "var(--text-1)",
              }}
            >
              {userName || "there"}
            </span>
            <a
              href="/settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--accent)",
                padding: 0,
                transition: "opacity 0.2s var(--ease)",
              }}
            >
              Settings
              <ChevronRight size={12} />
            </a>
          </div>
        </div>

        {/* Desktop: date button */}
        <button
          className="hidden lg:inline-flex items-center"
          style={{
            gap: "8px",
            width: "auto",
            padding: "0 12px",
            height: "38px",
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--text-2)",
            letterSpacing: "0.02em",
            borderRadius: "var(--radius-xs)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            transition: "all 0.2s var(--ease)",
            whiteSpace: "nowrap",
          }}
        >
          <Calendar size={18} />
          {mounted && today}
        </button>
      </div>

      {/* Right side: feedback + notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <a
          href="/feedback"
          title="Share feedback"
          style={{
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-2)",
            transition: "all 0.2s var(--ease)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--glass-bg-hover)";
            e.currentTarget.style.borderColor = "var(--glass-border-hover)";
            e.currentTarget.style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--glass-bg)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.color = "var(--text-2)";
          }}
          aria-label="Share feedback"
        >
          <MessageSquare size={18} />
        </a>

        <button
          style={{
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-2)",
            transition: "all 0.2s var(--ease)",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--glass-bg-hover)";
            e.currentTarget.style.borderColor = "var(--glass-border-hover)";
            e.currentTarget.style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--glass-bg)";
            e.currentTarget.style.borderColor = "var(--glass-border)";
            e.currentTarget.style.color = "var(--text-2)";
          }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 8px var(--accent-glow)",
            }}
          />
        </button>
      </div>
    </header>
  );
}
