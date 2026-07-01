import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(hover: hover) and (pointer: fine)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function usePrefersHover() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
