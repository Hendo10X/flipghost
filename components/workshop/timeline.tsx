"use client"

import { useRef, useState } from "react"
import {
  Copy01Icon,
  Delete02Icon,
  GhostIcon,
  PauseIcon,
  PlayIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { FPS_OPTIONS, useFlipbook } from "@/lib/flipbook/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

  return (
    <div className="flex flex-col gap-2 border-t px-4 py-3">
      <div className="flex items-center gap-3">
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

      <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
        {frames.map((frame, index) => (
          <button
            key={frame.id}
            type="button"
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
                className="size-full object-cover select-none"
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
