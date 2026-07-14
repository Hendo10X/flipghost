"use client"

import { palettes } from "@oreo-design/avatar"
import { Avatar } from "@oreo-design/avatar/react"
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
  const hash = hashSeed(seed)

  return (
    <Avatar
      shape={SHAPES[hash % SHAPES.length]}
      palette={palettes[(hash >>> 3) % palettes.length].id}
      variantId={seed}
      size={size}
      appearance={resolvedTheme === "dark" ? "dark" : "light"}
      className={className}
    />
  )
}
