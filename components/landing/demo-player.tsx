"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { GhostIcon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { buildDemoFrames, DEMO_FPS } from "@/lib/flipbook/demo"
import { FPS_OPTIONS, onionStepOpacity, type Frame } from "@/lib/flipbook/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Recolors a frame snapshot to a flat tint, mirroring the editor's ghosts. */
function useTinted(dataUrl: string | null, color: string) {
  const [tinted, setTinted] = useState<{ source: string; result: string } | null>(
    null
  )

  useEffect(() => {
    if (!dataUrl) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      ctx.globalCompositeOperation = "source-in"
      ctx.fillStyle = color
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setTinted({ source: dataUrl, result: canvas.toDataURL() })
    }
    img.src = dataUrl
    return () => {
      cancelled = true
    }
  }, [dataUrl, color])

  return dataUrl && tinted?.source === dataUrl ? tinted.result : null
}

function Ghost({
  dataUrl,
  color,
  opacity,
}: {
  dataUrl: string | null
  color: string
  opacity: number
}) {
  const tinted = useTinted(dataUrl, color)
  if (!tinted) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
    <img
      src={tinted}
      alt=""
      aria-hidden
      draggable={false}
      style={{ opacity }}
      className="pointer-events-none absolute inset-0 size-full select-none"
    />
  )
}

export function DemoPlayer() {
  const [frames, setFrames] = useState<Frame[]>([])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [fps, setFps] = useState<number>(DEMO_FPS)
  const [onion, setOnion] = useState(false)
  const indexRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    buildDemoFrames()
      .then((built) => {
        if (!cancelled) setFrames(built)
      })
      .catch(() => {
        // A failed demo shouldn't take the page down.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!playing || frames.length === 0) return
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % frames.length
      setIndex(indexRef.current)
    }, 1000 / fps)
    return () => clearInterval(interval)
  }, [playing, fps, frames.length])

  const current = frames[index]
  const previous = index > 0 ? frames[index - 1] : frames[frames.length - 1]
  const next = frames[(index + 1) % (frames.length || 1)]
  const showGhosts = onion && !playing && frames.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-black/10">
        {frames.length === 0 ? (
          <div className="flex size-full items-center justify-center">
            <HugeiconsIcon
              icon={GhostIcon}
              className="size-6 animate-pulse text-muted-foreground"
              strokeWidth={1.8}
            />
          </div>
        ) : (
          <>
            {showGhosts && (
              <>
                <Ghost
                  dataUrl={previous?.dataUrl ?? null}
                  color="#ef4444"
                  opacity={onionStepOpacity(0.3, 1)}
                />
                <Ghost
                  dataUrl={next?.dataUrl ?? null}
                  color="#22c55e"
                  opacity={onionStepOpacity(0.3, 1)}
                />
              </>
            )}
            {current?.dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
              <img
                src={current.dataUrl}
                alt="Demo animation frame"
                draggable={false}
                className="size-full select-none"
              />
            )}
          </>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-wrap items-center gap-2">
        <Button
          size="icon-lg"
          aria-label={playing ? "Pause" : "Play"}
          data-cuelume-toggle
          onClick={() => setPlaying((p) => !p)}
        >
          <HugeiconsIcon
            icon={playing ? PauseIcon : PlayIcon}
            strokeWidth={1.8}
          />
        </Button>

        <div
          role="radiogroup"
          aria-label="Frames per second"
          className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
        >
          {FPS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={fps === option}
              onClick={() => setFps(option)}
              className={cn(
                "rounded-[5px] px-2 py-0.5 text-xs tabular-nums transition-colors select-none",
                fps === option
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">fps</span>

        <Button
          variant="ghost"
          size="sm"
          aria-pressed={onion}
          data-cuelume-toggle
          onClick={() => {
            setOnion((o) => !o)
            setPlaying(false)
          }}
          className={cn(
            "text-muted-foreground",
            onion && "bg-muted text-foreground"
          )}
        >
          <HugeiconsIcon icon={GhostIcon} strokeWidth={1.8} />
          Onion skin
        </Button>

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {frames.length ? index + 1 : 0} / {frames.length}
        </span>
      </div>

      {frames.length > 0 && (
        <div className="mx-auto flex w-full max-w-md items-center gap-2 overflow-x-auto pb-1">
          {frames.map((frame, i) => (
            <button
              key={frame.id}
              type="button"
              aria-label={`Frame ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => {
                setPlaying(false)
                indexRef.current = i
                setIndex(i)
              }}
              className={cn(
                "size-12 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-black/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring dark:ring-white/15",
                i === index && "ring-2 ring-primary dark:ring-primary"
              )}
            >
              {frame.dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
                <img
                  src={frame.dataUrl}
                  alt=""
                  draggable={false}
                  className="size-full object-cover select-none"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto">
        <Button render={<Link href="/workshop?demo=1" />} size="lg" className="px-4">
          Open this in the workshop
        </Button>
      </div>
    </div>
  )
}
