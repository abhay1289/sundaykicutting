/** In-memory presence for a single Node process (`next start` / one instance). */

const STALE_MS = 45_000;

type PresenceStore = {
  sessions: Map<string, number>;
};

function getStore(): PresenceStore {
  const g = globalThis as typeof globalThis & { __salonPresence?: PresenceStore };
  if (!g.__salonPresence) {
    g.__salonPresence = { sessions: new Map() };
  }
  return g.__salonPresence;
}

function prune(store: PresenceStore, now: number) {
  for (const [id, ts] of store.sessions) {
    if (now - ts > STALE_MS) store.sessions.delete(id);
  }
}

/** Mark a session as actively listening (music playing). */
export function heartbeat(id: string): number {
  const store = getStore();
  const now = Date.now();
  store.sessions.set(id, now);
  prune(store, now);
  return store.sessions.size;
}

/** Remove a session immediately (paused / closed / left). */
export function leave(id: string): number {
  const store = getStore();
  store.sessions.delete(id);
  prune(store, Date.now());
  return store.sessions.size;
}

export function countActive(): number {
  const store = getStore();
  prune(store, Date.now());
  return store.sessions.size;
}
