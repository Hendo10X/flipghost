"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { GhostIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { buildDemoFrames, DEMOS, type DemoSpec } from "@/lib/flipbook/demos"
import type { Frame } from "@/lib/flipbook/store"
import { Button } from "@/components/ui/button"

/** Previews are small; the workshop rebuilds demos at full resolution. */
const PREVIEW_WIDTH = 320

function DemoCard({ spec }: { spec: DemoSpec }) {
  const [frames, setFrames] = useState<Frame[]>([])
  const [active, setActive] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let cancelled = false
    buildDemoFrames(spec, PREVIEW_WIDTH)
      .then((built) => {
        if (!cancelled) setFrames(built)
      })
      .catch(() => {
        // One broken demo shouldn't take down the grid.
      })
    return () => {
      cancelled = true
    }
  }, [spec])

  // Drive the preview <img> directly so playback never re-renders React.
  useEffect(() => {
    const img = imgRef.current
    if (!img || frames.length === 0) return

    if (!active) {
      img.src = frames[0].dataUrl ?? ""
      return
    }

    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % frames.length
      const next = frames[index].dataUrl
      if (next) img.src = next
    }, 1000 / spec.fps)
    return () => clearInterval(interval)
  }, [active, frames, spec.fps])

  return (
    <figure className="group flex flex-col gap-2">
      <div
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => setActive(false)}
        onFocus={() => setActive(true)}
        onBlur={() => setActive(false)}
        className="relative aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-black/10 dark:ring-white/15"
      >
        {frames.length === 0 ? (
          <div className="flex size-full items-center justify-center">
            <HugeiconsIcon
              icon={GhostIcon}
              className="size-5 animate-pulse text-muted-foreground"
              strokeWidth={1.8}
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
          <img
            ref={imgRef}
            alt={`${spec.title} animation preview`}
            draggable={false}
            className="size-full select-none"
          />
        )}

        {/* Shown on hover/focus where hovering exists; always shown on touch. */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 to-transparent p-3 transition-opacity duration-200 ease-out [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
          <Button
            render={<Link href={`/workshop?demo=${spec.id}`} />}
            size="lg"
            className="pointer-events-auto px-3"
          >
            Open in workshop
          </Button>
        </div>
      </div>

      <figcaption className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{spec.title}</span>
        <span className="text-xs text-pretty text-muted-foreground">
          {spec.description}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {spec.frameCount} frames · {spec.fps} fps
        </span>
      </figcaption>
    </figure>
  )
}

export function ShowcaseGrid() {
  return (
    // Stay single-column on very narrow phones so the hover button still fits.
    <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {DEMOS.map((spec) => (
        <DemoCard key={spec.id} spec={spec} />
      ))}
    </div>
  )
}
