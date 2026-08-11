"use client";

import { useEffect } from "react";

/** Registers the service worker so the salon shell can open offline after the first visit. */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        /* private mode / blocked SW — site still works online */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
