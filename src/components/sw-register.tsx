"use client";

import { useEffect } from "react";
import { Serwist } from "@serwist/window";

declare global {
  interface Window {
    serwist: Serwist;
  }
}

export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const serwist = new Serwist("/sw.js", { scope: "/" });
      serwist.register();
    }
  }, []);

  return null;
}
