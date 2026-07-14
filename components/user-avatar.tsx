"use client"

import { useMemo } from "react"
import { createAvatar, palettes } from "@oreo-design/avatar"
import { useTheme } from "next-themes"

const SHAPES = ["bloom", "silk", "flare", "nova", "void", "jade"] as const

function hashSeed(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/**
 * Deterministic gradient avatar: the same user always gets the same
 * shape/palette combination, different users get different ones.
 *
 * We build the SVG ourselves (rather than using the package's <Avatar>)
 * so we can strip its built-in <title>, which the browser would otherwise
 * render as a second, redundant native tooltip.
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
  const { resolvedTheme } = useTheme()

  const svg = useMemo(() => {
    const hash = hashSeed(seed)
    const { svg } = createAvatar({
      shape: SHAPES[hash % SHAPES.length],
      palette: palettes[(hash >>> 3) % palettes.length].id,
      variantId: seed,
      size,
      appearance: resolvedTheme === "dark" ? "dark" : "light",
    })
    return svg.replace(/<title>[\s\S]*?<\/title>/i, "")
  }, [seed, size, resolvedTheme])

  return (
    <span
      aria-hidden
      className={className}
      style={{ display: "inline-block", width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
