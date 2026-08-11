const KEY = "deluxe-salon:listening";

export function rememberTrack(track: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ track: Math.max(0, Math.floor(track)) }));
  } catch {
    /* storage unavailable */
  }
}
