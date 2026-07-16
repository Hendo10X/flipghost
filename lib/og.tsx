import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { GhostIcon } from "@hugeicons/core-free-icons"

/**
 * Shared pieces for the link previews.
 *
 * Satori (what renders these) cannot read the woff2 that next/font produces,
 * and it has no access to CSS variables either, so the typeface is loaded from
 * a real TTF and the palette is hard-coded. The values below are the app's own
 * dark tokens converted out of oklch — a preview that does not match the site
 * is worse than no preview.
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = "image/png"

/** oklch(0.145 0 0) — the app's dark `--background`. */
const BACKGROUND = "#0a0a0a"
/** oklch(0.985 0 0) — `--foreground`. */
const FOREGROUND = "#fafafa"
/** oklch(0.708 0 0) — `--muted-foreground`. */
const MUTED = "#a1a1a1"

export const OG_COLORS = { BACKGROUND, FOREGROUND, MUTED }

let fontCache: ArrayBuffer | null = null

/** Read once per process; the file never changes and the reads add up. */
export async function momoTrust(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache
  const buffer = await readFile(
    join(process.cwd(), "app/fonts/MomoTrustDisplay-Regular.ttf")
  )
  fontCache = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer
  return fontCache
}

export async function ogFonts() {
  return [
    {
      name: "Momo Trust Display",
      data: await momoTrust(),
      style: "normal" as const,
      weight: 400 as const,
    },
  ]
}

/**
 * The same ghost the wordmark uses, drawn from the icon's own path data rather
 * than a second copy that could drift away from it.
 */
export function Ghost({ size, color = FOREGROUND }: { size: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {GhostIcon.map(([, attrs], i) => (
        <path
          key={i}
          d={attrs.d as string}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}

/** The logotype: ghost and word side by side, exactly as in the nav. */
export function Wordmark({ size = 64 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.32 }}>
      <Ghost size={size} />
      <span
        style={{
          fontFamily: "Momo Trust Display",
          fontSize: size,
          color: FOREGROUND,
          // Satori has no optical sizing, so large display text needs the
          // tracking pulled in by hand the way the site's tracking-tight does.
          letterSpacing: -size * 0.02,
        }}
      >
        Flipghost
      </span>
    </div>
  )
}

/** Full-bleed dark field. Every preview sits on this. */
export function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: BACKGROUND,
      }}
    >
      {children}
    </div>
  )
}
