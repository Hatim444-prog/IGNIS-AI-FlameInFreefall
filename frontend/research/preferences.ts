import { useSyncExternalStore } from "react";
function subscribe(update: () => void) {
  window.addEventListener("storage", update);
  window.addEventListener("ignis-preference", update);
  return () => {
    window.removeEventListener("storage", update);
    window.removeEventListener("ignis-preference", update);
  };
}
export function usePreference(key: string, fallback: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) ?? fallback,
    () => fallback,
  );
  function set(next: string) {
    localStorage.setItem(key, next);
    window.dispatchEvent(new Event("ignis-preference"));
  }
  return [value, set] as const;
}
