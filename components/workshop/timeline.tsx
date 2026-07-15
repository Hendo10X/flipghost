"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowDown01Icon,
  Copy01Icon,
  Delete02Icon,
  GhostIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { FPS_OPTIONS, ONION_MAX, useFlipbook } from "@/lib/flipbook/store"
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ONION_COUNTS = Array.from({ length: ONION_MAX + 1 }, (_, i) => i)

/** Popover for how many frames to ghost on each side, and how strongly. */
function OnionSettings() {
  const onionBefore = useFlipbook((s) => s.onionBefore)
  const onionAfter = useFlipbook((s) => s.onionAfter)
  const onionOpacity = useFlipbook((s) => s.onionOpacity)
  const setOnionBefore = useFlipbook((s) => s.setOnionBefore)
  const setOnionAfter = useFlipbook((s) => s.setOnionAfter)
  const setOnionOpacity = useFlipbook((s) => s.setOnionOpacity)

  const rows: {
    label: string
    hint: string
    value: number
    onChange: (n: number) => void
  }[] = [
    {
      label: "Before",
      hint: "bg-red-500",
      value: onionBefore,
      onChange: setOnionBefore,
    },
    {
      label: "After",
      hint: "bg-green-500",
      value: onionAfter,
      onChange: setOnionAfter,
    },
  ]

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Onion skin settings"
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Onion skin settings</TooltipContent>
      </Tooltip>

      <PopoverContent side="top" align="start" className="w-60">
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", row.hint)} />
                <span className="text-xs font-medium">{row.label}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {row.value === 0
                    ? "off"
                    : `${row.value} frame${row.value > 1 ? "s" : ""}`}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={`Frames ghosted ${row.label.toLowerCase()}`}
                className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
              >
                {ONION_COUNTS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={row.value === count}
                    onClick={() => row.onChange(count)}
                    className={cn(
                      "flex-1 rounded-[5px] py-0.5 text-xs tabular-nums transition-colors select-none pointer-coarse:py-2",
                      row.value === count
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center">
              <span className="text-xs font-medium">Opacity</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                {Math.round(onionOpacity * 100)}%
              </span>
            </div>
            <Slider
              value={onionOpacity}
              onValueChange={(value) =>
                setOnionOpacity(Array.isArray(value) ? value[0] : value)
              }
              min={0.05}
              max={0.8}
              step={0.05}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function Timeline() {
  const frames = useFlipbook((s) => s.frames)
  const currentId = useFlipbook((s) => s.currentId)
  const selectFrame = useFlipbook((s) => s.selectFrame)
  const addFrame = useFlipbook((s) => s.addFrame)
  const duplicateFrame = useFlipbook((s) => s.duplicateFrame)
  const deleteFrame = useFlipbook((s) => s.deleteFrame)
  const reorderFrames = useFlipbook((s) => s.reorderFrames)
  const playing = useFlipbook((s) => s.playing)
  const setPlaying = useFlipbook((s) => s.setPlaying)
  const fps = useFlipbook((s) => s.fps)
  const setFps = useFlipbook((s) => s.setFps)
  const onionSkin = useFlipbook((s) => s.onionSkin)
  const toggleOnionSkin = useFlipbook((s) => s.toggleOnionSkin)

  const currentIndex = frames.findIndex((f) => f.id === currentId)
  const dragIndex = useRef<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // Stepping frames with the hotkeys moves the selection, which would
  // otherwise walk straight off the end of the strip and out of sight.
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-frame-id="${currentId}"]`)
    el?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [currentId, reducedMotion])

  return (
    <div className="flex flex-col gap-2 border-t px-4 py-3">
      {/* Height and a floor on width, rather than a square: the onion skin
          toggle carries a label and must stay its natural width. */}
      <div className="flex items-center gap-3 pointer-coarse:[&_[data-slot=button]]:h-11 pointer-coarse:[&_[data-slot=button]]:min-w-11">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-lg"
                aria-label={playing ? "Pause" : "Play"}
                data-cuelume-toggle
                onClick={() => setPlaying(!playing)}
              >
                <HugeiconsIcon
                  icon={playing ? PauseIcon : PlayIcon}
                  strokeWidth={1.8}
                />
              </Button>
            }
          />
          <TooltipContent>
            {playing ? "Pause (Space)" : "Play (Space)"}
          </TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground tabular-nums">
          {currentIndex + 1} / {frames.length}
        </span>

        <div className="mx-1 h-4 w-px bg-border" />

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
                "rounded-[5px] px-2 py-0.5 text-xs tabular-nums transition-colors select-none pointer-coarse:px-3 pointer-coarse:py-2",
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

        <div className="mx-1 h-4 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={onionSkin}
                data-cuelume-toggle
                onClick={toggleOnionSkin}
                className={cn(
                  "text-muted-foreground",
                  onionSkin && "bg-muted text-foreground"
                )}
              >
                <HugeiconsIcon icon={GhostIcon} strokeWidth={1.8} />
                Onion skin
              </Button>
            }
          />
          <TooltipContent>
            Show the previous and next frames as ghosts
          </TooltipContent>
        </Tooltip>

        <OnionSettings />

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Duplicate frame"
                  onClick={duplicateFrame}
                  className="text-muted-foreground"
                >
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Duplicate frame</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Delete frame"
                  onClick={deleteFrame}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={1.8} />
                </Button>
              }
            />
            <TooltipContent>Delete frame</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div ref={stripRef} className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
        {frames.map((frame, index) => (
          <button
            key={frame.id}
            type="button"
            data-frame-id={frame.id}
            draggable
            onDragStart={() => {
              dragIndex.current = index
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragIndex.current !== null && dragIndex.current !== index) {
                setDropIndex(index)
              }
            }}
            onDragLeave={() => setDropIndex((d) => (d === index ? null : d))}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex.current !== null) {
                reorderFrames(dragIndex.current, index)
              }
              dragIndex.current = null
              setDropIndex(null)
            }}
            onDragEnd={() => {
              dragIndex.current = null
              setDropIndex(null)
            }}
            onClick={() => selectFrame(frame.id)}
            aria-label={`Frame ${index + 1}`}
            aria-current={frame.id === currentId ? "true" : undefined}
            className={cn(
              "relative size-16 shrink-0 cursor-grab overflow-hidden rounded-lg bg-white ring-1 ring-black/10 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:ring-white/15",
              frame.id === currentId && "ring-2 ring-primary dark:ring-primary",
              dropIndex === index && "ring-2 ring-ring"
            )}
          >
            {frame.dataUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- data URL, not optimizable
              <img
                src={frame.dataUrl}
                alt=""
                draggable={false}
                className="size-full object-contain select-none"
              />
            )}
            <span className="absolute bottom-0.5 left-1.5 text-[10px] font-medium text-black/40 select-none">
              {index + 1}
            </span>
          </button>
        ))}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                aria-label="Add frame"
                data-cuelume-press
                data-cuelume-release
                onClick={addFrame}
                className="size-16 shrink-0 rounded-lg border-dashed text-muted-foreground"
              >
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.8} />
              </Button>
            }
          />
          <TooltipContent>Add a blank frame</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
