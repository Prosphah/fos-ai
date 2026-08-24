import type React from "react";

export function handleEnterToNext(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === "Enter" && (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
    e.preventDefault();
    const focusable = Array.from(
      e.currentTarget.querySelectorAll("input:not([type=hidden]):not([disabled]), select:not([disabled])")
    );
    const idx = focusable.indexOf(e.target);
    if (idx < focusable.length - 1) {
      (focusable[idx + 1] as HTMLElement).focus();
    }
  }
}
