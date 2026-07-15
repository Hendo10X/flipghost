"use client"

import { useEffect, useState } from "react"
import {
  CheckmarkCircle02Icon,
  Film01Icon,
  Gif01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

const FILL_STEPS = 50
const HOLD_STEPS = 22

function ExportTrack({
  icon,
  label,
  meta,
  fillMs,
}: {
  icon: typeof Gif01Icon
  label: string
  meta: string
  fillMs: number
}) {
  const reduced = usePrefersReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduced) return
    const period = FILL_STEPS + HOLD_STEPS
    const id = setInterval(
      () => setTick((t) => (t + 1) % period),
      fillMs / FILL_STEPS
    )
    return () => clearInterval(id)
  }, [reduced, fillMs])

  // Ticks past FILL_STEPS hold at 100%, so the bar rests before looping.
  const pct = reduced ? 100 : Math.min(100, Math.round((tick / FILL_STEPS) * 100))
  const done = pct >= 100

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.8} />
        <span className="text-xs font-medium">{label}</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
          {done ? (
            <>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-3 text-sky-500"
                strokeWidth={2}
              />
              {meta}
            </>
          ) : (
            `${pct}%`
          )}
        </span>
      </div>
      <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
        {/* scaleX rather than width: transform stays on the compositor. */}
        <span
          style={{ transform: `scaleX(${pct / 100})` }}
          className="block h-full origin-left rounded-full bg-sky-500 transition-transform duration-150 ease-linear"
        />
      </div>
    </div>
  )
}

export function ExportProgress() {
  return (
    <div className="flex flex-col gap-3">
      <ExportTrack
        icon={Gif01Icon}
        label="Looping GIF"
        meta="1080×1080"
        fillMs={2600}
      />
      <ExportTrack icon={Film01Icon} label="MP4 video" meta="H.264" fillMs={4200} />
    </div>
  )
}
