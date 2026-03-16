"use client";

import { useEffect, useRef } from "react";
import { useAppSettingsStore } from "@/store/useAppSettingsStore";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    useAppSettingsStore.getState().hydrateFromServer().then(() => {
      hydrated.current = true;

      const debouncedSync = debounce(() => {
        useAppSettingsStore.getState().syncToServer();
      }, 800);

      // Subscribe after hydration so the hydrate set() doesn't trigger a write-back
      unsub = useAppSettingsStore.subscribe(debouncedSync);
    });

    return () => unsub?.();
  }, []);

  return <>{children}</>;
}
