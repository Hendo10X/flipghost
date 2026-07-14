import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

/**
 * The Flipghost logotype. The word uses the Momo Trust Display face
 * (`--font-display`); the ghost mark rides alongside it.
 */
export function Wordmark({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-sm select-none",
        className
      )}
    >
      <HugeiconsIcon
        icon={GhostIcon}
        className={cn("size-4", iconClassName)}
        strokeWidth={2}
      />
      Flipghost
    </span>
  )
}
