export type HotkeyAction =
  | "select"
  | "brush"
  | "eraser"
  | "playPause"
  | "prevFrame"
  | "nextFrame"
  | "toggleOnion"
  | "addFrame"

export type HotkeyMap = Record<HotkeyAction, string>

/** Keys are stored lowercased, matching `KeyboardEvent.key.toLowerCase()`. */
export const HOTKEY_DEFAULTS: HotkeyMap = {
  select: "v",
  brush: "b",
  eraser: "e",
  playPause: " ",
  prevFrame: "arrowleft",
  nextFrame: "arrowright",
  toggleOnion: "o",
  addFrame: "n",
}

export const HOTKEY_ACTIONS: { action: HotkeyAction; label: string }[] = [
  { action: "select", label: "Select tool" },
  { action: "brush", label: "Brush tool" },
  { action: "eraser", label: "Eraser tool" },
  { action: "playPause", label: "Play / pause" },
  { action: "prevFrame", label: "Previous frame" },
  { action: "nextFrame", label: "Next frame" },
  { action: "toggleOnion", label: "Toggle onion skin" },
  { action: "addFrame", label: "Add frame" },
]

/** Shortcuts that are reserved and can't be rebound. */
export const FIXED_HOTKEYS: { label: string; keys: string }[] = [
  { label: "Undo", keys: "Ctrl Z" },
  { label: "Redo", keys: "Ctrl ⇧ Z" },
  { label: "Zoom in", keys: "Ctrl +" },
  { label: "Zoom out", keys: "Ctrl -" },
  { label: "Fit to viewport", keys: "Ctrl 0" },
  { label: "Delete selection", keys: "Del" },
  { label: "Deselect", keys: "Esc" },
]

const STORAGE_KEY = "flipghost:hotkeys"
const listeners = new Set<() => void>()

// useSyncExternalStore needs a stable reference, so the map is cached and
// only rebuilt when a binding actually changes.
let cache: HotkeyMap | null = null

function read(): HotkeyMap {
  if (cache) return cache
  let stored: Partial<HotkeyMap> = {}
  if (typeof window !== "undefined") {
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}")
    } catch {
      stored = {}
    }
  }
  cache = { ...HOTKEY_DEFAULTS, ...stored }
  return cache
}

function commit(next: HotkeyMap) {
  cache = next
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // A full or blocked store shouldn't break the editor.
    }
  }
  listeners.forEach((listener) => listener())
}

/**
 * Binds `key` to `action`. If another action already owns that key, the two
 * swap, so every action keeps a binding.
 */
export function setHotkey(action: HotkeyAction, key: string) {
  const current = read()
  const previous = current[action]
  if (current[action] === key) return

  const next: HotkeyMap = { ...current, [action]: key }
  const conflict = (Object.keys(current) as HotkeyAction[]).find(
    (other) => other !== action && current[other] === key
  )
  if (conflict) next[conflict] = previous

  commit(next)
}

export function resetHotkeys() {
  commit({ ...HOTKEY_DEFAULTS })
}

export function subscribeHotkeys(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export const getHotkeysSnapshot = read

export function getHotkeysServerSnapshot(): HotkeyMap {
  return HOTKEY_DEFAULTS
}

const KEY_LABELS: Record<string, string> = {
  " ": "Space",
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
  escape: "Esc",
  enter: "Enter",
  tab: "Tab",
}

/** Human-readable label for a stored key. */
export function formatHotkey(key: string): string {
  return KEY_LABELS[key] ?? key.toUpperCase()
}

/** Whether a pressed key is acceptable as a binding. */
export function isBindableKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false
  const key = e.key.toLowerCase()
  if (["shift", "control", "alt", "meta"].includes(key)) return false
  return key === " " || key.startsWith("arrow") || key.length === 1
}
