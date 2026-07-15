import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import "@/components/landing/lost-frame.css"
import { cn } from "@/lib/utils"

/**
 * A filmstrip running 401 to 405, drawn the way the workshop would draw it:
 * the ghost drifts left to right, one pose per frame. Frame 404 is the gap,
 * holding nothing but the onion skins of the frames on either side of it.
 */
const POSES = ["-translate-x-[22%] -rotate-6", "-translate-x-[11%] -rotate-3", "", "", "translate-x-[22%] rotate-6"]

const FRAMES = [
  { label: "401", pose: POSES[0] },
  { label: "402", pose: POSES[1] },
  { label: "403", pose: POSES[2] },
  { label: "404", pose: null },
  { label: "405", pose: POSES[4] },
]

function Ghost({
  pose,
  delay,
  className,
}: {
  pose: string
  delay: number
  className?: string
}) {
  return (
    <span className={cn("inline-flex", pose, className)}>
      <span
        className="lost-frame-ghost inline-flex"
        style={{ animationDelay: `${delay}s` }}
      >
        <HugeiconsIcon
          icon={GhostIcon}
          className="size-8 sm:size-10"
          strokeWidth={1.5}
        />
      </span>
    </span>
  )
}

export function LostFrame({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ul className="grid grid-cols-5 gap-2 sm:gap-3">
        {FRAMES.map((frame, index) => (
          <li key={frame.label} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border",
                frame.pose === null
                  ? "border-dashed bg-muted/40"
                  : "bg-card shadow-sm"
              )}
            >
              {frame.pose === null ? (
                /* Onion skins only: what 403 and 405 leave behind when the
                   frame between them was never drawn. */
                <span className="relative flex items-center justify-center text-foreground/20">
                  <Ghost pose={POSES[2]} delay={0.3} className="absolute" />
                  <Ghost pose={POSES[4]} delay={0.6} className="absolute" />
                  <span className="size-8 sm:size-10" aria-hidden />
                </span>
              ) : (
                <Ghost pose={frame.pose} delay={index * 0.15} />
              )}
            </div>
            <span
              className={cn(
                "font-mono text-[10px] tabular-nums",
                frame.pose === null
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {frame.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
