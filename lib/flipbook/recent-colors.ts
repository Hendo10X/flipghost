import { get, set } from "idb-keyval"

/**
 * The colours you mixed yourself, most recent first.
 *
 * Stored against the person rather than the project, under its own key. Two
 * reasons. The cloud save only carries frames, title, fps and the stage preset,
 * so hanging these off a project would mean a schema migration for something
 * that is not part of the drawing. And the mental model is the same as a real
 * desk: the colours you mixed last are still on the palette when you start the
 * next page.
 *
 * Every read is defensive because this comes back from storage, where anything
 * could be waiting.
 */
const KEY = "flipghost:recent-colors"

/** Five is one row at the popover's width, and about as far back as anyone reaches. */
export const RECENT_LIMIT = 5

const HEX = /^#[0-9a-f]{6}$/

function normalize(color: string) {
  return color.trim().toLowerCase()
}

export function isHexColor(color: string) {
  return HEX.test(normalize(color))
}

export async function loadRecentColors(): Promise<string[]> {
  try {
    const stored = await get<unknown>(KEY)
    if (!Array.isArray(stored)) return []
    return stored
      .filter((c): c is string => typeof c === "string" && isHexColor(c))
      .map(normalize)
      .slice(0, RECENT_LIMIT)
  } catch {
    // Private mode, or a quota wall. Losing the list is not worth an error.
    return []
  }
}

export async function saveRecentColors(colors: string[]) {
  try {
    await set(KEY, colors.slice(0, RECENT_LIMIT))
  } catch {
    // Same: this is a convenience, never a reason to interrupt drawing.
  }
}

/**
 * Most recent first, no duplicates, capped. Returns the list unchanged — the
 * same reference — when there is nothing to do, so callers can use identity to
 * decide whether a write is worth making.
 */
export function withRecentColor(colors: string[], color: string): string[] {
  const next = normalize(color)
  if (!isHexColor(next)) return colors
  if (colors[0] === next) return colors
  return [next, ...colors.filter((c) => c !== next)].slice(0, RECENT_LIMIT)
}
