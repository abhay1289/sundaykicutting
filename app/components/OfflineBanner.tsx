"use client";

import { useEffect, useState } from "react";

/** Small banner when the device has no network — site still works; YouTube songs do not. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <p className="offline-banner" role="status">
      ऑफ़लाइन मोड — साइट खुली रहेगी। गाने सुनने के लिए इंटरनेट जोड़ें। रूम टोन चल सकता है।
    </p>
  );
}
