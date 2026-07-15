"use client"

import { useMemo } from "react"
import { createAvatar, palettes } from "@oreo-design/avatar"

const SHAPES = ["bloom", "silk", "flare", "nova", "void", "jade"] as const

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * We build the SVG ourselves (rather than using the package's <Avatar>) so we
 * can strip its built-in <title>, which the browser would otherwise render as
 * a second, redundant native tooltip.
 */
function buildSvg(seed: string, size: number, appearance: "light" | "dark") {
  const hash = hashSeed(seed)
  const { svg } = createAvatar({
    shape: SHAPES[hash % SHAPES.length],
    palette: palettes[(hash >>> 3) % palettes.length].id,
    variantId: seed,
    size,
    appearance,
    // No background rect. The avatar sits on whatever surface it is placed on,
    // and the rect is what made the theme mismatch so loud: it is white in the
    // light palette, so a dark header wore a white tile around the gradient.
    background: null,
  })
  return svg.replace(/<title>[\s\S]*?<\/title>/i, "")
}

/**
 * Deterministic gradient avatar: the same user always gets the same
 * shape/palette combination, different users get different ones.
 *
 * Both appearances are rendered and CSS picks one, rather than asking
 * next-themes which theme is active. resolvedTheme is undefined until the
 * provider mounts on the client — and with defaultTheme="system" it cannot be
 * anything else, since it takes a matchMedia call to know. So the first paint
 * always fell back to the light avatar and swapped once JS arrived. The `dark`
 * class, by contrast, is on <html> before first paint because next-themes
 * blocks on a script to put it there, so the CSS answer is right immediately.
 */
export function UserAvatar({
  seed,
  size = 24,
  className,
}: {
  seed: string
  size?: number
  className?: string
}) {
  const [light, dark] = useMemo(
    () => [buildSvg(seed, size, "light"), buildSvg(seed, size, "dark")],
    [seed, size],
  )

  return (
    <span
      aria-hidden
      className={className}
      style={{ display: "inline-block", width: size, height: size, lineHeight: 0 }}
    >
      {/* Display lives in the class, not the style prop: an inline
          display would outrank `hidden` and show both. */}
      <span className="block dark:hidden" dangerouslySetInnerHTML={{ __html: light }} />
      <span className="hidden dark:block" dangerouslySetInnerHTML={{ __html: dark }} />
    </span>
  )
}
