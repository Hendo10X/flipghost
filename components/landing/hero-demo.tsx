"use client"

import { useEffect, useState } from "react"
import {
  Cursor01Icon,
  EraserIcon,
  GhostIcon,
  PencilEdit02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { buildDemoFrames, getDemo } from "@/lib/flipbook/demos"
import { cn } from "@/lib/utils"

const PREVIEW_WIDTH = 300
const GHOST_PREV = "#ef4444"
const GHOST_NEXT = "#22c55e"

interface Assets {
  normal: string[]
  prev: string[]
  next: string[]
}

/** Recolors a snapshot to a flat tint, the same way the editor ghosts frames. */
function tint(dataUrl: string, color: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = "source-in"
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL())
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function HeroDemo({ className }: { className?: string }) {
  const [assets, setAssets] = useState<Assets | null>(null)
  const [index, setIndex] = useState(0)

  // Build the demo once, and pre-tint every ghost so playback is just a
  // src swap rather than a canvas op per frame.
  useEffect(() => {
    let cancelled = false
    const spec = getDemo("bouncing-ball")
    if (!spec) return

    buildDemoFrames(spec, PREVIEW_WIDTH)
      .then(async (frames) => {
        const normal = frames.map((f) => f.dataUrl ?? "")
        const [prev, next] = await Promise.all([
          Promise.all(normal.map((url) => tint(url, GHOST_PREV))),
          Promise.all(normal.map((url) => tint(url, GHOST_NEXT))),
        ])
        if (!cancelled) setAssets({ normal, prev, next })
      })
      .catch(() => {
        // A failed demo shouldn't take the landing page down.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!assets) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const spec = getDemo("bouncing-ball")!
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % assets.normal.length)
    }, 1000 / spec.fps)
    return () => clearInterval(interval)
  }, [assets])

  const count = assets?.normal.length ?? 0
  const prevIndex = count ? (index - 1 + count) % count : 0
  const nextIndex = count ? (index + 1) % count : 0

  return (
    <div
      role="img"
      aria-label="The Flipghost editor playing a bouncing ball animation, with onion-skin ghosts of the neighbouring frames"
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-lg select-none",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <HugeiconsIcon
          icon={GhostIcon}
          className="size-3.5 shrink-0"
          strokeWidth={2}
        />
        <span className="truncate text-xs font-medium">Bouncing ball</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            GIF
          </span>
          <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            MP4
          </span>
        </div>
      </div>

      <div className="flex">
        {/* Toolbar */}
        <div className="flex w-9 shrink-0 flex-col items-center gap-1 border-r py-2">
          {[Cursor01Icon, PencilEdit02Icon, EraserIcon].map((icon, i) => (
            <span
              key={i}
              className={cn(
                "flex size-6 items-center justify-center rounded-md",
                i === 1 ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <HugeiconsIcon icon={icon} className="size-3.5" strokeWidth={1.8} />
            </span>
          ))}
          <span className="my-1 h-px w-4 bg-border" />
          <span className="size-3 rounded-full bg-sky-500 ring-1 ring-black/10 dark:ring-white/20" />
          <span className="my-1 h-px w-4 bg-border" />
          {["size-1", "size-1.5", "size-2.5"].map((size, i) => (
            <span key={i} className="flex size-5 items-center justify-center">
              <span className={cn("rounded-full bg-muted-foreground", size)} />
            </span>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
          <div className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10">
            {assets && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable */}
                <img
                  src={assets.prev[prevIndex]}
                  alt=""
                  className="absolute inset-0 size-full opacity-30"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable */}
                <img
                  src={assets.next[nextIndex]}
                  alt=""
                  className="absolute inset-0 size-full opacity-30"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable */}
                <img
                  src={assets.normal[index]}
                  alt=""
                  className="absolute inset-0 size-full"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
          <HugeiconsIcon icon={PlayIcon} className="size-2.5" strokeWidth={2} />
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {count ? index + 1 : 0} / {count}
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          <HugeiconsIcon icon={GhostIcon} className="size-2.5" strokeWidth={2} />
          Onion
        </span>

        <div className="flex flex-1 items-center gap-1 overflow-hidden">
          {assets?.normal.map((url, i) => (
            <span
              key={i}
              className={cn(
                "size-7 shrink-0 overflow-hidden rounded bg-white ring-1 ring-black/10 dark:ring-white/15",
                i === index && "ring-2 ring-primary dark:ring-primary"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable */}
              <img src={url} alt="" className="size-full object-cover" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
