import { play, setEnabled, type SoundName } from "cuelume"

const STORAGE_KEY = "flipghost:sound"
const listeners = new Set<() => void>()

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true
  return window.localStorage.getItem(STORAGE_KEY) !== "off"
}

/** Persist the preference, apply it to cuelume, and notify subscribers. */
export function setSoundEnabled(enabled: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off")
  }
  setEnabled(enabled)
  listeners.forEach((listener) => listener())
}

/** Play a UI sound, respecting the stored preference. */
export function cue(name: SoundName) {
  if (!isSoundEnabled()) return
  play(name)
}

// --- useSyncExternalStore adapters (no effect-based reads) ---

export function subscribeSound(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export const getSoundSnapshot = isSoundEnabled

export function getSoundServerSnapshot() {
  return true
}
