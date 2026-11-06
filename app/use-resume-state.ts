"use client";

import { useContext, useMemo, useSyncExternalStore, type SetStateAction } from "react";
import { AccountContext } from "./components/AccountContext";

function createResumeStore<T>(key: string) {
  let state: T | null = null;
  let loaded = false;
  const listeners = new Set<() => void>();

  function getSnapshot() {
    if (!loaded) {
      loaded = true;
      try {
        state = JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
      } catch {
        // The current page can still work if browser storage is unavailable.
      }
    }
    return state;
  }

  return {
    getSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setState(update: SetStateAction<T | null>) {
      const previous = getSnapshot();
      state = typeof update === "function" ? (update as (value: T | null) => T | null)(previous) : update;
      if (Object.is(previous, state)) return;
      try {
        if (state === null) sessionStorage.removeItem(key);
        else sessionStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Keep the new state in memory for the current page.
      }
      listeners.forEach((listener) => listener());
    },
  };
}

const emptySnapshot = () => null;
const browserStores = new Map<string, unknown>();

export function useResumeState<T>(activity: string) {
  const account = useContext(AccountContext);
  const store = useMemo(() => {
    const key = `lingua-resume:${account}:${activity}`;
    if (typeof window === "undefined") return createResumeStore<T>(key);
    const existing = browserStores.get(key) as ReturnType<typeof createResumeStore<T>> | undefined;
    if (existing) return existing;
    const created = createResumeStore<T>(key);
    browserStores.set(key, created);
    return created;
  }, [account, activity]);
  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, emptySnapshot);
  return [value, store.setState] as const;
}
