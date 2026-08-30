"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.protocol === "https:"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.debug("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("PWA Service Worker registration skipped:", err);
        });
    }
  }, []);

  return null;
}
