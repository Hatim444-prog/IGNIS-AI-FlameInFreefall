import { useSyncExternalStore } from "react";
export const workspaceDefaults = {
  ignis_theme: "dark",
  ignis_motion: "system",
  ignis_sidebar_compact: "false",
  ignis_default_dataset: "curated",
  ignis_page_size: "12",
  ignis_assistant_mode: "Hybrid",
} as const;

export function resetWorkspacePreferences() {
  Object.entries(workspaceDefaults).forEach(([key, value]) =>
    localStorage.setItem(key, value),
  );
  window.dispatchEvent(new Event("ignis-preference"));
}
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
